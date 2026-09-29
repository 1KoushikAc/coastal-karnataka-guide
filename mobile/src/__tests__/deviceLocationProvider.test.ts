// src/__tests__/deviceLocationProvider.test.ts
// =============================================================================
// DeviceLocationProvider — Unit Tests (M6.1)
// =============================================================================
//
// MOCKING STRATEGY
// ----------------
// expo-location is a native module. It cannot run in the Node/Jest environment.
// All expo-location API calls are mocked via jest.mock() below.
//
// What is MOCKED (cannot run in Jest):
//   - requestForegroundPermissionsAsync()
//   - watchPositionAsync()
//   - The native GPS sensor and OS permission dialog
//
// What is REAL (executes in Jest without mocks):
//   - DeviceLocationProvider class logic
//   - Listener fan-out
//   - Permission status branching
//   - Subscription lifecycle (start/stop/isRunning)
//   - GeoPoint conversion
//   - Multiple-listener handling
//   - Unsubscribe behavior
//
// What requires a PHYSICAL DEVICE to verify:
//   - Actual OS permission dialog appearance
//   - Real GPS coordinate delivery and accuracy
//   - Behavior in GPS-denied environments (indoors, tunnels)
//   - Battery and sensor behavior
// =============================================================================

import { PermissionStatus } from 'expo';
import type { GeoPoint } from '../engine/distance';

// ---------------------------------------------------------------------------
// Mock expo-location BEFORE importing the provider
// ---------------------------------------------------------------------------

/** Shared handle returned by mock watchPositionAsync */
let mockRemoveFn: jest.Mock;
/** Captured position callback from the last watchPositionAsync call */
let capturedPositionCallback: ((loc: { coords: { latitude: number; longitude: number } }) => void) | null = null;
/** Captured error callback */
let capturedErrorCallback: ((msg: string) => void) | null = null;

jest.mock('expo-location', () => {
  const mockLocationAccuracy = {
    Lowest: 1,
    Low: 2,
    Balanced: 3,
    High: 4,
    Highest: 5,
    BestForNavigation: 6,
  };

  return {
    LocationAccuracy: mockLocationAccuracy,
    requestForegroundPermissionsAsync: jest.fn(),
    watchPositionAsync: jest.fn(),
  };
});

// Mock 'expo' PermissionStatus separately
jest.mock('expo', () => ({
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined',
  },
}));

import * as ExpoLocation from 'expo-location';
import { DeviceLocationProvider, type DeviceLocationStatus } from '../engine/location/DeviceLocationProvider';

// ---------------------------------------------------------------------------
// Typed mock helpers
// ---------------------------------------------------------------------------

const mockRequestPermissions = ExpoLocation.requestForegroundPermissionsAsync as jest.MockedFunction<
  typeof ExpoLocation.requestForegroundPermissionsAsync
>;
const mockWatchPosition = ExpoLocation.watchPositionAsync as jest.MockedFunction<
  typeof ExpoLocation.watchPositionAsync
>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const KADRI_TEMPLE: GeoPoint = { latitude: 12.8876, longitude: 74.8429 };
const ST_ALOYSIUS: GeoPoint  = { latitude: 12.8656, longitude: 74.8426 };

/** Builds a minimal mock expo-location LocationObject */
function makeLocationObject(lat: number, lng: number) {
  return {
    coords: { latitude: lat, longitude: lng, altitude: null, accuracy: 10, altitudeAccuracy: null, heading: null, speed: null },
    timestamp: Date.now(),
    mocked: false,
  };
}

/** Sets up mocks for a typical "permission granted, watch succeeds" scenario */
function setupGrantedMock() {
  mockRemoveFn = jest.fn();
  capturedPositionCallback = null;
  capturedErrorCallback = null;

  mockRequestPermissions.mockResolvedValue({
    status: PermissionStatus.GRANTED,
    granted: true,
    canAskAgain: true,
    expires: 'never',
  } as any);

  mockWatchPosition.mockImplementation(async (_options, posCallback, errCallback) => {
    capturedPositionCallback = posCallback as any;
    capturedErrorCallback = errCallback ?? null;
    return { remove: mockRemoveFn };
  });
}

/** Sets up mocks for a "permission denied" scenario */
function setupDeniedMock() {
  mockRequestPermissions.mockResolvedValue({
    status: PermissionStatus.DENIED,
    granted: false,
    canAskAgain: false,
    expires: 'never',
  } as any);
  mockWatchPosition.mockClear();
}

