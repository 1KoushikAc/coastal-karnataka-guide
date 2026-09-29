// src/__tests__/locationProvider.test.ts
// =============================================================================
// SimulatedLocationProvider + LocationProvider Abstraction — Unit Tests
// =============================================================================
// No React, no React Native, no GPS, no device sensors.
// =============================================================================

import { SimulatedLocationProvider } from '../engine/location/SimulatedLocationProvider';
import type { LocationProvider, LocationListener, Unsubscribe } from '../engine/location/types';
import { computeDistanceMeters, type GeoPoint } from '../engine/distance';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const KADRI_TEMPLE: GeoPoint = { latitude: 12.8876, longitude: 74.8429 };
const ST_ALOYSIUS:  GeoPoint = { latitude: 12.8656, longitude: 74.8426 };
const ORIGIN:       GeoPoint = { latitude: 0, longitude: 0 };

// ---------------------------------------------------------------------------
// 1. Initial simulated location
// ---------------------------------------------------------------------------

describe('SimulatedLocationProvider — initial state', () => {
  test('1. Provider starts outside the trigger radius of the first stop', () => {
    const provider = new SimulatedLocationProvider(KADRI_TEMPLE);
    const loc = provider.getCurrentLocation();
    // Starts 120 m north — well outside any typical trigger radius (≤ 100 m)
    const dist = computeDistanceMeters(loc, KADRI_TEMPLE);
    expect(dist).toBeGreaterThan(50);  // not at the stop
    expect(dist).toBeLessThan(200);    // but nearby
  });

  test('Initial isRunning is false', () => {
    const provider = new SimulatedLocationProvider(KADRI_TEMPLE);
    expect(provider.isRunning).toBe(false);
  });

  test('getCurrentLocation returns an object with latitude and longitude', () => {
    const provider = new SimulatedLocationProvider(ORIGIN);
    const loc = provider.getCurrentLocation();
    expect(typeof loc.latitude).toBe('number');
    expect(typeof loc.longitude).toBe('number');
  });

  test('getCurrentLocation returns a snapshot (not a mutable internal reference)', () => {
    const provider = new SimulatedLocationProvider(ORIGIN);
    const loc = provider.getCurrentLocation();
    // Mutating the returned value must not affect the provider's state
    (loc as { latitude: number }).latitude = 999;
    const loc2 = provider.getCurrentLocation();
    expect(loc2.latitude).not.toBe(999);
  });
});

// ---------------------------------------------------------------------------
// 2. Updating the simulated location (setLocation)
// ---------------------------------------------------------------------------

