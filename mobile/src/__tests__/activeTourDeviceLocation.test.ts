// src/__tests__/activeTourDeviceLocation.test.ts
// =============================================================================
// Active Tour + DeviceLocationProvider Integration Tests (M6.2)
// =============================================================================
// Verifies:
//   1. Active Tour can use DeviceLocationProvider.
//   2. Location permission granted → provider starts.
//   3. Permission denied → graceful traveler-facing state.
//   4. Real location outside radius → stop remains unreached.
//   5. Real location inside radius → stop is reached.
//   6. Progress updates correctly.
//   7. Next stop becomes active.
//   8. Final stop completes the tour.
//   9. Leaving Active Tour cleans up subscriptions.
//   10. Re-entering Active Tour does not create duplicate subscriptions.
//   11. Reset/complete cleans up location tracking.
//   12. Simulated provider remains usable for development tests.
//   13. Existing M5.1/M5.2/M5.3 tests remain passing.
// =============================================================================

import { PermissionStatus } from 'expo';
import type { GeoPoint } from '../engine/distance';
import { computeDistanceMeters, offsetPoint } from '../engine/distance';
import { tours, attractions } from '@data/index';
import { TourLocationController } from '../engine/TourLocationController';
import { SimulatedLocationProvider } from '../engine/location/SimulatedLocationProvider';
import { progressFraction } from '../engine/types';

// ---------------------------------------------------------------------------
// Mock expo-location & expo
// ---------------------------------------------------------------------------

let mockRemoveFn: jest.Mock;
let capturedPositionCallback: ((loc: { coords: { latitude: number; longitude: number } }) => void) | null = null;
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

jest.mock('expo', () => ({
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined',
  },
}));

import * as ExpoLocation from 'expo-location';
import { DeviceLocationProvider } from '../engine/location/DeviceLocationProvider';

const mockRequestPermissions = ExpoLocation.requestForegroundPermissionsAsync as jest.MockedFunction<
  typeof ExpoLocation.requestForegroundPermissionsAsync
>;
const mockWatchPosition = ExpoLocation.watchPositionAsync as jest.MockedFunction<
  typeof ExpoLocation.watchPositionAsync
>;

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

function setupDeniedMock() {
  mockRequestPermissions.mockResolvedValue({
    status: PermissionStatus.DENIED,
    granted: false,
    canAskAgain: false,
    expires: 'never',
  } as any);
  mockWatchPosition.mockClear();
}

function makeLocationObject(lat: number, lng: number) {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      altitude: null,
      accuracy: 10,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
    mocked: false,
  };
}

