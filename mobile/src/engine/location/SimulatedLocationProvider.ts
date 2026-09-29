// src/engine/location/SimulatedLocationProvider.ts
// =============================================================================
// SimulatedLocationProvider — DEVELOPMENT / TESTING ONLY
// =============================================================================
// A fully deterministic location provider for use in development and tests.
// Uses in-memory coordinates; no device sensor, no permissions, no network.
//
// Architecture:
//   - Implements the LocationProvider interface:
//       start/stop/isRunning
//       getCurrentLocation()
//       reset()
//       subscribe(listener)
//   - Adds simulator-specific methods NOT in the interface:
//       setLocation(coords)    — instant teleport to exact coordinates
//       moveTo(coords)         — semantic alias for setLocation (direct move)
//       moveToward(target)     — incremental step toward a target (40% per call)
//       arriveAt(target, r)    — place just inside a trigger radius (for testing)
//       listenerCount          — inspection helper for verifying subscription cleanup
//
// Usage:
//   const provider: LocationProvider = new SimulatedLocationProvider(startCoords);
//   provider.subscribe((coords) => console.log('Location updated:', coords));
// =============================================================================

import type { GeoPoint } from '../distance';
import { interpolate, offsetPoint } from '../distance';
import type { LocationProvider, LocationListener, Unsubscribe } from './types';

/** Fraction of remaining distance covered per moveToward() call. */
const MOVE_STEP_FRACTION = 0.4;

/**
 * How far north (meters) of the first stop the traveler begins.
 * Ensures the traveler starts outside any typical trigger radius.
 */
const INITIAL_OFFSET_METERS = 120;

// =============================================================================
// DEV ONLY — clearly labelled
// =============================================================================

export class SimulatedLocationProvider implements LocationProvider {
  private _current: GeoPoint;
  private readonly _initialCoords: GeoPoint;
  private _isRunning: boolean = false;
  private readonly _listeners: Set<LocationListener> = new Set();

  /**
   * @param initialCoords  The "home base" position — typically the first
   *                       attraction's coordinates. The traveler starts
   *                       INITIAL_OFFSET_METERS north of this point.
   */
  constructor(initialCoords: GeoPoint) {
    this._initialCoords = { ...initialCoords };
    this._current = offsetPoint(initialCoords, INITIAL_OFFSET_METERS, 0);
  }

  // ---------------------------------------------------------------------------
  // LocationProvider interface
  // ---------------------------------------------------------------------------

  start(): void {
    this._isRunning = true;
  }

  stop(): void {
    this._isRunning = false;
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  /** Returns a snapshot of the current simulated position. */
  getCurrentLocation(): GeoPoint {
    return { ...this._current };
  }

  /**
   * Resets the traveler to INITIAL_OFFSET_METERS north of `startCoords`.
   * Does not change isRunning state. Notifies active listeners.
   */
  reset(startCoords: GeoPoint): void {
    this._current = offsetPoint(startCoords, INITIAL_OFFSET_METERS, 0);
    this._notifyListeners();
  }

  /**
   * Subscribes a listener to location updates.
   * Notifies the listener immediately if desired or on subsequent moves.
   */
  subscribe(listener: LocationListener): Unsubscribe {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  // ---------------------------------------------------------------------------
  // DEV ONLY — Simulator-specific controls & inspection
  // These are NOT part of the LocationProvider interface.
  // Production code must not call these through the base interface type.
  // ---------------------------------------------------------------------------

  /** [DEV] Returns the number of currently active subscriptions. */
  get listenerCount(): number {
    return this._listeners.size;
  }

  /**
   * [DEV] Instantly places the traveler at the given coordinates.
   * Notifies active listeners of the new position.
   */
  setLocation(coords: GeoPoint): void {
    this._current = { ...coords };
    this._notifyListeners();
  }

  /**
   * [DEV] Semantic alias for setLocation — directly moves to the target.
   * Useful when you want to express intent as "go to this place" vs "teleport".
   */
  moveTo(target: GeoPoint): void {
    this._current = { ...target };
    this._notifyListeners();
  }

  /**
   * [DEV] Steps the traveler MOVE_STEP_FRACTION (40%) of the remaining
   * distance toward `target`. Repeated calls converge on the target.
   * Each call reduces the remaining distance by ~40%.
   */
  moveToward(target: GeoPoint): void {
    this._current = interpolate(this._current, target, MOVE_STEP_FRACTION);
    this._notifyListeners();
  }

  /**
   * [DEV] Places the traveler just inside the trigger radius of `target`.
   * Specifically at 60% of radiusMeters north of the target —
   * well within the trigger zone, enough to reliably fire arrival detection.
   *
   * @param target       The stop's attraction coordinates.
   * @param radiusMeters The stop's triggerRadiusMeters.
   */
  arriveAt(target: GeoPoint, radiusMeters: number): void {
    const offsetMeters = radiusMeters * 0.6; // place at 60% of radius
    this._current = offsetPoint(target, -offsetMeters, 0); // slightly south
    this._notifyListeners();
  }

  /** [DEV] Manually emits the current location to all subscribers. */
  emitCurrentLocation(): void {
    this._notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Internal helper
  // ---------------------------------------------------------------------------

  private _notifyListeners(): void {
    const snapshot = this.getCurrentLocation();
    for (const listener of this._listeners) {
      listener(snapshot);
    }
  }
}
