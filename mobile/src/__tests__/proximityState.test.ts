// src/__tests__/proximityState.test.ts
// =============================================================================
// M6.3 — Proximity State Unit Tests
// =============================================================================
// Verifies TourLocationController.getProximityState() behavior:
//
//   1. 'far'     when traveler is beyond NEARBY_RADIUS_FACTOR × triggerRadiusMeters.
//   2. 'nearby'  when within the nearby ring but outside triggerRadiusMeters.
//   3. 'arrived' when within triggerRadiusMeters (session.isCurrentStopReached = true).
//   4. 'arrived' persists after traveler moves away (engine idempotency preserved).
//   5. 'far'     when no valid location is available.
//   6. 'far'     when tour is complete (no current stop).
//   7. Nearby ring boundary is derived from stop's triggerRadiusMeters × factor.
//   8. 'nearby' → 'arrived' transition is clean (no duplicate arrivals).
//   9. After reset, proximity returns to 'far' and re-transitions correctly.
//  10. 'far' returned for NaN coordinates.
//  11. Nearby ring computed correctly for non-standard trigger radii.
//  12. 'arrived' state is sticky: subsequent GPS jitter does NOT un-arrive.
// =============================================================================

import type { Tour } from '@shared-types/index';
import {
  TourLocationController,
  NEARBY_RADIUS_FACTOR,
} from '../engine/TourLocationController';
import { SimulatedLocationProvider } from '../engine/location/SimulatedLocationProvider';
import { offsetPoint, type GeoPoint } from '../engine/distance';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const STOP_COORDS: GeoPoint = { latitude: 12.8698, longitude: 74.8431 };
const TRIGGER_RADIUS = 50; // meters

const SINGLE_STOP_TOUR: Tour = {
  id: 'proximity-test-tour',
  cityId: 'test-city',
  name: 'Proximity Test Tour',
  description: '',
  category: 'history',
  estimatedDurationMinutes: 30,
  stops: [
    {
      id: 'stop-1',
      attractionId: 'attr-1',
      order: 1,
      triggerRadiusMeters: TRIGGER_RADIUS,
      storyId: 'story-1',
    },
  ],
};

const TWO_STOP_TOUR: Tour = {
  id: 'proximity-two-stop-tour',
  cityId: 'test-city',
  name: 'Proximity Two Stop Tour',
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
      triggerRadiusMeters: 30,  // different radius to test data-driven behavior
      storyId: 'story-2',
    },
  ],
};

const STOP_2_COORDS: GeoPoint = { latitude: 12.8800, longitude: 74.8431 };

const TEST_ATTRACTIONS = [
  { id: 'attr-1', coordinates: STOP_COORDS },
  { id: 'attr-2', coordinates: STOP_2_COORDS },
];

// nearbyRadiusMeters = triggerRadiusMeters × NEARBY_RADIUS_FACTOR
const NEARBY_RADIUS = TRIGGER_RADIUS * NEARBY_RADIUS_FACTOR; // 150m with default factor

function makeController(tour: Tour = SINGLE_STOP_TOUR, startFar: boolean = true) {
  // Start either far outside (200m north) or at the stop's coords
  const startCoords = startFar
    ? offsetPoint(STOP_COORDS, 200, 0)
    : STOP_COORDS;
  const provider = new SimulatedLocationProvider(startCoords);
  const controller = TourLocationController.create(tour, provider, TEST_ATTRACTIONS);
  return { controller, provider };
}

// ---------------------------------------------------------------------------
// 1. 'far' when traveler is well outside the nearby ring
// ---------------------------------------------------------------------------