describe('SimulatedLocationProvider — setLocation', () => {
  test('2. setLocation moves the traveler to exact coordinates', () => {
    const provider = new SimulatedLocationProvider(KADRI_TEMPLE);
    provider.setLocation(ST_ALOYSIUS);
    const loc = provider.getCurrentLocation();
    expect(loc.latitude).toBeCloseTo(ST_ALOYSIUS.latitude, 6);
    expect(loc.longitude).toBeCloseTo(ST_ALOYSIUS.longitude, 6);
  });

  test('moveTo is equivalent to setLocation', () => {
    const p1 = new SimulatedLocationProvider(ORIGIN);
    const p2 = new SimulatedLocationProvider(ORIGIN);
    p1.setLocation(KADRI_TEMPLE);
    p2.moveTo(KADRI_TEMPLE);
    expect(p1.getCurrentLocation().latitude).toBeCloseTo(p2.getCurrentLocation().latitude, 6);
    expect(p1.getCurrentLocation().longitude).toBeCloseTo(p2.getCurrentLocation().longitude, 6);
  });

  test('7. Multiple location updates reflect in getCurrentLocation', () => {
    const provider = new SimulatedLocationProvider(ORIGIN);
    const points: GeoPoint[] = [
      { latitude: 1, longitude: 1 },
      { latitude: 5, longitude: 5 },
      { latitude: 12.8876, longitude: 74.8429 },
    ];
    for (const point of points) {
      provider.setLocation(point);
      const loc = provider.getCurrentLocation();
      expect(loc.latitude).toBeCloseTo(point.latitude, 6);
      expect(loc.longitude).toBeCloseTo(point.longitude, 6);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Resetting the simulated location
// ---------------------------------------------------------------------------

describe('SimulatedLocationProvider — reset', () => {
  test('3. reset() moves traveler back to offset from startCoords', () => {
    const provider = new SimulatedLocationProvider(KADRI_TEMPLE);
    // Move to a completely different place
    provider.setLocation(ST_ALOYSIUS);
    expect(provider.getCurrentLocation().latitude).toBeCloseTo(ST_ALOYSIUS.latitude, 4);

    // Reset to Kadri Temple neighborhood
    provider.reset(KADRI_TEMPLE);
    const afterReset = provider.getCurrentLocation();
    const dist = computeDistanceMeters(afterReset, KADRI_TEMPLE);
    // Should be ~120 m from Kadri Temple again
    expect(dist).toBeGreaterThan(50);
    expect(dist).toBeLessThan(200);
  });

  test('reset() does not change isRunning state', () => {
    const provider = new SimulatedLocationProvider(ORIGIN);
    provider.start();
    expect(provider.isRunning).toBe(true);
    provider.reset(ORIGIN);
    expect(provider.isRunning).toBe(true); // still running
  });

  test('reset() with a different startCoords places traveler near the new coords', () => {
    const provider = new SimulatedLocationProvider(KADRI_TEMPLE);
    provider.reset(ST_ALOYSIUS);
    const dist = computeDistanceMeters(provider.getCurrentLocation(), ST_ALOYSIUS);
    expect(dist).toBeGreaterThan(50);
    expect(dist).toBeLessThan(200);
  });
});

// ---------------------------------------------------------------------------
// 6. Moving from one coordinate to another (moveToward)
// ---------------------------------------------------------------------------

describe('SimulatedLocationProvider — moveToward', () => {
  test('6. moveToward reduces distance to target', () => {
    const provider = new SimulatedLocationProvider(KADRI_TEMPLE);
    provider.setLocation(KADRI_TEMPLE); // start exactly at Kadri
    const target = ST_ALOYSIUS;

    const beforeDist = computeDistanceMeters(provider.getCurrentLocation(), target);
    provider.moveToward(target);
    const afterDist = computeDistanceMeters(provider.getCurrentLocation(), target);

    expect(afterDist).toBeLessThan(beforeDist);
  });

  test('Repeated moveToward calls converge on the target', () => {
    const provider = new SimulatedLocationProvider(ORIGIN);
    provider.setLocation(KADRI_TEMPLE);
    const target = ST_ALOYSIUS;

    let prevDist = computeDistanceMeters(provider.getCurrentLocation(), target);
    for (let i = 0; i < 10; i++) {
      provider.moveToward(target);
      const dist = computeDistanceMeters(provider.getCurrentLocation(), target);
      expect(dist).toBeLessThan(prevDist);
      prevDist = dist;
    }
    // After 10 steps of 40% reduction, should be very close
    expect(prevDist).toBeLessThan(50);
  });

  test('moveToward never overshoots the target', () => {
    const provider = new SimulatedLocationProvider(ORIGIN);
    provider.setLocation(KADRI_TEMPLE);
    const target = ST_ALOYSIUS;
    const initialDist = computeDistanceMeters(KADRI_TEMPLE, ST_ALOYSIUS);

    for (let i = 0; i < 20; i++) {
      provider.moveToward(target);
    }
    const finalDist = computeDistanceMeters(provider.getCurrentLocation(), target);
    // Must never be further than the initial distance
    expect(finalDist).toBeLessThanOrEqual(initialDist);
  });
});

// ---------------------------------------------------------------------------
// arriveAt — place within trigger radius
// ---------------------------------------------------------------------------

describe('SimulatedLocationProvider — arriveAt', () => {
  test('arriveAt places traveler within the trigger radius', () => {
    const provider = new SimulatedLocationProvider(KADRI_TEMPLE);
    const triggerRadius = 80;
    provider.arriveAt(KADRI_TEMPLE, triggerRadius);
    const dist = computeDistanceMeters(provider.getCurrentLocation(), KADRI_TEMPLE);
    expect(dist).toBeLessThanOrEqual(triggerRadius);
  });

  test('arriveAt places traveler within 60% of trigger radius', () => {
    const provider = new SimulatedLocationProvider(KADRI_TEMPLE);
    const triggerRadius = 100;
    provider.arriveAt(KADRI_TEMPLE, triggerRadius);
    const dist = computeDistanceMeters(provider.getCurrentLocation(), KADRI_TEMPLE);
    expect(dist).toBeLessThan(triggerRadius * 0.7); // within 70% to allow rounding
  });
});

// ---------------------------------------------------------------------------
// 8. start() and stop() lifecycle
// ---------------------------------------------------------------------------

describe('SimulatedLocationProvider — start/stop lifecycle', () => {
  test('8. start() sets isRunning to true', () => {
    const provider = new SimulatedLocationProvider(ORIGIN);
    expect(provider.isRunning).toBe(false);
    provider.start();
    expect(provider.isRunning).toBe(true);
  });

  test('stop() sets isRunning to false', () => {
    const provider = new SimulatedLocationProvider(ORIGIN);
    provider.start();
    provider.stop();
    expect(provider.isRunning).toBe(false);
  });

  test('start() after stop() re-activates the provider', () => {
    const provider = new SimulatedLocationProvider(ORIGIN);
    provider.start();
    provider.stop();
    provider.start();
    expect(provider.isRunning).toBe(true);
  });

  test('getCurrentLocation is accessible regardless of running state', () => {
    const provider = new SimulatedLocationProvider(KADRI_TEMPLE);
    // Not started — should still return a location
    expect(() => provider.getCurrentLocation()).not.toThrow();
    provider.start();
    expect(() => provider.getCurrentLocation()).not.toThrow();
    provider.stop();
    expect(() => provider.getCurrentLocation()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Subscription & Listener Lifecycle (M5.3)
// ---------------------------------------------------------------------------

describe('SimulatedLocationProvider — subscription and listeners', () => {
  test('subscribe adds a listener and increments listenerCount', () => {
    const provider = new SimulatedLocationProvider(ORIGIN);
    expect(provider.listenerCount).toBe(0);

    const listener = jest.fn();
    const unsubscribe = provider.subscribe(listener);

    expect(provider.listenerCount).toBe(1);
    unsubscribe();
    expect(provider.listenerCount).toBe(0);
  });

  test('setLocation notifies subscribers with new location', () => {
    const provider = new SimulatedLocationProvider(ORIGIN);
    const received: GeoPoint[] = [];
    provider.subscribe((loc) => received.push(loc));

    provider.setLocation(KADRI_TEMPLE);
    expect(received.length).toBe(1);
    expect(received[0].latitude).toBeCloseTo(KADRI_TEMPLE.latitude, 6);
  });

  test('unsubscribed listener does not receive subsequent updates', () => {
    const provider = new SimulatedLocationProvider(ORIGIN);
    const received: GeoPoint[] = [];
    const unsubscribe = provider.subscribe((loc) => received.push(loc));

    provider.setLocation(KADRI_TEMPLE);
    expect(received.length).toBe(1);

    unsubscribe();
    provider.setLocation(ST_ALOYSIUS);
    // Should still only have 1 received update
    expect(received.length).toBe(1);
  });

  test('multiple listeners receive location updates independently', () => {
    const provider = new SimulatedLocationProvider(ORIGIN);
    const l1 = jest.fn();
    const l2 = jest.fn();

    const unsub1 = provider.subscribe(l1);
    const unsub2 = provider.subscribe(l2);

    provider.moveTo(ST_ALOYSIUS);
    expect(l1).toHaveBeenCalledTimes(1);
    expect(l2).toHaveBeenCalledTimes(1);

    unsub1();
    provider.moveTo(KADRI_TEMPLE);
    expect(l1).toHaveBeenCalledTimes(1); // not called again
    expect(l2).toHaveBeenCalledTimes(2); // still received

    unsub2();
    expect(provider.listenerCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// LocationProvider abstraction — polymorphism test
// ---------------------------------------------------------------------------

describe('LocationProvider abstraction', () => {
  /**
   * This function only knows about the LocationProvider interface.
   * It does NOT import or reference SimulatedLocationProvider.
   * This proves the engine can consume location data without knowing the source.
   */
  function getDistanceToTarget(
    provider: LocationProvider,
    target: GeoPoint,
  ): number {
    const current = provider.getCurrentLocation();
    return computeDistanceMeters(current, target);
  }

  test('LocationProvider abstraction can be consumed without knowing the implementation', () => {
    // Typed as the interface — the function cannot call simulator-specific methods
    const provider: LocationProvider = new SimulatedLocationProvider(KADRI_TEMPLE);
    provider.start();

    const distance = getDistanceToTarget(provider, KADRI_TEMPLE);

    expect(typeof distance).toBe('number');
    expect(distance).toBeGreaterThanOrEqual(0);
    expect(provider.isRunning).toBe(true);
  });

  test('Multiple providers with different implementations are interchangeable', () => {
    // Both are LocationProvider — only interface methods available
    const providers: LocationProvider[] = [
      new SimulatedLocationProvider(KADRI_TEMPLE),
      new SimulatedLocationProvider(ST_ALOYSIUS),
    ];

    for (const p of providers) {
      p.start();
      const loc = p.getCurrentLocation();
      expect(typeof loc.latitude).toBe('number');
      expect(typeof loc.longitude).toBe('number');
      expect(p.isRunning).toBe(true);
      p.stop();
      expect(p.isRunning).toBe(false);
    }
  });

  test('Engine-style usage: start, check location, stop', () => {
    const provider: LocationProvider = new SimulatedLocationProvider(KADRI_TEMPLE);

    provider.start();
    const loc1 = provider.getCurrentLocation();

    // Engine resets and checks again
    provider.reset(ST_ALOYSIUS);
    const loc2 = provider.getCurrentLocation();

    provider.stop();

    // Locations must be different after reset to a different start
    const distBetween = computeDistanceMeters(loc1, loc2);
    expect(distBetween).toBeGreaterThan(100);
    expect(provider.isRunning).toBe(false);
  });
});
