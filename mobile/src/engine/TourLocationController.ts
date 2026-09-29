// src/engine/TourLocationController.ts
// =============================================================================
// TourLocationController — Location-Aware Tour Progression
// =============================================================================
// Coordinates three independent systems:
//
//   TourSession        ← pure tour state (M5.1, engine/tourEngine.ts)
//   LocationProvider   ← current position source (M5.2, engine/location/types.ts)
//   distance utilities ← haversine calculation (M5.2, engine/distance.ts)
//
// Responsibilities:
//   - Subscribes to location updates from the LocationProvider.
//   - On each location update:
//       1. Obtains the current tour stop.
//       2. Calculates distance from traveler coordinates to stop coordinates.
//       3. Compares distance with stop.triggerRadiusMeters.
//       4. If distance <= triggerRadiusMeters, marks the stop as reached.
//   - Cleanly manages subscription lifecycle:
//       - Unsubscribes on stop / destroy.
//       - Replaces provider without leaving stale listeners active.
//       - Resets without duplicate listeners.
//   - Keeps all proximity & distance logic completely outside UI components.
//
// What this class does NOT do:
//   - It does NOT auto-advance to the next stop.
//     Advancing is an explicit user action: call moveToNextStop().
//   - It does not contain UI logic.
//   - It depends on the LocationProvider interface, not the simulator directly.
// =============================================================================

import type { Tour } from '@shared-types/index';
import {
  startTour,
  getCurrentStop,
  markCurrentStopReached,
  moveToNextStop,
  resetTour,
} from './tourEngine';
import type { TourSession } from './types';
import type { LocationProvider, Unsubscribe } from './location/types';
import { computeDistanceMeters, type GeoPoint } from './distance';

// ---------------------------------------------------------------------------
// StopCoordinateLookup
// A structural type — accepts any object with id + coordinates.
// Compatible with M1 Attraction[] without requiring direct M1 imports.
// ---------------------------------------------------------------------------

export interface StopCoordinateLookup {
  readonly id: string;
  readonly coordinates: { readonly latitude: number; readonly longitude: number };
}

/** Default maximum GPS accuracy (meters) accepted to trigger stop arrival. */
export const DEFAULT_MAX_ACCURACY_METERS = 50;

export interface TourLocationControllerOptions {
  /** Maximum allowable GPS accuracy radius in meters before a reading is considered unreliable for arrival. Default: 50. */
  readonly maxAccuracyMeters?: number;
}

// ---------------------------------------------------------------------------
// TourLocationController
// ---------------------------------------------------------------------------

export class TourLocationController {
  private _session: TourSession;
  private _provider: LocationProvider;
  private readonly _coordsByAttractionId: ReadonlyMap<string, GeoPoint>;
  private _unsubscribeLocation: Unsubscribe | null = null;
  private _isListening: boolean = false;
  private _lastLocation: GeoPoint | null = null;
  private _lastLocationTimestamp: number = 0;
  private _lastTransitionTimestamp: number = 0;
  private readonly _maxAccuracyMeters: number;
  private readonly _sessionListeners: Set<(session: TourSession) => void> = new Set();

  /**
   * Constructs a TourLocationController.
   *
   * @param session            Active or fresh TourSession.
   * @param provider           Any LocationProvider implementation.
   * @param attractions        Objects with `id` and `coordinates`.
   * @param autoStartListening If true (default), automatically starts listening for updates.
   * @param options            Optional configuration (e.g. maxAccuracyMeters).
   */
  constructor(
    session: TourSession,
    provider: LocationProvider,
    attractions: readonly StopCoordinateLookup[],
    autoStartListening: boolean = true,
    options?: TourLocationControllerOptions,
  ) {
    this._session = session;
    this._provider = provider;
    this._coordsByAttractionId = new Map<string, GeoPoint>(
      attractions.map((a) => [
        a.id,
        { latitude: a.coordinates.latitude, longitude: a.coordinates.longitude },
      ]),
    );
    this._maxAccuracyMeters = options?.maxAccuracyMeters ?? DEFAULT_MAX_ACCURACY_METERS;

    if (autoStartListening) {
      this.startListening();
    }
  }

  // ---------------------------------------------------------------------------
  // Factory method (convenience for starting from a Tour)
  // ---------------------------------------------------------------------------

  /**
   * Creates and initializes a TourLocationController for a given tour.
   */
  static create(
    tour: Tour,
    provider: LocationProvider,
    attractions: readonly StopCoordinateLookup[],
    autoStartListening: boolean = true,
    options?: TourLocationControllerOptions,
  ): TourLocationController {
    return new TourLocationController(
      startTour(tour),
      provider,
      attractions,
      autoStartListening,
      options,
    );
  }

