// src/engine/location/DeviceLocationProvider.ts
// =============================================================================
// DeviceLocationProvider — Real Device GPS via expo-location
// =============================================================================
// Implements the existing LocationProvider interface using expo-location's
// foreground watchPositionAsync subscription.
//
// Architecture:
//   - Identical interface contract to SimulatedLocationProvider.
//   - All platform GPS logic is contained here; no screen or engine code changes.
//   - Callers depend only on LocationProvider — they cannot call GPS methods directly.
//
// Permissions:
//   - Requests FOREGROUND location only (ACCESS_FINE_LOCATION / whenInUse).
//   - Does NOT request background location.
//   - If permission is denied or unavailable, the provider transitions to the
//     appropriate PermissionStatus and stops without crashing.
//
// Accuracy:
//   - LocationAccuracy.High (~10 m) — appropriate for a walking tour.
//   - distanceInterval: 5 m — suppresses micro-jitter while walking.
//   - timeInterval: 3000 ms — max 1 update per 3 seconds on Android.
//
// Lifecycle:
//   - start()  → requests permission (once) → starts watchPositionAsync
//   - stop()   → removes the subscription, marks provider inactive
//   - reset()  → stops any active subscription and records new startCoords;
//                callers must call start() again to resume
//
// Status:
//   - permissionStatus exposes the last known PermissionStatus string so callers
//     can inspect denied/granted/undetermined states without reading React state.
//
// What requires physical-device testing (cannot be unit-tested in Jest):
//   - The actual OS permission dialog appearance
//   - Real GPS coordinate delivery over time
//   - GPS accuracy in outdoor vs indoor environments
// =============================================================================

import * as ExpoLocation from 'expo-location';
import { PermissionStatus } from 'expo';
import type { GeoPoint } from '../distance';
import type { LocationProvider, LocationListener, Unsubscribe } from './types';

/** The accuracy setting used for walking-tour foreground tracking. */
const WALK_ACCURACY = ExpoLocation.LocationAccuracy.High;

/** Minimum movement (meters) before a new update is emitted. Reduces jitter. */
const DISTANCE_INTERVAL_METERS = 5;

/** Minimum time (ms) between updates on Android. iOS ignores this. */
const TIME_INTERVAL_MS = 3000;

// =============================================================================
// Public status type — exposes GPS + permission state without React state
// =============================================================================

export type DeviceLocationStatus =
  | 'idle'            // start() not yet called
  | 'starting'        // permission request in flight
  | 'active'          // receiving location updates
  | 'permission-denied'  // user denied foreground location
  | 'unavailable'     // services disabled or other platform error
  | 'stopped';        // stop() was called

// =============================================================================
// Implementation
// =============================================================================

export class DeviceLocationProvider implements LocationProvider {
  // Last known GeoPoint — returned synchronously by getCurrentLocation()
  private _current: GeoPoint;

  // Expo-location subscription handle; non-null while active
  private _subscription: ExpoLocation.LocationSubscription | null = null;

  // Active subscribers
  private readonly _listeners: Set<LocationListener> = new Set();

  // True between a successful start() and a stop() call
  private _isRunning: boolean = false;

  // Prevents concurrent start() calls from stacking
  private _startInFlight: boolean = false;

  // Tracks the last permission outcome for callers to inspect
  private _permissionStatus: PermissionStatus = PermissionStatus.UNDETERMINED;

  // Public status for UI/diagnostic consumers
  private _status: DeviceLocationStatus = 'idle';

  // Listeners for status changes (permission granted, denied, active, etc.)
  private readonly _statusListeners: Set<(status: DeviceLocationStatus) => void> = new Set();

  /**
   * @param defaultCoords  Fallback position returned by getCurrentLocation()
   *                       before the first real GPS fix arrives.
   *                       Pass the first tour stop's coordinates or any
   *                       known starting point.
   */
  constructor(defaultCoords: GeoPoint) {
    this._current = { ...defaultCoords };
  }

  // ---------------------------------------------------------------------------
  // LocationProvider interface
  // ---------------------------------------------------------------------------

  /**
   * Requests foreground location permission (if not already granted) and begins
   * watching device position. Safe to call multiple times — concurrent calls are
   * deduplicated; calling start() while already active is a no-op.
   */
  start(): void {
    if (this._startInFlight) return;
    if (this._isRunning && this._status === 'active') return;
    // If running but in an error/unavailable state, clean up prior handle before re-acquiring
    if (this._isRunning) {
      this._removeSubscription();
      this._isRunning = false;
    }
    this._startInFlight = true;
    this._setStatus('starting');
    this._startAsync().finally(() => {
      this._startInFlight = false;
    });
  }

  /**
   * Removes the expo-location subscription and marks the provider inactive.
   * Safe to call multiple times.
   */
  stop(): void {
    this._startInFlight = false;
    this._removeSubscription();
    this._isRunning = false;
    this._setStatus('stopped');
  }