async function flushPromises(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(() => resolve()));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('M6.2 Active Tour + DeviceLocationProvider Integration', () => {
  const heritageTour = tours.find((t) => t.id === 'mangalore-heritage-walk')!;
  const stop1Attraction = attractions.find((a) => a.id === heritageTour.stops[0].attractionId)!;
  const stop2Attraction = attractions.find((a) => a.id === heritageTour.stops[1].attractionId)!;

  beforeEach(() => {
    setupGrantedMock();
    jest.clearAllMocks();
    setupGrantedMock();
  });

  test('1. Active Tour can use DeviceLocationProvider', async () => {
    const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions, false);

    expect(controller.getProvider()).toBe(provider);
    expect(controller.getSession().hasStarted).toBe(true);
    expect(controller.getSession().currentStopIndex).toBe(0);

    controller.destroy();
  });

  test('2. Location permission granted → provider starts and begins tracking', async () => {
    const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions, false);

    controller.start();
    await flushPromises();

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
    expect(provider.isRunning).toBe(true);
    expect(provider.status).toBe('active');

    controller.destroy();
  });

  test('3. Permission denied → graceful traveler-facing state without crashing', async () => {
    setupDeniedMock();

    const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
    let capturedStatus = '';
    provider.subscribeStatus((s) => {
      capturedStatus = s;
    });

    const controller = TourLocationController.create(heritageTour, provider, attractions, false);

    controller.start();
    await flushPromises();

    expect(provider.status).toBe('permission-denied');
    expect(capturedStatus).toBe('permission-denied');
    expect(provider.isRunning).toBe(false);
    expect(mockWatchPosition).not.toHaveBeenCalled();

    // Controller safely falls back to default coordinates without throwing
    expect(() => controller.getDistanceToCurrentStop()).not.toThrow();

    controller.destroy();
  });

  test('4. Real location outside radius → stop remains unreached', async () => {
    const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions, false);

    controller.start();
    await flushPromises();

    // Emit a GPS position 150m away from stop 1 (trigger radius is 50m)
    const farPoint = offsetPoint(stop1Attraction.coordinates, 150, 0);
    capturedPositionCallback!(makeLocationObject(farPoint.latitude, farPoint.longitude));

    const distance = controller.getDistanceToCurrentStop();
    expect(distance).toBeGreaterThan(heritageTour.stops[0].triggerRadiusMeters);
    expect(controller.getSession().isCurrentStopReached).toBe(false);

    controller.destroy();
  });

  test('5. Real location inside radius → stop is marked reached', async () => {
    const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions, false);

    const sessionUpdates: boolean[] = [];
    controller.subscribe((s) => {
      sessionUpdates.push(s.isCurrentStopReached);
    });

    controller.start();
    await flushPromises();

    // Emit a GPS position 20m away from stop 1 (well inside 50m trigger radius)
    const nearPoint = offsetPoint(stop1Attraction.coordinates, 20, 0);
    capturedPositionCallback!(makeLocationObject(nearPoint.latitude, nearPoint.longitude));

    expect(controller.getSession().isCurrentStopReached).toBe(true);
    expect(sessionUpdates).toContain(true);
    expect(controller.getDistanceToCurrentStop()).toBeLessThanOrEqual(
      heritageTour.stops[0].triggerRadiusMeters,
    );

    controller.destroy();
  });

  test('6. Progress updates correctly across stops', async () => {
    const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions, false);

    controller.start();
    await flushPromises();

    // At stop 0, before completion -> 0
    expect(progressFraction(controller.getSession())).toBe(0);

    // Stop 0 reached
    capturedPositionCallback!(
      makeLocationObject(stop1Attraction.coordinates.latitude, stop1Attraction.coordinates.longitude),
    );
    expect(controller.getSession().isCurrentStopReached).toBe(true);

    // Traveler advances -> stop 0 is marked complete, progress becomes 1/4 = 0.25
    controller.moveToNextStop();
    expect(progressFraction(controller.getSession())).toBe(0.25);

    controller.destroy();
  });

  test('7. Next stop becomes active when traveler advances', async () => {
    const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions, false);

    controller.start();
    await flushPromises();

    // Reach stop 1
    capturedPositionCallback!(
      makeLocationObject(stop1Attraction.coordinates.latitude, stop1Attraction.coordinates.longitude),
    );
    expect(controller.getSession().isCurrentStopReached).toBe(true);

    // Traveler clicks next stop
    controller.moveToNextStop();

    expect(controller.getSession().currentStopIndex).toBe(1);
    expect(controller.getSession().isCurrentStopReached).toBe(false);

    // Distance is now calculated to stop 2 (St. Aloysius Chapel)
    const distToStop2 = controller.getDistanceToCurrentStop();
    expect(distToStop2).toBeGreaterThan(100);

    controller.destroy();
  });

  test('8. Final stop completes the tour', async () => {
    const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions, false);

    controller.start();
    await flushPromises();

    // Traverse all 4 stops
    for (let i = 0; i < heritageTour.stops.length; i++) {
      const stop = heritageTour.stops[i];
      const attr = attractions.find((a) => a.id === stop.attractionId)!;

      // Reach the stop
      capturedPositionCallback!(makeLocationObject(attr.coordinates.latitude, attr.coordinates.longitude));
      expect(controller.getSession().isCurrentStopReached).toBe(true);

      // Advance
      controller.moveToNextStop();
    }

    expect(controller.getSession().isComplete).toBe(true);
    expect(progressFraction(controller.getSession())).toBe(1.0);

    controller.destroy();
  });

  test('9. Leaving Active Tour cleans up subscriptions', async () => {
    const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions, false);

    controller.start();
    await flushPromises();

    expect(mockRemoveFn).not.toHaveBeenCalled();

    // Simulate unmount / leaving Active Tour
    controller.stop();
    controller.destroy();

    expect(mockRemoveFn).toHaveBeenCalledTimes(1);
    expect(provider.isRunning).toBe(false);
  });

  test('10. Re-entering Active Tour does not create duplicate subscriptions', async () => {
    // First entry
    const provider1 = new DeviceLocationProvider(stop1Attraction.coordinates);
    const controller1 = TourLocationController.create(heritageTour, provider1, attractions, false);
    controller1.start();
    await flushPromises();
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);

    // Exit
    controller1.stop();
    controller1.destroy();
    expect(mockRemoveFn).toHaveBeenCalledTimes(1);

    // Second entry
    const provider2 = new DeviceLocationProvider(stop1Attraction.coordinates);
    const controller2 = TourLocationController.create(heritageTour, provider2, attractions, false);
    controller2.start();
    await flushPromises();

    expect(mockWatchPosition).toHaveBeenCalledTimes(2); // One per active session
    expect(provider2.isRunning).toBe(true);

    controller2.stop();
    controller2.destroy();
  });

  test('11. Reset cleans up and resets tour state', async () => {
    const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions, false);

    controller.start();
    await flushPromises();

    // Advance to stop 1
    capturedPositionCallback!(
      makeLocationObject(stop1Attraction.coordinates.latitude, stop1Attraction.coordinates.longitude),
    );
    controller.moveToNextStop();
    expect(controller.getSession().currentStopIndex).toBe(1);

    // Reset
    controller.reset();
    expect(controller.getSession().currentStopIndex).toBe(0);
    expect(controller.getSession().isCurrentStopReached).toBe(false);

    controller.destroy();
  });

  test('12. Simulated provider remains fully usable for development/tests', () => {
    const simProvider = new SimulatedLocationProvider(stop1Attraction.coordinates);
    const controller = TourLocationController.create(heritageTour, simProvider, attractions);

    expect(simProvider.isRunning).toBe(false);
    controller.start();
    expect(simProvider.isRunning).toBe(true);

    // Arrive using simulation method
    simProvider.arriveAt(stop1Attraction.coordinates, heritageTour.stops[0].triggerRadiusMeters);
    expect(controller.getSession().isCurrentStopReached).toBe(true);

    controller.destroy();
  });
});
