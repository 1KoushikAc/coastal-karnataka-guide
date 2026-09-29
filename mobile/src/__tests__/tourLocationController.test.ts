// src/__tests__/tourLocationController.test.ts
// =============================================================================
// TourLocationController — Unit Tests
// =============================================================================
// Tests the coordination between TourSession, LocationProvider, and distance.
// Uses SimulatedLocationProvider for deterministic coordinate control.
// No React, no React Native, no device GPS.
// =============================================================================

import type { Tour } from '@shared-types/index';
import { TourLocationController } from '../engine/TourLocationController';
import { SimulatedLocationProvider } from '../engine/location/SimulatedLocationProvider';
import type { LocationProvider, LocationListener, Unsubscribe } from '../engine/location/types';
import { computeDistanceMeters, offsetPoint, type GeoPoint } from '../engine/distance';
import { startTour } from '../engine/tourEngine';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const STOP_1_COORDS: GeoPoint = { latitude: 0, longitude: 0 };
const STOP_2_COORDS: GeoPoint = { latitude: 0.01, longitude: 0 }; // ~1113 m north
const STOP_3_COORDS: GeoPoint = { latitude: 0.02, longitude: 0 }; // ~2226 m north

const TRIGGER_RADIUS = 50; // meters

/** Creates a two-stop tour for most tests. */
const TWO_STOP_TOUR: Tour = {
  id: 'two-stop-tour',
  cityId: 'test-city',
  name: 'Two Stop Test Tour',
  description: '',
  category: 'history',
  estimatedDurationMinutes: 60,
  stops: [
    {
      id: 'stop-1',
      attractionId: 'attr-1',
      order: 1,
      triggerRadiusMeters: TRIGGER_RADIUS,
      storyId: 'story-1',
    },
    {
      id: 'stop-2',
      attractionId: 'attr-2',
      order: 2,
      triggerRadiusMeters: TRIGGER_RADIUS,
      storyId: 'story-2',
    },
  ],
};

/** A three-stop tour for final-stop completion tests. */
const THREE_STOP_TOUR: Tour = {
  id: 'three-stop-tour',
  cityId: 'test-city',
  name: 'Three Stop Test Tour',
  description: '',
  category: 'history',
  estimatedDurationMinutes: 90,
  stops: [
    { id: 'stop-1', attractionId: 'attr-1', order: 1, triggerRadiusMeters: TRIGGER_RADIUS, storyId: 'story-1' },
    { id: 'stop-2', attractionId: 'attr-2', order: 2, triggerRadiusMeters: TRIGGER_RADIUS, storyId: 'story-2' },
    { id: 'stop-3', attractionId: 'attr-3', order: 3, triggerRadiusMeters: TRIGGER_RADIUS, storyId: 'story-3' },
  ],
};

/** Structural lookup — no import of M1 Attraction type needed. */
const TEST_ATTRACTIONS = [
  { id: 'attr-1', coordinates: STOP_1_COORDS },
  { id: 'attr-2', coordinates: STOP_2_COORDS },
  { id: 'attr-3', coordinates: STOP_3_COORDS },
];

/** Creates a controller with the provider positioned outside any stop. */
function makeTwoStopController(): {
  controller: TourLocationController;
  provider: SimulatedLocationProvider;
} {
  const provider = new SimulatedLocationProvider(STOP_1_COORDS);
  // Default start is 120 m north — outside 50 m trigger radius
  const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);
  return { controller, provider };
}

// ---------------------------------------------------------------------------
// 1. Location outside trigger radius → stop remains unreached
// ---------------------------------------------------------------------------

