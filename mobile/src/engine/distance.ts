// src/engine/distance.ts
// =============================================================================
// Distance Utilities — Pure Functions
// =============================================================================
// Haversine formula to calculate great-circle distance between two
// lat/lng points. No external dependencies. Fully unit-testable.
// =============================================================================

import type { Coordinates } from '@shared-types/index';

/**
 * GeoPoint represents a geographic coordinate with optional GPS accuracy
 * and timestamp metadata. Extends M1's Coordinates interface for 100%
 * backward compatibility.
 */
export interface GeoPoint extends Coordinates {
  readonly accuracy?: number | null;
  readonly timestamp?: number | null;
}

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Computes the great-circle distance between two geographic points
 * using the Haversine formula.
 *
 * @returns Distance in meters.
 */
export function computeDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(toRadians(a.latitude)) *
      Math.cos(toRadians(b.latitude)) *
      sinDLon *
      sinDLon;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/**
 * Returns true when `current` is within `radiusMeters` of `target`.
 */
export function isWithinRadius(
  current: GeoPoint,
  target: GeoPoint,
  radiusMeters: number,
): boolean {
  return computeDistanceMeters(current, target) <= radiusMeters;
}

/**
 * Linearly interpolates between two points by `fraction` (0–1).
 * Used by the simulator to move the traveler incrementally.
 */
export function interpolate(from: GeoPoint, to: GeoPoint, fraction: number): GeoPoint {
  const f = Math.min(1, Math.max(0, fraction));
  return {
    latitude:  from.latitude  + (to.latitude  - from.latitude)  * f,
    longitude: from.longitude + (to.longitude - from.longitude) * f,
  };
}

/**
 * Returns a point that is `offsetMeters` north and east of `origin`.
 * Used to place the traveler slightly away from a stop at the start.
 */
export function offsetPoint(
  origin: GeoPoint,
  offsetMetersNorth: number,
  offsetMetersEast: number,
): GeoPoint {
  const latOffset  = offsetMetersNorth / EARTH_RADIUS_METERS * (180 / Math.PI);
  const lonOffset  = offsetMetersEast  /
    (EARTH_RADIUS_METERS * Math.cos(toRadians(origin.latitude))) *
    (180 / Math.PI);
  return {
    latitude:  origin.latitude  + latOffset,
    longitude: origin.longitude + lonOffset,
  };
}
