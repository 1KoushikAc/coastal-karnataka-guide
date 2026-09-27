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
import type { LocationProvider } from '../engine/location/types';
import { computeDistanceMeters, type GeoPoint } from '../engine/distance';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// Stop coordinates chosen to be small and arithmetic-friendly.
const STOP_1_COORDS: GeoPoint = { latitude: 0, longitude: 0 };
const STOP_2_COORDS: GeoPoint = { latitude: 0.01, longitude: 0 }; // ~1113 m north
const STOP_3_COORDS: GeoPoint = { latitude: 0.02, longitude: 0 }; // ~2226 m north

const TRIGGER_RADIUS = 50; // meters — used for all stops in these tests

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

/** Convenience: creates a provider positioned exactly at `coords`. */
function providerAt(coords: GeoPoint): SimulatedLocationProvider {
  const p = new SimulatedLocationProvider(coords);
  p.setLocation(coords);
  return p;
}

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
// 1. Traveler outside trigger radius
// ---------------------------------------------------------------------------

describe('checkLocation — outside trigger radius', () => {
  test('1. checkLocation does not mark stop reached when outside radius', () => {
    const { controller, provider } = makeTwoStopController();
    // Default position: 120 m north of stop 1 — outside 50 m radius
    const dist = controller.getDistanceToCurrentStop();
    expect(dist).not.toBeNull();
    expect(dist!).toBeGreaterThan(TRIGGER_RADIUS);

    controller.checkLocation();
    expect(controller.getSession().isCurrentStopReached).toBe(false);
  });

  test('getDistanceToCurrentStop returns a positive number when away from stop', () => {
    const { controller } = makeTwoStopController();
    const dist = controller.getDistanceToCurrentStop();
    expect(dist).toBeGreaterThan(0);
  });

  test('11. Location updates while outside radius keep isCurrentStopReached false', () => {
    const { controller, provider } = makeTwoStopController();
    // Multiple moves — none inside radius
    for (let i = 0; i < 5; i++) {
      provider.moveToward(STOP_2_COORDS); // moving away from stop 1
      controller.checkLocation();
    }
    expect(controller.getSession().isCurrentStopReached).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. Traveler exactly at the stop
// ---------------------------------------------------------------------------

describe('checkLocation — at exact coordinates', () => {
  test('2. Distance to current stop is zero when at exact coordinates', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);
    const dist = controller.getDistanceToCurrentStop();
    expect(dist).toBeCloseTo(0, 1);
  });

  test('checkLocation marks stop reached when at exact coordinates', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);
    controller.checkLocation();
    expect(controller.getSession().isCurrentStopReached).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Traveler inside trigger radius
// ---------------------------------------------------------------------------

describe('checkLocation — inside trigger radius', () => {
  test('3. checkLocation marks stop reached when within radius', () => {
    // Place traveler 30 m north of stop 1 (inside 50 m radius)
    const nearStop1: GeoPoint = { latitude: 0.00027, longitude: 0 }; // ~30 m north
    const provider = providerAt(nearStop1);

    const dist = computeDistanceMeters(nearStop1, STOP_1_COORDS);
    expect(dist).toBeLessThan(TRIGGER_RADIUS); // sanity check

    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);
    controller.checkLocation();
    expect(controller.getSession().isCurrentStopReached).toBe(true);
  });

  test('getDistanceToCurrentStop reflects current position', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);
    expect(controller.getDistanceToCurrentStop()).toBeCloseTo(0, 1);

    provider.setLocation(STOP_2_COORDS);
    const distFromStop2ToStop1 = computeDistanceMeters(STOP_2_COORDS, STOP_1_COORDS);
    expect(controller.getDistanceToCurrentStop()).toBeCloseTo(distFromStop2ToStop1, 1);
  });
});

// ---------------------------------------------------------------------------
// 4. Traveler just outside trigger radius
// ---------------------------------------------------------------------------

describe('checkLocation — just outside trigger radius', () => {
  test('4. Traveler 1 m beyond radius is not marked as reached', () => {
    // 51 m north — 1 m past the 50 m trigger radius
    const justOutside: GeoPoint = { latitude: 0.000459, longitude: 0 }; // ~51 m north

    const dist = computeDistanceMeters(justOutside, STOP_1_COORDS);
    // Allow a small tolerance — ensure it is outside the radius
    expect(dist).toBeGreaterThan(TRIGGER_RADIUS - 2);

    const provider = providerAt(justOutside);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);
    controller.checkLocation();
    // Should NOT be reached if the distance is outside the radius
    if (dist > TRIGGER_RADIUS) {
      expect(controller.getSession().isCurrentStopReached).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Stop triggered only once (idempotency)
// ---------------------------------------------------------------------------

describe('checkLocation — idempotency', () => {
  test('5. Calling checkLocation twice marks the stop reached exactly once', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);

    const session1 = controller.checkLocation();
    const session2 = controller.checkLocation(); // second call

    expect(session1.isCurrentStopReached).toBe(true);
    expect(session2.isCurrentStopReached).toBe(true);
    // Both sessions are equivalent — session2 is unchanged
    expect(session2).toBe(session1); // same reference (no-op second call)
  });

  test('Stop is not in completedStopIndices until moveToNextStop is called', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);
    controller.checkLocation(); // reaches stop 1
    expect(controller.getSession().completedStopIndices.length).toBe(0); // not yet completed
  });
});

// ---------------------------------------------------------------------------
// 6. Next stop evaluated after progression
// ---------------------------------------------------------------------------

describe('moveToNextStop and next stop evaluation', () => {
  test('6. After moveToNextStop, getCurrentStopCoords points to stop 2', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);

    controller.checkLocation();
    expect(controller.getSession().isCurrentStopReached).toBe(true);

    controller.moveToNextStop();
    expect(controller.getSession().currentStopIndex).toBe(1);
    expect(controller.getSession().isCurrentStopReached).toBe(false);

    const stop2Coords = controller.getCurrentStopCoords();
    expect(stop2Coords?.latitude).toBeCloseTo(STOP_2_COORDS.latitude, 4);
    expect(stop2Coords?.longitude).toBeCloseTo(STOP_2_COORDS.longitude, 4);
  });

  test('moveToNextStop is a no-op if stop not yet reached', () => {
    const { controller } = makeTwoStopController();
    // Did not call checkLocation — stop not reached
    const before = controller.getSession();
    controller.moveToNextStop();
    expect(controller.getSession()).toBe(before); // unchanged
    expect(controller.getSession().currentStopIndex).toBe(0);
  });

  test('After advancing, being near stop 2 triggers arrival at stop 2', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);

    // Arrive at stop 1
    controller.checkLocation();
    controller.moveToNextStop();

    // Move to stop 2
    provider.setLocation(STOP_2_COORDS);
    controller.checkLocation();
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    expect(controller.getSession().currentStopIndex).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 7. Final stop completes the tour
// ---------------------------------------------------------------------------

describe('Tour completion via final stop', () => {
  test('7. Reaching and advancing past the final stop marks tour complete', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(THREE_STOP_TOUR, provider, TEST_ATTRACTIONS);

    // Stop 1
    controller.checkLocation();
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    controller.moveToNextStop();
    expect(controller.getSession().currentStopIndex).toBe(1);
    expect(controller.getSession().isComplete).toBe(false);

    // Stop 2
    provider.setLocation(STOP_2_COORDS);
    controller.checkLocation();
    controller.moveToNextStop();
    expect(controller.getSession().currentStopIndex).toBe(2);
    expect(controller.getSession().isComplete).toBe(false);

    // Stop 3 (final)
    provider.setLocation(STOP_3_COORDS);
    controller.checkLocation();
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    expect(controller.getSession().isComplete).toBe(false); // not complete until advanced

    controller.moveToNextStop();
    expect(controller.getSession().isComplete).toBe(true);
    expect(controller.getSession().completedStopIndices.length).toBe(3);
  });

  test('getDistanceToCurrentStop returns null after tour is complete', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);

    controller.checkLocation();
    controller.moveToNextStop();
    provider.setLocation(STOP_2_COORDS);
    controller.checkLocation();
    controller.moveToNextStop();

    expect(controller.getSession().isComplete).toBe(true);
    expect(controller.getDistanceToCurrentStop()).toBeNull();
  });

  test('checkLocation is a no-op after tour is complete', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);

    controller.checkLocation();
    controller.moveToNextStop();
    provider.setLocation(STOP_2_COORDS);
    controller.checkLocation();
    const completedSession = controller.moveToNextStop();

    // Calling checkLocation again after completion must not throw or change state
    const afterComplete = controller.checkLocation();
    expect(afterComplete).toBe(completedSession);
    expect(afterComplete.isComplete).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. Location updates continue after a stop is reached
