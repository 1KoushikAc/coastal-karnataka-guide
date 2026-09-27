// src/__tests__/distance.test.ts
// =============================================================================
// Distance Utilities — Unit Tests
// =============================================================================
// Tests the haversine formula and helpers in engine/distance.ts.
// No React, no React Native, no GPS.
// =============================================================================

import {
  computeDistanceMeters,
  isWithinRadius,
  interpolate,
  offsetPoint,
  type GeoPoint,
} from '../engine/distance';

// ---------------------------------------------------------------------------
// Known real-world coordinates (Mangalore, from M1 data)
// ---------------------------------------------------------------------------

const KADRI_TEMPLE: GeoPoint = { latitude: 12.8876, longitude: 74.8429 };
const ST_ALOYSIUS:  GeoPoint = { latitude: 12.8656, longitude: 74.8426 };
const SULTAN_BATTERY: GeoPoint = { latitude: 12.9060, longitude: 74.8074 };
const ORIGIN: GeoPoint = { latitude: 0, longitude: 0 };

// ---------------------------------------------------------------------------
// computeDistanceMeters
// ---------------------------------------------------------------------------

describe('computeDistanceMeters', () => {
  test('4. Distance between identical coordinates is approximately zero', () => {
    expect(computeDistanceMeters(KADRI_TEMPLE, KADRI_TEMPLE)).toBeCloseTo(0, 1);
    expect(computeDistanceMeters(ORIGIN, ORIGIN)).toBeCloseTo(0, 1);
  });

  test('5. Distance between two known Mangalore coordinates is within expected range', () => {
    // Kadri Temple → St. Aloysius Chapel: approx 2.5 km apart
    const dist = computeDistanceMeters(KADRI_TEMPLE, ST_ALOYSIUS);
    expect(dist).toBeGreaterThan(2_000);
    expect(dist).toBeLessThan(3_000);
  });

  test('Distance between Kadri Temple and Sultan Battery is approximately 4–5 km', () => {
    const dist = computeDistanceMeters(KADRI_TEMPLE, SULTAN_BATTERY);
    expect(dist).toBeGreaterThan(4_000);
    expect(dist).toBeLessThan(5_500);
  });

  test('Distance is symmetric (A→B equals B→A)', () => {
    const ab = computeDistanceMeters(KADRI_TEMPLE, ST_ALOYSIUS);
    const ba = computeDistanceMeters(ST_ALOYSIUS, KADRI_TEMPLE);
    expect(ab).toBeCloseTo(ba, 3);
  });

  test('Moving 0.001° north from origin is approximately 111 meters', () => {
    const a: GeoPoint = { latitude: 0, longitude: 0 };
    const b: GeoPoint = { latitude: 0.001, longitude: 0 };
    // 1° ≈ 111,200 m, so 0.001° ≈ 111.2 m
    const dist = computeDistanceMeters(a, b);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(120);
  });
});

// ---------------------------------------------------------------------------
// isWithinRadius
// ---------------------------------------------------------------------------

describe('isWithinRadius', () => {
  test('Same point is within any positive radius', () => {
    expect(isWithinRadius(KADRI_TEMPLE, KADRI_TEMPLE, 1)).toBe(true);
    expect(isWithinRadius(KADRI_TEMPLE, KADRI_TEMPLE, 50)).toBe(true);
  });

  test('Point ~2.5 km away is not within a 50 m radius', () => {
    expect(isWithinRadius(KADRI_TEMPLE, ST_ALOYSIUS, 50)).toBe(false);
  });

  test('Point ~2.5 km away is within a 3 km radius', () => {
    expect(isWithinRadius(KADRI_TEMPLE, ST_ALOYSIUS, 3_000)).toBe(true);
  });

  test('Point just inside radius returns true', () => {
    // Create a point exactly 100 m north of origin
    const target = ORIGIN;
    const nearbyNorth: GeoPoint = { latitude: 0.0009, longitude: 0 }; // ~100 m north
    expect(isWithinRadius(nearbyNorth, target, 120)).toBe(true);
  });

  test('Point just outside radius returns false', () => {
    const target = ORIGIN;
    const tooFar: GeoPoint = { latitude: 0.002, longitude: 0 }; // ~222 m north
    expect(isWithinRadius(tooFar, target, 50)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// interpolate
// ---------------------------------------------------------------------------

describe('interpolate', () => {
  const A: GeoPoint = { latitude: 10, longitude: 20 };
  const B: GeoPoint = { latitude: 20, longitude: 40 };

  test('Fraction 0 returns the starting point', () => {
    const result = interpolate(A, B, 0);
    expect(result.latitude).toBeCloseTo(A.latitude, 6);
    expect(result.longitude).toBeCloseTo(A.longitude, 6);
  });

  test('Fraction 1 returns the target point', () => {
    const result = interpolate(A, B, 1);
    expect(result.latitude).toBeCloseTo(B.latitude, 6);
    expect(result.longitude).toBeCloseTo(B.longitude, 6);
  });

  test('Fraction 0.5 returns the midpoint', () => {
    const result = interpolate(A, B, 0.5);
    expect(result.latitude).toBeCloseTo(15, 6);
    expect(result.longitude).toBeCloseTo(30, 6);
  });

  test('Fraction clamped below 0 behaves like 0', () => {
    const result = interpolate(A, B, -5);
    expect(result.latitude).toBeCloseTo(A.latitude, 6);
  });

  test('Fraction clamped above 1 behaves like 1', () => {
    const result = interpolate(A, B, 10);
    expect(result.latitude).toBeCloseTo(B.latitude, 6);
  });
});

// ---------------------------------------------------------------------------
// offsetPoint
// ---------------------------------------------------------------------------

describe('offsetPoint', () => {
  test('Zero offset returns a point at the same position', () => {
    const result = offsetPoint(ORIGIN, 0, 0);
    expect(result.latitude).toBeCloseTo(0, 6);
    expect(result.longitude).toBeCloseTo(0, 6);
  });

  test('120 m north offset from origin is approximately 120 m away', () => {
    const result = offsetPoint(ORIGIN, 120, 0);
    const dist = computeDistanceMeters(ORIGIN, result);
    expect(dist).toBeGreaterThan(115);
    expect(dist).toBeLessThan(125);
  });

  test('North offset increases latitude', () => {
    const result = offsetPoint(ORIGIN, 100, 0);
    expect(result.latitude).toBeGreaterThan(ORIGIN.latitude);
    expect(result.longitude).toBeCloseTo(ORIGIN.longitude, 5);
  });

  test('East offset increases longitude', () => {
    const result = offsetPoint(ORIGIN, 0, 100);
    expect(result.longitude).toBeGreaterThan(ORIGIN.longitude);
    expect(result.latitude).toBeCloseTo(ORIGIN.latitude, 5);
  });
});