describe('1. Location outside trigger radius', () => {
  test('stop remains unreached when provider starts outside trigger radius', () => {
    const { controller } = makeTwoStopController();
    expect(controller.getSession().isCurrentStopReached).toBe(false);
  });

  test('distance calculation reflects position outside radius', () => {
    const { controller } = makeTwoStopController();
    const dist = controller.getDistanceToCurrentStop();
    expect(dist).not.toBeNull();
    expect(dist!).toBeGreaterThan(TRIGGER_RADIUS);
  });

  test('multiple location updates outside radius keep stop unreached', () => {
    const { controller, provider } = makeTwoStopController();
    // Move to various points outside radius
    provider.setLocation({ latitude: 0.002, longitude: 0 }); // ~222m north
    provider.setLocation({ latitude: 0.005, longitude: 0 }); // ~556m north
    expect(controller.getSession().isCurrentStopReached).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. Location inside trigger radius → stop is reached
// ---------------------------------------------------------------------------

describe('2. Location inside trigger radius', () => {
  test('location update inside trigger radius automatically marks current stop as reached', () => {
    const { controller, provider } = makeTwoStopController();
    expect(controller.getSession().isCurrentStopReached).toBe(false);

    // Move to 25m north of stop 1 (inside 50m radius)
    const insideCoords = offsetPoint(STOP_1_COORDS, 25, 0);
    provider.setLocation(insideCoords);

    expect(controller.getSession().isCurrentStopReached).toBe(true);
  });

  test('session listener is notified when stop is reached', () => {
    const { controller, provider } = makeTwoStopController();
    const sessionUpdates: boolean[] = [];

    controller.subscribe((session) => {
      sessionUpdates.push(session.isCurrentStopReached);
    });

    provider.setLocation(STOP_1_COORDS); // exact coordinates
    expect(sessionUpdates.length).toBeGreaterThan(0);
    expect(sessionUpdates[sessionUpdates.length - 1]).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Location exactly at trigger radius
// ---------------------------------------------------------------------------

describe('3. Location exactly at trigger radius', () => {
  test('traveler exactly at trigger radius (<= triggerRadiusMeters) triggers arrival', () => {
    const { controller, provider } = makeTwoStopController();
    // Offset exactly TRIGGER_RADIUS (50m) north
    const exactlyAtRadius = offsetPoint(STOP_1_COORDS, TRIGGER_RADIUS, 0);

    const actualDist = computeDistanceMeters(exactlyAtRadius, STOP_1_COORDS);
    expect(actualDist).toBeCloseTo(TRIGGER_RADIUS, 1);

    provider.setLocation(exactlyAtRadius);
    expect(controller.getSession().isCurrentStopReached).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Duplicate location updates do not complete the same stop twice
// ---------------------------------------------------------------------------

describe('4. Duplicate location updates', () => {
  test('duplicate location updates do not complete the same stop twice', () => {
    const { controller, provider } = makeTwoStopController();

    // First arrival
    provider.setLocation(STOP_1_COORDS);
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    expect(controller.getSession().completedStopIndices.length).toBe(0); // not yet completed/advanced

    // Additional location updates while at the stop
    provider.setLocation(STOP_1_COORDS);
    provider.setLocation(offsetPoint(STOP_1_COORDS, 5, 0));
    provider.setLocation(offsetPoint(STOP_1_COORDS, 10, 0));

    expect(controller.getSession().isCurrentStopReached).toBe(true);
    expect(controller.getSession().completedStopIndices.length).toBe(0);

    // Advance once
    controller.moveToNextStop();
    expect(controller.getSession().completedStopIndices.length).toBe(1);
    expect(controller.getSession().completedStopIndices[0]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 5. Reaching a stop and then processing the next stop
// ---------------------------------------------------------------------------

describe('5. Reaching a stop and processing the next stop', () => {
  test('reaching stop 1, advancing, then moving to stop 2 reaches stop 2', () => {
    const { controller, provider } = makeTwoStopController();

    // 1. Arrive at stop 1
    provider.setLocation(STOP_1_COORDS);
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    expect(controller.getSession().currentStopIndex).toBe(0);

    // 2. Advance to stop 2
    controller.moveToNextStop();
    expect(controller.getSession().currentStopIndex).toBe(1);
    expect(controller.getSession().isCurrentStopReached).toBe(false);

    // Current distance is now to stop 2
    const distToStop2 = controller.getDistanceToCurrentStop();
    expect(distToStop2).toBeGreaterThan(1000); // stop 2 is ~1113m away

    // 3. Move near stop 2
    provider.setLocation(offsetPoint(STOP_2_COORDS, 20, 0)); // 20m from stop 2
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    expect(controller.getSession().currentStopIndex).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 6. Final stop completion
// ---------------------------------------------------------------------------

describe('6. Final stop completion', () => {
  test('reaching and completing the final stop completes the tour', () => {
    const provider = new SimulatedLocationProvider(STOP_1_COORDS);
    const controller = TourLocationController.create(THREE_STOP_TOUR, provider, TEST_ATTRACTIONS);

    // Stop 1
    provider.setLocation(STOP_1_COORDS);
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    controller.moveToNextStop();

    // Stop 2
    provider.setLocation(STOP_2_COORDS);
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    controller.moveToNextStop();

    // Stop 3 (final)
    provider.setLocation(STOP_3_COORDS);
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    expect(controller.getSession().isComplete).toBe(false);

    // Complete final stop
    controller.moveToNextStop();
    expect(controller.getSession().isComplete).toBe(true);
    expect(controller.getSession().completedStopIndices.length).toBe(3);

    // Subsequent location updates after completion do not alter state
    provider.setLocation(STOP_1_COORDS);
    expect(controller.getSession().isComplete).toBe(true);
    expect(controller.getDistanceToCurrentStop()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 7. Moving away and returning
// ---------------------------------------------------------------------------

describe('7. Moving away and returning', () => {
  test('moving away from a reached stop keeps it reached', () => {
    const { controller, provider } = makeTwoStopController();

    // Arrive at stop 1
    provider.setLocation(STOP_1_COORDS);
    expect(controller.getSession().isCurrentStopReached).toBe(true);

    // Move 500m away
    provider.setLocation(offsetPoint(STOP_1_COORDS, 500, 0));
    expect(controller.getSession().isCurrentStopReached).toBe(true); // remains reached
  });

  test('after reset, moving away and returning triggers arrival again', () => {
    const { controller, provider } = makeTwoStopController();

    provider.setLocation(STOP_1_COORDS);
    expect(controller.getSession().isCurrentStopReached).toBe(true);

    // Reset tour
    controller.reset();
    expect(controller.getSession().isCurrentStopReached).toBe(false);

    // Move back to stop 1
    provider.setLocation(STOP_1_COORDS);
    expect(controller.getSession().isCurrentStopReached).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. Reset behavior
// ---------------------------------------------------------------------------

describe('8. Reset behavior', () => {
  test('reset returns session to initial state and preserves location listening', () => {
    const { controller, provider } = makeTwoStopController();

    // Progress through stop 1
    provider.setLocation(STOP_1_COORDS);
    controller.moveToNextStop();
    expect(controller.getSession().currentStopIndex).toBe(1);

    // Reset
    controller.reset();
    expect(controller.getSession().currentStopIndex).toBe(0);
    expect(controller.getSession().completedStopIndices.length).toBe(0);
    expect(controller.getSession().isCurrentStopReached).toBe(false);
    expect(controller.isListening).toBe(true);

    // Verify listeners are still active and receive new updates
    provider.setLocation(STOP_1_COORDS);
    expect(controller.getSession().isCurrentStopReached).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9. Provider replacement & unsubscription
// ---------------------------------------------------------------------------

describe('9. Provider replacement & unsubscription', () => {
  test('setProvider cleans up old provider subscription and connects new provider', () => {
    const providerA = new SimulatedLocationProvider(STOP_1_COORDS);
    const providerB = new SimulatedLocationProvider(STOP_1_COORDS);

    const controller = TourLocationController.create(TWO_STOP_TOUR, providerA, TEST_ATTRACTIONS);
    expect(providerA.listenerCount).toBe(1);
    expect(providerB.listenerCount).toBe(0);

    // Replace providerA with providerB
    controller.setProvider(providerB);

    // Stale listener removed from providerA!
    expect(providerA.listenerCount).toBe(0);
    // New listener active on providerB!
    expect(providerB.listenerCount).toBe(1);

    // Emitting on old provider has NO effect
    providerA.setLocation(STOP_1_COORDS);
    expect(controller.getSession().isCurrentStopReached).toBe(false);

    // Emitting on new provider triggers arrival
    providerB.setLocation(STOP_1_COORDS);
    expect(controller.getSession().isCurrentStopReached).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. No stale location listeners after cleanup
// ---------------------------------------------------------------------------

describe('10. No stale location listeners after cleanup', () => {
  test('stopListening removes provider listener', () => {
    const provider = new SimulatedLocationProvider(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);

    expect(provider.listenerCount).toBe(1);
    expect(controller.isListening).toBe(true);

    controller.stopListening();
    expect(provider.listenerCount).toBe(0);
    expect(controller.isListening).toBe(false);

    // Provider updates do not affect stopped controller
    provider.setLocation(STOP_1_COORDS);
    expect(controller.getSession().isCurrentStopReached).toBe(false);
  });

  test('destroy completely cleans up provider listener and session listeners', () => {
    const provider = new SimulatedLocationProvider(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);

    const sessionCallback = jest.fn();
    controller.subscribe(sessionCallback);

    expect(provider.listenerCount).toBe(1);

    controller.destroy();
    expect(provider.listenerCount).toBe(0);
    expect(controller.isListening).toBe(false);

    // Emitting on provider after destroy does not call sessionCallback
    provider.setLocation(STOP_1_COORDS);
    expect(sessionCallback).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 11. Direct instantiation and abstraction
// ---------------------------------------------------------------------------

describe('11. Direct instantiation and abstraction', () => {
  test('constructor accepts TourSession directly', () => {
    const session = startTour(TWO_STOP_TOUR);
    const provider = new SimulatedLocationProvider(STOP_1_COORDS);
    const controller = new TourLocationController(session, provider, TEST_ATTRACTIONS);

    expect(controller.getSession().hasStarted).toBe(true);
    expect(controller.isListening).toBe(true);

    provider.setLocation(STOP_1_COORDS);
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    controller.destroy();
  });

  test('works with any custom LocationProvider implementation', () => {
    let _coords: GeoPoint = { latitude: 0, longitude: 0 };
    const listeners = new Set<LocationListener>();

    const mockProvider: LocationProvider = {
      isRunning: true,
      start() {},
      stop() {},
      getCurrentLocation: () => ({ ..._coords }),
      reset(c: GeoPoint) { _coords = c; },
      subscribe(l: LocationListener): Unsubscribe {
        listeners.add(l);
        return () => { listeners.delete(l); };
      },
    };

    const controller = TourLocationController.create(TWO_STOP_TOUR, mockProvider, TEST_ATTRACTIONS);
    expect(listeners.size).toBe(1);

    // Simulate location push from custom provider
    _coords = STOP_1_COORDS;
    listeners.forEach((l) => l(_coords));

    expect(controller.getSession().isCurrentStopReached).toBe(true);
    controller.destroy();
    expect(listeners.size).toBe(0); // verified unsubscription
  });
});
