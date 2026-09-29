// src/hooks/useActiveTour.ts
// =============================================================================
// useActiveTour — React Hook for Active Tour Progression (M6.2)
// =============================================================================
// Connects TourSession (M5.1), LocationProvider (M5.2 / M6.1), and
// TourLocationController (M5.3) to the React UI lifecycle.
//
// Responsibilities:
//   - By default, selects DeviceLocationProvider for the real traveler experience.
//   - Allows switching to SimulatedLocationProvider for development/testing.
//   - Subscribes to location updates, session updates, and permission/provider status.
//   - Exposes pure state: current stop, attraction, story, distance, progress, permission state.
//   - Exposes traveler actions: moveToNextStop, resetTour, retryPermission.
//   - Exposes dev controls: mode toggle, stepTowardCurrentStop, arriveAtCurrentStop.
//   - Cleanly stops and destroys subscriptions on component unmount (no leaks).
// =============================================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Tour, Attraction, Story, TourStop } from '@shared-types/index';
import { tours, attractions, stories } from '@data/index';
import type { TourSession } from '../engine/types';
import { progressFraction } from '../engine/types';
import { TourLocationController } from '../engine/TourLocationController';
import type { LocationProvider } from '../engine/location/types';
import { SimulatedLocationProvider } from '../engine/location/SimulatedLocationProvider';
import { DeviceLocationProvider, type DeviceLocationStatus } from '../engine/location/DeviceLocationProvider';
import type { GeoPoint } from '../engine/distance';

export interface ActiveTourOptions {
  /**
   * Location provider mode:
   *   'device'    — real GPS via DeviceLocationProvider (default)
   *   'simulated' — deterministic development simulator
   */
  mode?: 'device' | 'simulated';

  /**
   * Optional custom LocationProvider instance (useful for unit tests/mocking).
   */
  provider?: LocationProvider;
}

export interface ActiveTourHookResult {
  /** The tour being walked, or null if tourId is invalid. */
  tour: Tour | null;

  /** Active session state snapshot. */
  session: TourSession | null;

  /** Current TourStop being visited, or null if complete/invalid. */
  currentStop: TourStop | null;

  /** Resolved Attraction for current stop from M1 data. */
  currentAttraction: Attraction | null;

  /** Resolved Story for current stop from M1 data. */
  currentStory: Story | null;

  /** Distance in meters to the current stop, or null if complete. */
  distanceMeters: number | null;

  /** Current traveler coordinates (real GPS or simulated). */
  simulatedLocation: GeoPoint | null;

  /** Semantic alias for traveler coordinates. */
  travelerLocation: GeoPoint | null;

  /** Active location mode ('device' | 'simulated'). */
  mode: 'device' | 'simulated';

  /** True if using simulated coordinates. */
  isSimulated: boolean;

  /** Status of location provider (idle, starting, active, permission-denied, etc.). */
  locationStatus: DeviceLocationStatus | 'simulated';

  /** True if location permission was denied. */
  isPermissionDenied: boolean;

  /** True if location is temporarily unavailable (e.g. GPS error or disabled services). */
  isLocationUnavailable: boolean;

  /** True if current location fix has low confidence / high uncertainty (> 50m). */
  isLowAccuracy: boolean;

  /** True once traveler is within triggerRadiusMeters of the current stop. */
  isReached: boolean;

  /** True once all stops have been completed. */
  isComplete: boolean;

  /** 1-based stop number (e.g. 1 for stop 1). */
  stopNumber: number;

  /** Total stops in this tour. */
  totalStops: number;

  /** Progress fraction between 0.0 and 1.0. */
  progress: number;

  /** Traveler advances to the next stop. */
  moveToNextStop: () => void;

  /** Resets the tour session and provider back to stop 1. */
  resetTour: () => void;

  /** Retries requesting foreground location permission if previously denied. */
  retryPermission: () => void;

  /** Switches between device GPS and simulator mode. */
  setMode: (mode: 'device' | 'simulated') => void;

  /** Development simulator controls. */
  devControls: {
    /** Simulates walking 40% closer to the current stop (simulated mode only). */
    stepTowardCurrentStop: () => void;

    /** Teleports traveler into trigger radius (simulated mode only). */
    arriveAtCurrentStop: () => void;

    /** Resets the simulator coordinates and tour state. */
    resetSimulator: () => void;

    /** Active listener count on the provider. */
    listenerCount: number;
  };
}