// Helper — flushes the promise queue so async start() completes in tests
async function flushPromises(): Promise<void> {
  await new Promise<void>(resolve => setImmediate(() => resolve()));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeviceLocationProvider — construction and initial state', () => {
  test('provider starts in idle status', () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    expect(provider.status).toBe<DeviceLocationStatus>('idle');
  });

  test('isRunning is false before start()', () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    expect(provider.isRunning).toBe(false);
  });

  test('getCurrentLocation returns the default coords before any GPS fix', () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    const loc = provider.getCurrentLocation();
    expect(loc.latitude).toBeCloseTo(KADRI_TEMPLE.latitude, 6);
    expect(loc.longitude).toBeCloseTo(KADRI_TEMPLE.longitude, 6);
  });

  test('getCurrentLocation returns a snapshot (mutation does not affect internal state)', () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    const loc = provider.getCurrentLocation();
    (loc as { latitude: number }).latitude = 999;
    expect(provider.getCurrentLocation().latitude).toBeCloseTo(KADRI_TEMPLE.latitude, 6);
  });

  test('listenerCount is 0 before any subscriptions', () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    expect(provider.listenerCount).toBe(0);
  });

  test('permissionStatus starts as UNDETERMINED', () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    expect(provider.permissionStatus).toBe(PermissionStatus.UNDETERMINED);
  });
});

// ---------------------------------------------------------------------------

describe('DeviceLocationProvider — permission granted flow', () => {
  beforeEach(() => {
    setupGrantedMock();
    jest.clearAllMocks();
    setupGrantedMock(); // re-apply after clearAllMocks
  });

  test('start() transitions status to "starting" then "active"', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    // Briefly in "starting"
    expect(provider.status).toBe<DeviceLocationStatus>('starting');
    await flushPromises();
    expect(provider.status).toBe<DeviceLocationStatus>('active');
    expect(provider.isRunning).toBe(true);
  });

  test('requestForegroundPermissionsAsync is called exactly once on start()', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();
    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
  });

  test('watchPositionAsync is called with High accuracy', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
    const [options] = mockWatchPosition.mock.calls[0];
    expect(options.accuracy).toBe(4); // LocationAccuracy.High
  });

  test('watchPositionAsync is called with distanceInterval set', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();
    const [options] = mockWatchPosition.mock.calls[0];
    expect(typeof options.distanceInterval).toBe('number');
    expect(options.distanceInterval).toBeGreaterThan(0);
  });

  test('permissionStatus is GRANTED after successful start()', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();
    expect(provider.permissionStatus).toBe(PermissionStatus.GRANTED);
  });

  test('concurrent start() calls do not create duplicate subscriptions', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    provider.start(); // second call — should be deduplicated
    provider.start(); // third call
    await flushPromises();
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
  });

  test('calling start() again while already active does not create a new subscription', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();
    provider.start(); // already running
    await flushPromises();
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------

describe('DeviceLocationProvider — permission denied flow', () => {
  beforeEach(() => {
    setupDeniedMock();
  });

  test('status is "permission-denied" when permission is denied', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();
    expect(provider.status).toBe<DeviceLocationStatus>('permission-denied');
  });

  test('isRunning is false when permission is denied', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();
    expect(provider.isRunning).toBe(false);
  });

  test('watchPositionAsync is NOT called when permission is denied', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();
    expect(mockWatchPosition).not.toHaveBeenCalled();
  });

  test('permissionStatus is DENIED', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();
    expect(provider.permissionStatus).toBe(PermissionStatus.DENIED);
  });

  test('provider does not crash; getCurrentLocation returns default coords', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();
    expect(() => provider.getCurrentLocation()).not.toThrow();
    const loc = provider.getCurrentLocation();
    expect(loc.latitude).toBeCloseTo(KADRI_TEMPLE.latitude, 6);
  });

  test('listeners do not receive any callbacks when permission is denied', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    const listener = jest.fn();
    provider.subscribe(listener);
    provider.start();
    await flushPromises();
    expect(listener).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------

describe('DeviceLocationProvider — location updates and subscription', () => {
  beforeEach(() => {
    setupGrantedMock();
    jest.clearAllMocks();
    setupGrantedMock();
  });

  test('GPS update is reflected in getCurrentLocation()', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();

    capturedPositionCallback!(makeLocationObject(ST_ALOYSIUS.latitude, ST_ALOYSIUS.longitude));
    const loc = provider.getCurrentLocation();
    expect(loc.latitude).toBeCloseTo(ST_ALOYSIUS.latitude, 6);
    expect(loc.longitude).toBeCloseTo(ST_ALOYSIUS.longitude, 6);
  });

  test('GPS update notifies subscribed listeners', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    const listener = jest.fn<void, [GeoPoint]>();
    provider.subscribe(listener);
    provider.start();
    await flushPromises();

    capturedPositionCallback!(makeLocationObject(ST_ALOYSIUS.latitude, ST_ALOYSIUS.longitude));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].latitude).toBeCloseTo(ST_ALOYSIUS.latitude, 6);
  });

  test('multiple subscribers all receive location updates', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    const l1 = jest.fn();
    const l2 = jest.fn();
    provider.subscribe(l1);
    provider.subscribe(l2);
    provider.start();
    await flushPromises();

    capturedPositionCallback!(makeLocationObject(ST_ALOYSIUS.latitude, ST_ALOYSIUS.longitude));
    expect(l1).toHaveBeenCalledTimes(1);
    expect(l2).toHaveBeenCalledTimes(1);
  });

  test('unsubscribed listener does not receive further GPS updates', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    const listener = jest.fn();
    const unsubscribe = provider.subscribe(listener);
    provider.start();
    await flushPromises();

    capturedPositionCallback!(makeLocationObject(ST_ALOYSIUS.latitude, ST_ALOYSIUS.longitude));
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    capturedPositionCallback!(makeLocationObject(KADRI_TEMPLE.latitude, KADRI_TEMPLE.longitude));
    expect(listener).toHaveBeenCalledTimes(1); // not called again
  });

  test('subscribe increments listenerCount; unsubscribe decrements it', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    expect(provider.listenerCount).toBe(0);
    const unsub1 = provider.subscribe(jest.fn());
    const unsub2 = provider.subscribe(jest.fn());
    expect(provider.listenerCount).toBe(2);
    unsub1();
    expect(provider.listenerCount).toBe(1);
    unsub2();
    expect(provider.listenerCount).toBe(0);
  });

  test('successive GPS fixes are reflected in getCurrentLocation()', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();

    const fixes: GeoPoint[] = [
      { latitude: 12.88, longitude: 74.84 },
      { latitude: 12.87, longitude: 74.85 },
      { latitude: 12.86, longitude: 74.86 },
    ];
    for (const fix of fixes) {
      capturedPositionCallback!(makeLocationObject(fix.latitude, fix.longitude));
      const loc = provider.getCurrentLocation();
      expect(loc.latitude).toBeCloseTo(fix.latitude, 5);
      expect(loc.longitude).toBeCloseTo(fix.longitude, 5);
    }
  });
});