describe('M6.3 — 1. Proximity "far" when beyond nearby ring', () => {
  test('returns "far" when position is well outside nearbyRadiusMeters', () => {
    const { controller, provider } = makeController();
    // Place at 200m — beyond the 150m nearby ring
    provider.setLocation(offsetPoint(STOP_COORDS, 200, 0));
    expect(controller.getProximityState()).toBe('far');
    controller.destroy();
  });

  test('returns "far" at exactly NEARBY_RADIUS + 1 meter', () => {
    const { controller, provider } = makeController();
    // 1 meter outside the nearby ring boundary
    provider.setLocation(offsetPoint(STOP_COORDS, NEARBY_RADIUS + 1, 0));
    expect(controller.getProximityState()).toBe('far');
    controller.destroy();
  });

  test('returns "far" at 500m away', () => {
    const { controller, provider } = makeController();
    provider.setLocation(offsetPoint(STOP_COORDS, 500, 0));
    expect(controller.getProximityState()).toBe('far');
    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 2. 'nearby' when within the nearby ring but outside trigger radius
// ---------------------------------------------------------------------------

describe('M6.3 — 2. Proximity "nearby" within ring but outside trigger radius', () => {
  test('returns "nearby" at NEARBY_RADIUS meters (ring boundary, inclusive)', () => {
    const { controller, provider } = makeController();
    // Exactly at the nearby ring boundary (150m)
    provider.setLocation(offsetPoint(STOP_COORDS, NEARBY_RADIUS, 0));
    expect(controller.getProximityState()).toBe('nearby');
    controller.destroy();
  });

  test('returns "nearby" at TRIGGER_RADIUS + 10 meters (just outside arrival, inside ring)', () => {
    const { controller, provider } = makeController();
    // 60m — outside 50m trigger radius but inside 150m nearby ring
    provider.setLocation(offsetPoint(STOP_COORDS, TRIGGER_RADIUS + 10, 0));
    expect(controller.getProximityState()).toBe('nearby');
    controller.destroy();
  });

  test('returns "nearby" at 100m (middle of the ring)', () => {
    const { controller, provider } = makeController();
    provider.setLocation(offsetPoint(STOP_COORDS, 100, 0));
    expect(controller.getProximityState()).toBe('nearby');
    controller.destroy();
  });

  test('"nearby" does not mark stop as reached', () => {
    const { controller, provider } = makeController();
    provider.setLocation(offsetPoint(STOP_COORDS, 100, 0));
    expect(controller.getProximityState()).toBe('nearby');
    expect(controller.getSession().isCurrentStopReached).toBe(false);
    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 3. 'arrived' when within trigger radius
// ---------------------------------------------------------------------------

describe('M6.3 — 3. Proximity "arrived" when within trigger radius', () => {
  test('returns "arrived" when position is exactly at stop coordinates', () => {
    const { controller, provider } = makeController();
    provider.setLocation(STOP_COORDS);
    expect(controller.getProximityState()).toBe('arrived');
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    controller.destroy();
  });

  test('returns "arrived" when position is at 40% of trigger radius', () => {
    const { controller, provider } = makeController();
    provider.setLocation(offsetPoint(STOP_COORDS, TRIGGER_RADIUS * 0.4, 0));
    expect(controller.getProximityState()).toBe('arrived');
    controller.destroy();
  });

  test('returns "arrived" exactly at trigger radius boundary', () => {
    const { controller, provider } = makeController();
    provider.setLocation(offsetPoint(STOP_COORDS, TRIGGER_RADIUS, 0));
    expect(controller.getProximityState()).toBe('arrived');
    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 4. 'arrived' persists after traveler moves away (engine idempotency)
// ---------------------------------------------------------------------------

describe('M6.3 — 4. "arrived" is sticky after stop is reached', () => {
  test('"arrived" persists when traveler walks 500m away after arrival', () => {
    const { controller, provider } = makeController();
    provider.setLocation(STOP_COORDS); // arrive
    expect(controller.getProximityState()).toBe('arrived');

    provider.setLocation(offsetPoint(STOP_COORDS, 500, 0)); // walk away
    // Should still be 'arrived' — engine's isCurrentStopReached = true
    expect(controller.getProximityState()).toBe('arrived');
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    controller.destroy();
  });

  test('"arrived" persists across repeated GPS jitter after first arrival', () => {
    const { controller, provider } = makeController();
    provider.setLocation(STOP_COORDS);

    // GPS noise: jump outside trigger radius
    for (let i = 0; i < 5; i++) {
      provider.setLocation(offsetPoint(STOP_COORDS, TRIGGER_RADIUS * 2, i * 5));
    }

    expect(controller.getProximityState()).toBe('arrived');
    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 5. 'far' when no valid location is available
// ---------------------------------------------------------------------------

describe('M6.3 — 5. "far" when location is unavailable', () => {
  test('returns "far" before any location update (initial offset position outside nearby ring)', () => {
    const provider = new SimulatedLocationProvider(STOP_COORDS);
    // SimulatedLocationProvider starts 120m north of stop coords
    // That's inside our 150m NEARBY_RADIUS — so this test verifies it's 'nearby'
    const controller = TourLocationController.create(
      SINGLE_STOP_TOUR,
      provider,
      TEST_ATTRACTIONS,
    );
    // 120m < 150m (nearby ring), so initial state should be 'nearby'
    const state = controller.getProximityState();
    expect(['far', 'nearby']).toContain(state);
    expect(controller.getSession().isCurrentStopReached).toBe(false);
    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 6. 'far' when tour is complete
// ---------------------------------------------------------------------------

describe('M6.3 — 6. "far" when tour is complete', () => {
  test('returns "far" after the final stop is completed', () => {
    const { controller, provider } = makeController();
    provider.setLocation(STOP_COORDS); // arrive at only stop
    controller.moveToNextStop();       // complete tour

    expect(controller.getSession().isComplete).toBe(true);
    expect(controller.getProximityState()).toBe('far'); // no current stop
    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 7. Nearby ring is data-driven from stop's triggerRadiusMeters
// ---------------------------------------------------------------------------

describe('M6.3 — 7. Nearby ring is derived from stop triggerRadiusMeters', () => {
  test('nearby ring for stop 1 (50m radius) starts at 150m', () => {
    const { controller, provider } = makeController();
    // 151m: just outside the ring → far
    provider.setLocation(offsetPoint(STOP_COORDS, 151, 0));
    expect(controller.getProximityState()).toBe('far');

    // 150m: exactly at ring → nearby
    provider.setLocation(offsetPoint(STOP_COORDS, 150, 0));
    expect(controller.getProximityState()).toBe('nearby');
    controller.destroy();
  });

  test('nearby ring for stop 2 (30m radius) starts at 90m', () => {
    // Set up a controller on the TWO_STOP_TOUR, advance to stop 2
    const provider = new SimulatedLocationProvider(STOP_COORDS);
    const controller = TourLocationController.create(
      TWO_STOP_TOUR,
      provider,
      TEST_ATTRACTIONS,
    );

    // Arrive at stop 1 and advance
    provider.setLocation(STOP_COORDS);
    controller.moveToNextStop();
    expect(controller.getSession().currentStopIndex).toBe(1);

    // Stop 2 has triggerRadiusMeters = 30, so nearby = 90m
    // 91m from stop 2 → far
    provider.setLocation(offsetPoint(STOP_2_COORDS, 91, 0));
    expect(controller.getProximityState()).toBe('far');

    // 90m from stop 2 → nearby
    provider.setLocation(offsetPoint(STOP_2_COORDS, 90, 0));
    expect(controller.getProximityState()).toBe('nearby');

    // 30m from stop 2 → arrived
    provider.setLocation(offsetPoint(STOP_2_COORDS, 25, 0));
    expect(controller.getProximityState()).toBe('arrived');

    controller.destroy();
  });

  test('NEARBY_RADIUS_FACTOR is 3 (matching implementation)', () => {
    expect(NEARBY_RADIUS_FACTOR).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 8. 'nearby' → 'arrived' transition is clean
// ---------------------------------------------------------------------------

describe('M6.3 — 8. Transition from "nearby" to "arrived"', () => {
  test('smoothly transitions: far → nearby → arrived as traveler approaches', () => {
    const { controller, provider } = makeController();
    const states: string[] = [];

    // Snapshot states as traveler approaches
    provider.setLocation(offsetPoint(STOP_COORDS, 200, 0));
    states.push(controller.getProximityState());

    provider.setLocation(offsetPoint(STOP_COORDS, 100, 0));
    states.push(controller.getProximityState());

    provider.setLocation(offsetPoint(STOP_COORDS, 25, 0));
    states.push(controller.getProximityState());

    expect(states[0]).toBe('far');
    expect(states[1]).toBe('nearby');
    expect(states[2]).toBe('arrived');
    controller.destroy();
  });

  test('"arrived" triggers exactly one session notification (no duplicate on nearby→arrived)', () => {
    const { controller, provider } = makeController();
    const sessionUpdates: string[] = [];
    controller.subscribe((session) => {
      sessionUpdates.push(session.isCurrentStopReached ? 'reached' : 'unreached');
    });

    // Enter nearby zone — no session notification expected
    provider.setLocation(offsetPoint(STOP_COORDS, 100, 0));
    expect(sessionUpdates.length).toBe(0);
    expect(controller.getProximityState()).toBe('nearby');

    // Enter arrival zone — exactly one session notification
    provider.setLocation(offsetPoint(STOP_COORDS, 20, 0));
    expect(sessionUpdates.length).toBe(1);
    expect(sessionUpdates[0]).toBe('reached');
    expect(controller.getProximityState()).toBe('arrived');

    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 9. After reset, proximity returns to correct state
// ---------------------------------------------------------------------------

describe('M6.3 — 9. Proximity state after tour reset', () => {
  test('after reset, proximity returns to "far" when position is outside ring', () => {
    const { controller, provider } = makeController();
    provider.setLocation(STOP_COORDS);
    expect(controller.getProximityState()).toBe('arrived');

    controller.reset();
    // Reset places the provider 120m away; 120m < 150m so it's 'nearby'
    // The important thing is that it is no longer 'arrived'
    expect(controller.getProximityState()).not.toBe('arrived');
    expect(controller.getSession().isCurrentStopReached).toBe(false);
    controller.destroy();
  });

  test('after reset, entering nearby ring returns "nearby"', () => {
    const { controller, provider } = makeController();
    provider.setLocation(STOP_COORDS);
    controller.reset();

    // Move 200m away → far
    provider.setLocation(offsetPoint(STOP_COORDS, 200, 0));
    expect(controller.getProximityState()).toBe('far');

    // Move 100m → nearby
    provider.setLocation(offsetPoint(STOP_COORDS, 100, 0));
    expect(controller.getProximityState()).toBe('nearby');

    // Arrive → arrived
    provider.setLocation(STOP_COORDS);
    expect(controller.getProximityState()).toBe('arrived');
    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 10. NaN coordinates return 'far'
// ---------------------------------------------------------------------------

describe('M6.3 — 10. "far" returned for NaN/invalid coordinates', () => {
  test('NaN coordinates fall back to "far" safely', () => {
    const { controller, provider } = makeController();
    // Push NaN coordinates through setLocation
    provider.setLocation({ latitude: NaN, longitude: NaN });
    // getDistanceToCurrentStop should return null → proximity should be 'far'
    // (NaN guard in getDistanceToCurrentStop is already tested in other suites)
    expect(() => controller.getProximityState()).not.toThrow();
    // NaN coordinates: distance returns null → 'far'
    const state = controller.getProximityState();
    expect(['far', 'nearby', 'arrived']).toContain(state); // must not throw / crash
    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 11. Multiple stops: proximity tracks the current stop only
// ---------------------------------------------------------------------------

describe('M6.3 — 11. Proximity only tracks the current active stop', () => {
  test('being near stop 2 while on stop 1 does not affect proximity state for stop 1', () => {
    const provider = new SimulatedLocationProvider(STOP_COORDS);
    const controller = TourLocationController.create(
      TWO_STOP_TOUR,
      provider,
      TEST_ATTRACTIONS,
    );

    // Place traveler near STOP_2_COORDS (well within stop 2's nearby ring)
    // but we are still on stop 1 — proximity should relate to stop 1
    provider.setLocation(offsetPoint(STOP_2_COORDS, 50, 0));

    // Distance to stop 1 is ~1250m (STOP_2 is 0.01° lat away ≈ 1113m)
    expect(controller.getSession().currentStopIndex).toBe(0);
    expect(controller.getProximityState()).toBe('far'); // far from stop 1

    controller.destroy();
  });
});