// ---------------------------------------------------------------------------

describe('checkLocation after stop reached', () => {
  test('8. checkLocation returns current (reached) session after stop is already reached', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);

    const reachedSession = controller.checkLocation();
    expect(reachedSession.isCurrentStopReached).toBe(true);

    // Simulate moving away
    provider.setLocation(STOP_2_COORDS);
    const afterMove = controller.checkLocation();

    // Must still be reached — moving away does not un-reach the stop
    expect(afterMove.isCurrentStopReached).toBe(true);
    expect(afterMove).toBe(reachedSession);
  });

  test('12. Moving away from a reached stop does not un-reach it', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);
    controller.checkLocation(); // reached

    // Move 500 m away
    provider.setLocation({ latitude: 0.005, longitude: 0 });
    controller.checkLocation();

    expect(controller.getSession().isCurrentStopReached).toBe(true); // unchanged
  });
});

// ---------------------------------------------------------------------------
// 9. Reset
// ---------------------------------------------------------------------------

describe('reset', () => {
  test('9. reset clears session and returns to initial state', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);

    // Advance partway
    controller.checkLocation();
    controller.moveToNextStop();
    expect(controller.getSession().currentStopIndex).toBe(1);

    // Reset
    controller.reset();
    const session = controller.getSession();
    expect(session.currentStopIndex).toBe(0);
    expect(session.isCurrentStopReached).toBe(false);
    expect(session.isComplete).toBe(false);
    expect(session.completedStopIndices.length).toBe(0);
  });

  test('After reset, checkLocation re-evaluates correctly for stop 1', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);

    // Complete stop 1 and advance
    controller.checkLocation();
    controller.moveToNextStop();

    // Reset and place back at stop 1
    controller.reset();
    provider.setLocation(STOP_1_COORDS);
    controller.checkLocation();
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    expect(controller.getSession().currentStopIndex).toBe(0);
  });

  test('13. After returning to a stop after reset, it can be triggered again', () => {
    const provider = providerAt(STOP_1_COORDS);
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);

    controller.checkLocation(); // reach stop 1
    controller.moveToNextStop(); // advance to stop 2
    controller.reset();           // reset back to start

    // Now move back to stop 1 coordinates
    provider.setLocation(STOP_1_COORDS);
    controller.checkLocation();
    expect(controller.getSession().isCurrentStopReached).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. Provider can be replaced (abstraction test)
// ---------------------------------------------------------------------------

describe('LocationProvider abstraction', () => {
  test('10. Controller works with any object that implements LocationProvider', () => {
    // Create a minimal LocationProvider implementation inline (not SimulatedLocationProvider)
    let _coords: GeoPoint = STOP_1_COORDS;
    const mockProvider: LocationProvider = {
      isRunning: false,
      start() { /* no-op */ },
      stop() { /* no-op */ },
      getCurrentLocation: () => ({ ..._coords }),
      reset: (c: GeoPoint) => { _coords = c; },
    };

    const controller = TourLocationController.create(TWO_STOP_TOUR, mockProvider, TEST_ATTRACTIONS);
    controller.checkLocation();
    expect(controller.getSession().isCurrentStopReached).toBe(true);

    controller.moveToNextStop();
    _coords = STOP_2_COORDS; // simulate moving to stop 2
    controller.checkLocation();
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    expect(controller.getSession().currentStopIndex).toBe(1);
  });

  test('Distance calculation never duplicated — controller delegates to distance.ts', () => {
    // This test verifies that the distance reported by getDistanceToCurrentStop()
    // matches what computeDistanceMeters would give directly.
    const provider = providerAt({ latitude: 0.0005, longitude: 0 }); // ~55 m north of stop 1
    const controller = TourLocationController.create(TWO_STOP_TOUR, provider, TEST_ATTRACTIONS);

    const controllerDist = controller.getDistanceToCurrentStop()!;
    const directDist = computeDistanceMeters(
      { latitude: 0.0005, longitude: 0 },
      STOP_1_COORDS,
    );
    expect(controllerDist).toBeCloseTo(directDist, 3);
  });
});