// ---------------------------------------------------------------------------

describe('DeviceLocationProvider — stop() and cleanup', () => {
  beforeEach(() => {
    setupGrantedMock();
    jest.clearAllMocks();
    setupGrantedMock();
  });

  test('stop() calls remove() on the LocationSubscription', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();

    expect(mockRemoveFn).not.toHaveBeenCalled();
    provider.stop();
    expect(mockRemoveFn).toHaveBeenCalledTimes(1);
  });

  test('stop() sets isRunning to false', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();
    expect(provider.isRunning).toBe(true);
    provider.stop();
    expect(provider.isRunning).toBe(false);
  });

  test('stop() transitions status to "stopped"', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();
    provider.stop();
    expect(provider.status).toBe<DeviceLocationStatus>('stopped');
  });

  test('stop() before start() does not crash', () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    expect(() => provider.stop()).not.toThrow();
  });

  test('calling stop() twice does not call remove() twice', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();
    provider.stop();
    provider.stop(); // second call
    expect(mockRemoveFn).toHaveBeenCalledTimes(1);
  });

  test('no native subscription remains active after stop()', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    const listener = jest.fn();
    provider.subscribe(listener);
    provider.start();
    await flushPromises();

    provider.stop();

    // GPS callback still fires (native side does not know we stopped immediately in tests)
    // but our listener list is still active — what matters is no duplicate subscriptions
    // were created and remove() was called
    expect(mockRemoveFn).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------

describe('DeviceLocationProvider — reset()', () => {
  beforeEach(() => {
    setupGrantedMock();
    jest.clearAllMocks();
    setupGrantedMock();
  });

  test('reset() updates the default coords', () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.reset(ST_ALOYSIUS);
    const loc = provider.getCurrentLocation();
    expect(loc.latitude).toBeCloseTo(ST_ALOYSIUS.latitude, 6);
    expect(loc.longitude).toBeCloseTo(ST_ALOYSIUS.longitude, 6);
  });

  test('reset() stops an active subscription', async () => {
    const provider = new DeviceLocationProvider(KADRI_TEMPLE);
    provider.start();
    await flushPromises();
    expect(provider.isRunning).toBe(true);

    provider.reset(ST_ALOYSIUS);
    expect(mockRemoveFn).toHaveBeenCalledTimes(1);
    expect(provider.isRunning).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe('DeviceLocationProvider — LocationProvider interface compliance', () => {
  beforeEach(() => {
    setupGrantedMock();
    jest.clearAllMocks();
    setupGrantedMock();
  });

  test('DeviceLocationProvider satisfies the LocationProvider interface', async () => {
    // Typed as the interface — proves all required members are present
    // No GPS engine logic should need to know the concrete type
    const provider: import('../engine/location/types').LocationProvider =
      new DeviceLocationProvider(KADRI_TEMPLE);

    expect(typeof provider.start).toBe('function');
    expect(typeof provider.stop).toBe('function');
    expect(typeof provider.isRunning).toBe('boolean');
    expect(typeof provider.getCurrentLocation).toBe('function');
    expect(typeof provider.reset).toBe('function');
    expect(typeof provider.subscribe).toBe('function');

    provider.start();
    await flushPromises();
    expect(provider.isRunning).toBe(true);

    const loc = provider.getCurrentLocation();
    expect(typeof loc.latitude).toBe('number');
    expect(typeof loc.longitude).toBe('number');

    provider.stop();
    expect(provider.isRunning).toBe(false);
  });
});
