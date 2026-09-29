// src/engine/location/types.ts
// =============================================================================
// LocationProvider — Core Abstraction
// =============================================================================
// The tour engine depends ONLY on this interface.
// It never imports SimulatedLocationProvider directly.
//
// Current implementations:
//   SimulatedLocationProvider  — deterministic dev/test provider (M5.2)
//
// Planned future implementations:
//   DeviceLocationProvider     — wraps expo-location for real GPS (later milestone)
//
// Design principles:
//   - Synchronous getCurrentLocation() for reading the latest known position.
//   - Observable subscribe() for listening to location updates (push model).
//   - start()/stop() lifecycle mirrors real GPS sensor control.
//   - reset() enables deterministic test setup.
//   - Simulation-specific methods (setLocation, moveToward…) live ONLY in
//     SimulatedLocationProvider, not in this interface.
// =============================================================================

import type { GeoPoint } from '../distance';

/** Listener callback invoked when the provider updates its location. */
export type LocationListener = (location: GeoPoint) => void;

/** Function returned by subscribe() to cancel the subscription. */
export type Unsubscribe = () => void;

export interface LocationProvider {
  /**
   * Begin providing location data.
   * For real GPS, this activates the device sensor.
   * For the simulator, this marks the provider as active.
   */
  start(): void;

  /**
   * Stop providing location data.
   * For real GPS, this releases the device sensor.
   * For the simulator, this marks the provider as inactive.
   */
  stop(): void;

  /** True while the provider is active (between start() and stop() calls). */
  readonly isRunning: boolean;

  /**
   * Returns the provider's current best-known position.
   * Safe to call before start() — returns the last known or initial position.
   */
  getCurrentLocation(): GeoPoint;

  /**
   * Resets the provider to a known starting position.
   * Primarily used in tests and tour restart scenarios.
   * Does not stop the provider if it is running.
   */
  reset(startCoords: GeoPoint): void;

  /**
   * Subscribes a listener to receive location updates as they occur.
   * @param listener Callback receiving the updated coordinates.
   * @returns An Unsubscribe function to cleanly remove the listener.
   */
  subscribe(listener: LocationListener): Unsubscribe;
}