  // ---------------------------------------------------------------------------
  // Subscription Lifecycle Management
  // ---------------------------------------------------------------------------

  /**
   * Starts listening for location updates from the provider.
   * Idempotent: calling when already listening is a safe no-op.
   */
  startListening(): void {
    if (this._isListening && this._unsubscribeLocation) return;
    if (this._unsubscribeLocation) {
      this._unsubscribeLocation();
      this._unsubscribeLocation = null;
    }
    this._unsubscribeLocation = this._provider.subscribe(this._onLocationUpdate);
    this._isListening = true;
  }

  /**
   * Stops listening for location updates and removes the active listener.
   * Ensures no stale callbacks remain registered with the provider.
   */
  stopListening(): void {
    if (this._unsubscribeLocation) {
      this._unsubscribeLocation();
      this._unsubscribeLocation = null;
    }
    this._isListening = false;
  }

  /**
   * Full cleanup: stops listening and clears all session subscriptions.
   */
  destroy(): void {
    this.stopListening();
    this._sessionListeners.clear();
  }

  /** True if the controller is currently subscribed to location updates. */
  get isListening(): boolean {
    return this._isListening;
  }

  /**
   * High-level provider control: starts the provider and begins listening.
   */
  start(): void {
    this._provider.start();
    this.startListening();
  }

  /**
   * High-level provider control: stops listening and stops the provider.
   */
  stop(): void {
    this.stopListening();
    this._provider.stop();
  }

  // ---------------------------------------------------------------------------
  // Provider & Session Replacement
  // ---------------------------------------------------------------------------

  /** Returns the active LocationProvider instance. */
  getProvider(): LocationProvider {
    return this._provider;
  }

  /**
   * Replaces the LocationProvider.
   * Cleanly unsubscribes from the old provider to prevent stale listeners,
   * then connects to the new provider if the controller was listening.
   */
  setProvider(newProvider: LocationProvider): void {
    const wasListening = this._isListening;
    this.stopListening(); // Unsubscribes from the old provider cleanly
    this._provider = newProvider;
    if (wasListening) {
      this.startListening(); // Subscribes to the new provider
    }
  }