export function useActiveTour(
  tourId: string,
  options?: ActiveTourOptions,
): ActiveTourHookResult {
  const tour = useMemo(() => tours.find((t) => t.id === tourId) ?? null, [tourId]);

  // Mode state: defaults to 'device' unless specified
  const [mode, setMode] = useState<'device' | 'simulated'>(options?.mode ?? 'device');

  // Controller and provider held in refs so they persist across re-renders
  const controllerRef = useRef<TourLocationController | null>(null);
  const providerRef = useRef<LocationProvider | null>(null);

  // Reactive state
  const [session, setSession] = useState<TourSession | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [travelerLocation, setTravelerLocation] = useState<GeoPoint | null>(null);
  const [locationStatus, setLocationStatus] = useState<DeviceLocationStatus | 'simulated'>(
    mode === 'device' ? 'starting' : 'simulated',
  );

  // Initialize controller and provider for the tour and mode
  useEffect(() => {
    if (!tour || tour.stops.length === 0) return;

    // First stop's attraction coordinates as initial fallback
    const firstAttraction = attractions.find((a) => a.id === tour.stops[0].attractionId);
    const startCoords = firstAttraction?.coordinates ?? { latitude: 0, longitude: 0 };

    // Select provider based on mode or explicit option
    let provider: LocationProvider;
    if (options?.provider) {
      provider = options.provider;
    } else if (mode === 'device') {
      provider = new DeviceLocationProvider(startCoords);
    } else {
      provider = new SimulatedLocationProvider(startCoords);
    }

    const controller = TourLocationController.create(tour, provider, attractions, false);

    providerRef.current = provider;
    controllerRef.current = controller;

    setSession(controller.getSession());
    setTravelerLocation(provider.getCurrentLocation());
    setDistanceMeters(controller.getDistanceToCurrentStop());

    // Subscribe to session changes (stop reached, stop advanced, reset)
    const unsubSession = controller.subscribe((newSession) => {
      setSession(newSession);
      setDistanceMeters(controller.getDistanceToCurrentStop());
    });

    // Subscribe to location updates
    const unsubLocation = provider.subscribe((newLocation) => {
      setTravelerLocation(newLocation);
      setDistanceMeters(controller.getDistanceToCurrentStop());
    });

    // Subscribe to status changes if DeviceLocationProvider
    let unsubStatus: (() => void) | undefined;
    if (provider instanceof DeviceLocationProvider) {
      unsubStatus = provider.subscribeStatus((newStatus) => {
        setLocationStatus(newStatus);
      });
    } else {
      setLocationStatus('simulated');
    }

    // Start controller and provider
    controller.start();
    controller.checkLocation();

    return () => {
      unsubSession();
      unsubLocation();
      unsubStatus?.();
      controller.stop();
      controller.destroy();
      controllerRef.current = null;
      providerRef.current = null;
    };
  }, [tour, mode, options?.provider]);

  // Resolve current stop
  const currentStop = useMemo<TourStop | null>(() => {
    if (!tour || !session || session.isComplete) return null;
    return tour.stops[session.currentStopIndex] ?? null;
  }, [tour, session]);

  // Resolve current attraction from M1 data
  const currentAttraction = useMemo<Attraction | null>(() => {
    if (!currentStop) return null;
    return attractions.find((a) => a.id === currentStop.attractionId) ?? null;
  }, [currentStop]);

  // Resolve current story from M1 data
  const currentStory = useMemo<Story | null>(() => {
    if (!currentStop) return null;
    return stories.find((s) => s.id === currentStop.storyId) ?? null;
  }, [currentStop]);

  // Actions
  const moveToNextStop = useCallback(() => {
    if (!controllerRef.current) return;
    const updated = controllerRef.current.moveToNextStop();
    setSession(updated);
    setDistanceMeters(controllerRef.current.getDistanceToCurrentStop());
  }, []);

  const resetTour = useCallback(() => {
    if (!controllerRef.current) return;
    const updated = controllerRef.current.reset();
    setSession(updated);
    if (providerRef.current) {
      // Ensure provider is running
      if (!providerRef.current.isRunning) {
        providerRef.current.start();
      }
      setTravelerLocation(providerRef.current.getCurrentLocation());
    }
    setDistanceMeters(controllerRef.current.getDistanceToCurrentStop());
  }, []);

  const retryPermission = useCallback(() => {
    if (providerRef.current && providerRef.current instanceof DeviceLocationProvider) {
      providerRef.current.start();
    }
  }, []);

  // Developer simulator controls
  const stepTowardCurrentStop = useCallback(() => {
    const controller = controllerRef.current;
    const provider = providerRef.current;
    if (!controller || !provider) return;

    if (provider instanceof SimulatedLocationProvider) {
      const targetCoords = controller.getCurrentStopCoords();
      if (!targetCoords) return;
      provider.moveToward(targetCoords);
    }
  }, []);

  const arriveAtCurrentStop = useCallback(() => {
    const controller = controllerRef.current;
    const provider = providerRef.current;
    if (!controller || !provider || !currentStop) return;

    if (provider instanceof SimulatedLocationProvider) {
      const targetCoords = controller.getCurrentStopCoords();
      if (!targetCoords) return;
      provider.arriveAt(targetCoords, currentStop.triggerRadiusMeters);
    }
  }, [currentStop]);

  const totalStops = tour ? tour.stops.length : 0;
  const stopNumber = session ? session.currentStopIndex + 1 : 1;
  const isReached = session ? session.isCurrentStopReached : false;
  const isComplete = session ? session.isComplete : false;
  const progress = session ? progressFraction(session) : 0;
  const listenerCount = providerRef.current
    ? (providerRef.current as any).listenerCount ?? 0
    : 0;

  const isPermissionDenied = locationStatus === 'permission-denied';
  const isLocationUnavailable = locationStatus === 'unavailable';
  const isLowAccuracy =
    travelerLocation?.accuracy != null && travelerLocation.accuracy > 50;
  const isSimulated = mode === 'simulated';

  return {
    tour,
    session,
    currentStop,
    currentAttraction,
    currentStory,
    distanceMeters,
    simulatedLocation: travelerLocation,
    travelerLocation,
    mode,
    isSimulated,
    locationStatus,
    isPermissionDenied,
    isLocationUnavailable,
    isLowAccuracy,
    isReached,
    isComplete,
    stopNumber,
    totalStops,
    progress,
    moveToNextStop,
    resetTour,
    retryPermission,
    setMode,
    devControls: {
      stepTowardCurrentStop,
      arriveAtCurrentStop,
      resetSimulator: resetTour,
      listenerCount,
    },
  };
}