  /** True while the provider is actively receiving GPS updates. */
  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Returns the last known device position.
   * Returns the defaultCoords passed to the constructor until the first real
   * GPS fix arrives.
   */
  getCurrentLocation(): GeoPoint {
    return { ...this._current };
  }

  /**
   * Updates the fallback position. Does NOT re-start the GPS subscription.
   * Callers that want to resume from a new position should stop(), then start().
   *
   * Note: Unlike SimulatedLocationProvider, this does NOT notify listeners,
   * because resetting a real GPS provider while it is active has no meaningful
   * semantics — the device will report its own position regardless.
   */
  reset(startCoords: GeoPoint): void {
    this._current = { ...startCoords };
    // Stop any existing subscription; caller must call start() to resume.
    if (this._isRunning) {
      this.stop();
    }
  }

  /**
   * Subscribes a listener to receive location updates as they arrive from the device.
   * @returns An Unsubscribe function.
   */
  subscribe(listener: LocationListener): Unsubscribe {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  // ---------------------------------------------------------------------------
  // Public inspection properties (not in LocationProvider interface)
  // ---------------------------------------------------------------------------

  /**
   * The last known Expo PermissionStatus for foreground location.
   * Useful for rendering appropriate UI without making an additional async call.
   */
  get permissionStatus(): PermissionStatus {
    return this._permissionStatus;
  }

  /**
   * Detailed provider lifecycle status.
   * Callers can display appropriate messaging without coupling to Expo internals.
   */
  get status(): DeviceLocationStatus {
    return this._status;
  }

  /** Number of active listeners — useful for testing subscription cleanup. */
  get listenerCount(): number {
    return this._listeners.size;
  }

  /**
   * Subscribes a listener to provider status changes (idle, starting, active, permission-denied, unavailable, stopped).
   * Immediately calls the listener with the current status upon subscription.
   */
  subscribeStatus(listener: (status: DeviceLocationStatus) => void): Unsubscribe {
    this._statusListeners.add(listener);
    listener(this._status);
    return () => {
      this._statusListeners.delete(listener);
    };
  }

  // ---------------------------------------------------------------------------
  // Private implementation
  // ---------------------------------------------------------------------------

  private _setStatus(status: DeviceLocationStatus): void {
    this._status = status;
    for (const listener of this._statusListeners) {
      try {
        listener(status);
      } catch (err) {
        console.warn('[DeviceLocationProvider] Error in status listener:', err);
      }
    }
  }

  /** Async body of start() — separated so start() itself stays synchronous. */
  private async _startAsync(): Promise<void> {
    try {
      // 1. Request permission — only shows the system dialog on first call
      const permissionResult = await ExpoLocation.requestForegroundPermissionsAsync();
      this._permissionStatus = permissionResult.status;

      if (permissionResult.status !== PermissionStatus.GRANTED) {
        this._isRunning = false;
        this._setStatus('permission-denied');
        return;
      }

      // Guard: stop() may have been called while permission was in flight
      if (!this._startInFlight) return;

      // 2. Start watching position
      const subscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: WALK_ACCURACY,
          distanceInterval: DISTANCE_INTERVAL_METERS,
          timeInterval: TIME_INTERVAL_MS,
        },
        (locationObject) => {
          this._handleLocationUpdate(locationObject);
        },
        (errorMessage) => {
          console.warn('[DeviceLocationProvider] GPS error:', errorMessage);
          this._setStatus('unavailable');
        },
      );

      // Guard: stop() may have been called while watchPositionAsync was in flight
      if (!this._startInFlight) {
        subscription.remove();
        return;
      }

      this._subscription = subscription;
      this._isRunning = true;
      this._setStatus('active');
    } catch (err) {
      console.warn('[DeviceLocationProvider] Failed to start:', err);
      this._isRunning = false;
      this._setStatus('unavailable');
    }
  }

  /** Handles a raw expo-location update and fans it out to subscribers. */
  private _handleLocationUpdate(locationObject: ExpoLocation.LocationObject): void {
    const { latitude, longitude, accuracy } = locationObject.coords;
    const timestamp = locationObject.timestamp;
    this._current = { latitude, longitude, accuracy, timestamp };
    if (this._isRunning && this._status !== 'active') {
      this._setStatus('active');
    }
    this._notifyListeners();
  }

  /** Removes the native watchPositionAsync subscription, if active. */
  private _removeSubscription(): void {
    if (this._subscription) {
      this._subscription.remove();
      this._subscription = null;
    }
  }

  /** Fans the current location out to all registered listeners. */
  private _notifyListeners(): void {
    const snapshot = this.getCurrentLocation();
    for (const listener of this._listeners) {
      listener(snapshot);
    }
  }
}