  /**
   * Replaces the TourSession (e.g. restoring saved state).
   */
  setSession(newSession: TourSession): void {
    this._session = newSession;
    this._notifySessionListeners();
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  /** The current tour session state. Immutable snapshot. */
  getSession(): TourSession {
    return this._session;
  }

  /** The last known location processed by the controller, if any. */
  getLastLocation(): GeoPoint | null {
    return this._lastLocation ? { ...this._lastLocation } : null;
  }

  /**
   * The coordinates of the current stop's attraction, or null if:
   *   - The tour is complete.
   *   - The attraction ID is not found in the lookup.
   */
  getCurrentStopCoords(): GeoPoint | null {
    const stop = getCurrentStop(this._session);
    if (!stop) return null;
    return this._coordsByAttractionId.get(stop.attractionId) ?? null;
  }

  /** The maximum acceptable GPS accuracy radius in meters for arrival triggering. */
  get maxAccuracyMeters(): number {
    return this._maxAccuracyMeters;
  }

  /**
   * Distance in meters from the current position to the current stop.
   *
   * Returns null when:
   *   - The tour is complete (no current stop).
   *   - The stop's attraction coordinates are not in the lookup.
   *   - The current position contains invalid/NaN coordinates.
   */
  getDistanceToCurrentStop(): number | null {
    const stopCoords = this.getCurrentStopCoords();
    if (!stopCoords) return null;
    const currentPos = this._lastLocation ?? this._provider.getCurrentLocation();
    if (
      currentPos == null ||
      typeof currentPos.latitude !== 'number' ||
      typeof currentPos.longitude !== 'number' ||
      isNaN(currentPos.latitude) ||
      isNaN(currentPos.longitude)
    ) {
      return null;
    }
    return computeDistanceMeters(currentPos, stopCoords);
  }

  // ---------------------------------------------------------------------------
  // Location Processing & Arrival Detection
  // ---------------------------------------------------------------------------

  /**
   * Internal callback invoked whenever the provider emits a location update.
   */
  private _onLocationUpdate = (location: GeoPoint): void => {
    this._lastLocation = { ...location };
    this._lastLocationTimestamp = location.timestamp ?? Date.now();
    this.checkLocation(location);
  };

  /**
   * Evaluates a location against the current stop's trigger radius.
   *
   * Behavior:
   *   - If the tour is complete: no-op.
   *   - If the stop was already reached: no-op (idempotent, does not duplicate).
   *   - Guards against corrupted or NaN coordinates.
   *   - Guards against stale location updates arriving from before a stop transition.
   *   - Guards against inaccurate/low-confidence GPS readings (> maxAccuracyMeters).
   *   - If distance <= triggerRadiusMeters AND accuracy is reliable:
   *       Marks stop as reached.
   *       Notifies session subscribers.
   *   - Does NOT advance to the next stop (user action required).
   *
   * @param overrideLocation Optional coordinates to evaluate. If omitted,
   *                         uses last known location or provider's current location.
   * @returns The updated TourSession.
   */
  checkLocation(overrideLocation?: GeoPoint): TourSession {
    // Early exits
    if (this._session.isComplete) return this._session;
    if (this._session.isCurrentStopReached) return this._session; // idempotent

    const stop = getCurrentStop(this._session);
    const stopCoords = this.getCurrentStopCoords();
    if (!stop || !stopCoords) return this._session;

    const locationToCheck =
      overrideLocation ??
      this._lastLocation ??
      this._provider.getCurrentLocation();

    // Guard against invalid/corrupted coordinates (e.g. NaN or missing)
    if (
      locationToCheck == null ||
      typeof locationToCheck.latitude !== 'number' ||
      typeof locationToCheck.longitude !== 'number' ||
      isNaN(locationToCheck.latitude) ||
      isNaN(locationToCheck.longitude)
    ) {
      return this._session;
    }

    // Edge case 4: Prevent stale location updates from before the stop transition
    const locationTimestamp =
      locationToCheck.timestamp ??
      (locationToCheck === this._lastLocation ? this._lastLocationTimestamp : 0);

    if (
      this._lastTransitionTimestamp > 0 &&
      locationTimestamp > 0 &&
      locationTimestamp < this._lastTransitionTimestamp
    ) {
      return this._session;
    }

    const distance = computeDistanceMeters(locationToCheck, stopCoords);

    // If within or exactly at triggerRadiusMeters
    if (distance <= stop.triggerRadiusMeters) {
      // Edge case 2: Reject inaccurate / low-confidence GPS readings
      if (
        locationToCheck.accuracy != null &&
        (locationToCheck.accuracy <= 0 ||
          isNaN(locationToCheck.accuracy) ||
          locationToCheck.accuracy > this._maxAccuracyMeters)
      ) {
        // Location is within geometric radius, but confidence is too low
        return this._session;
      }

      this._session = markCurrentStopReached(this._session);
      this._notifySessionListeners();
    }

    return this._session;
  }

  // ---------------------------------------------------------------------------
  // Progression
  // ---------------------------------------------------------------------------

  /**
   * Advances to the next stop (or marks the tour complete on the final stop).
   *
   * Requirements (inherited from engine/tourEngine.ts):
   *   - The current stop must be reached first.
   *   - Returns the session unchanged if the stop was not yet reached.
   *   - No-op if the tour is already complete.
   *
   * @returns The updated TourSession.
   */
  moveToNextStop(): TourSession {
    this._session = moveToNextStop(this._session);
    this._lastTransitionTimestamp = Date.now();
    this._notifySessionListeners();
    return this._session;
  }

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  /**
   * Resets the tour session to its initial state AND resets the
   * LocationProvider to the first stop's coordinates.
   *
   * Preserves existing subscriptions cleanly without duplication.
   *
   * @param overrideStartCoords Optional start position for the provider reset.
   * @returns The fresh TourSession.
   */
  reset(overrideStartCoords?: GeoPoint): TourSession {
    this._session = resetTour(this._session);
    this._lastTransitionTimestamp = Date.now();
    this._lastLocation = null;
    this._lastLocationTimestamp = 0;

    const firstStop = this._session.tour.stops[0];
    const resetTarget: GeoPoint =
      overrideStartCoords ??
      (firstStop
        ? (this._coordsByAttractionId.get(firstStop.attractionId) ?? { latitude: 0, longitude: 0 })
        : { latitude: 0, longitude: 0 });

    this._provider.reset(resetTarget);
    this._notifySessionListeners();
    return this._session;
  }

  // ---------------------------------------------------------------------------
  // Session Subscription
  // ---------------------------------------------------------------------------

  /**
   * Subscribes a listener to receive session state updates
   * (e.g. stop reached, stop advanced, reset).
   */
  subscribe(listener: (session: TourSession) => void): Unsubscribe {
    this._sessionListeners.add(listener);
    return () => {
      this._sessionListeners.delete(listener);
    };
  }

  private _notifySessionListeners(): void {
    for (const listener of this._sessionListeners) {
      listener(this._session);
    }
  }
}
