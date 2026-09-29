// src/__tests__/activeTourGpsReliability.test.ts
// =============================================================================
// M6.3 GPS Reliability & Edge-Case Handling Tests
// =============================================================================
// Verifies:
//   1. Inaccurate / low-confidence GPS readings do NOT trigger stop arrival.
//   2. Accurate GPS readings trigger stop arrival as expected.
//   3. Missing / undefined accuracy remains backward-compatible (e.g. simulated).
//   4. Corrupted / NaN coordinates are handled safely without crashing.
//   5. Repeated updates inside trigger radius do NOT reprocess or duplicate notifications.
//   6. Stale location updates arriving after stop transition are ignored.
//   7. Fresh location updates after stop transition correctly trigger arrival.
//   8. Temporary location unavailability preserves tour state and allows recovery.
//   9. Stopping while start() is in flight leaves no dangling native subscriptions.
//  10. Stopping and restarting provider works reliably.
//  11. TourLocationController idempotently handles listener start/stop lifecycle.
//  12. Custom maxAccuracyMeters threshold is respected.
// =============================================================================

import { PermissionStatus } from 'expo';
import type { GeoPoint } from '../engine/distance';
import { offsetPoint } from '../engine/distance';
import { tours, attractions } from '@data/index';
import {
  TourLocationController,
  DEFAULT_MAX_ACCURACY_METERS,
} from '../engine/TourLocationController';
import { SimulatedLocationProvider } from '../engine/location/SimulatedLocationProvider';

// ---------------------------------------------------------------------------
// Mock expo-location & expo
// ---------------------------------------------------------------------------

let mockRemoveFn: jest.Mock;
let capturedPositionCallback: ((loc: {
  coords: { latitude: number; longitude: number; accuracy?: number | null };
  timestamp: number;
}) => void) | null = null;
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

function makeLocationObject(
  lat: number,
  lng: number,
  accuracy: number | null = 10,
  timestamp: number = Date.now(),
) {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      altitude: null,
      accuracy,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp,
    mocked: false,
  };
}

async function flushPromises(): Promise<void> {
  await new Promise<void>((resolve) => setImmediate(() => resolve()));
}

// ---------------------------------------------------------------------------
// Test Suites
// ---------------------------------------------------------------------------

describe('M6.3 GPS Reliability & Edge-Case Handling', () => {
  const heritageTour = tours.find((t) => t.id === 'mangalore-heritage-walk')!;
  const stop1Attraction = attractions.find((a) => a.id === heritageTour.stops[0].attractionId)!;
  const stop2Attraction = attractions.find((a) => a.id === heritageTour.stops[1].attractionId)!;

  beforeEach(() => {
    setupGrantedMock();
    jest.clearAllMocks();
    setupGrantedMock();
  });

  // -------------------------------------------------------------------------
  // 1. Inaccurate / Low-Confidence GPS Readings
  // -------------------------------------------------------------------------
  describe('Inaccurate and low-confidence GPS readings', () => {
    test('reading inside trigger radius but with low accuracy (> 50m) does NOT mark stop reached', async () => {
      const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
      const controller = TourLocationController.create(heritageTour, provider, attractions, false);

      controller.start();
      await flushPromises();

      // Position is geometrically 10m from stop 1 (well inside 50m trigger radius)
      // but accuracy uncertainty is 80m (low confidence reading)
      const nearPoint = offsetPoint(stop1Attraction.coordinates, 10, 0);
      capturedPositionCallback!(makeLocationObject(nearPoint.latitude, nearPoint.longitude, 80));

      expect(controller.getSession().isCurrentStopReached).toBe(false);

      controller.destroy();
    });

    test('reading inside trigger radius with reliable accuracy (<= 50m) marks stop reached', async () => {
      const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
      const controller = TourLocationController.create(heritageTour, provider, attractions, false);

      controller.start();
      await flushPromises();

      // Position is geometrically 15m from stop 1 with high confidence accuracy (10m)
      const nearPoint = offsetPoint(stop1Attraction.coordinates, 15, 0);
      capturedPositionCallback!(makeLocationObject(nearPoint.latitude, nearPoint.longitude, 10));

      expect(controller.getSession().isCurrentStopReached).toBe(true);

      controller.destroy();
    });

    test('negative accuracy is treated as invalid fix and does not mark stop reached', async () => {
      const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
      const controller = TourLocationController.create(heritageTour, provider, attractions, false);

      controller.start();
      await flushPromises();

      const nearPoint = offsetPoint(stop1Attraction.coordinates, 5, 0);
      capturedPositionCallback!(makeLocationObject(nearPoint.latitude, nearPoint.longitude, -1));

      expect(controller.getSession().isCurrentStopReached).toBe(false);

      controller.destroy();
    });

    test('missing or undefined accuracy (simulated provider) remains backward-compatible and works', () => {
      const simProvider = new SimulatedLocationProvider(stop1Attraction.coordinates);
      const controller = TourLocationController.create(heritageTour, simProvider, attractions);

      controller.start();
      simProvider.arriveAt(stop1Attraction.coordinates, heritageTour.stops[0].triggerRadiusMeters);

      expect(controller.getSession().isCurrentStopReached).toBe(true);

      controller.destroy();
    });

    test('custom maxAccuracyMeters option is respected', async () => {
      const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
      // Configure strict 25m accuracy threshold
      const controller = TourLocationController.create(
        heritageTour,
        provider,
        attractions,
        false,
        { maxAccuracyMeters: 25 },
      );

      expect(controller.maxAccuracyMeters).toBe(25);

      controller.start();
      await flushPromises();

      const nearPoint = offsetPoint(stop1Attraction.coordinates, 10, 0);

      // 35m accuracy: rejected because > 25m
      capturedPositionCallback!(makeLocationObject(nearPoint.latitude, nearPoint.longitude, 35));
      expect(controller.getSession().isCurrentStopReached).toBe(false);

      // 20m accuracy: accepted because <= 25m
      capturedPositionCallback!(makeLocationObject(nearPoint.latitude, nearPoint.longitude, 20));
      expect(controller.getSession().isCurrentStopReached).toBe(true);

      controller.destroy();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Corrupted or Invalid Coordinates
  // -------------------------------------------------------------------------
  describe('Corrupted or invalid coordinate handling', () => {
    test('NaN coordinates do not crash and do not trigger stop arrival', async () => {
      const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
      const controller = TourLocationController.create(heritageTour, provider, attractions, false);

      controller.start();
      await flushPromises();

      // Emit corrupted NaN coordinates
      capturedPositionCallback!(makeLocationObject(NaN, NaN, 10));

      expect(controller.getSession().isCurrentStopReached).toBe(false);
      expect(controller.getDistanceToCurrentStop()).toBeNull();

      controller.destroy();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Repeated Location Updates Inside Trigger Radius
  // -------------------------------------------------------------------------
  describe('Repeated location updates inside trigger radius', () => {
    test('stop arrival is idempotent; multiple updates do not trigger duplicate listener calls', async () => {
      const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
      const controller = TourLocationController.create(heritageTour, provider, attractions, false);

      const sessionListener = jest.fn();
      controller.subscribe(sessionListener);

      controller.start();
      await flushPromises();

      const exactPoint = stop1Attraction.coordinates;

      // First arrival update
      capturedPositionCallback!(makeLocationObject(exactPoint.latitude, exactPoint.longitude, 10));
      expect(controller.getSession().isCurrentStopReached).toBe(true);
      expect(sessionListener).toHaveBeenCalledTimes(1);

      // 10 subsequent GPS updates while remaining at the stop
      for (let i = 0; i < 10; i++) {
        const jitterPoint = offsetPoint(exactPoint, (i % 3) * 2, (i % 2) * 2);
        capturedPositionCallback!(makeLocationObject(jitterPoint.latitude, jitterPoint.longitude, 10));
      }

      // Session listener should still only have been notified once
      expect(sessionListener).toHaveBeenCalledTimes(1);
      expect(controller.getSession().isCurrentStopReached).toBe(true);
      expect(controller.getSession().currentStopIndex).toBe(0);

      controller.destroy();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Stale Updates During Stop Transitions
  // -------------------------------------------------------------------------
  describe('Stale GPS updates during stop transitions', () => {
    test('stale location update from before stop transition does NOT mark new stop as reached', async () => {
      const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
      const controller = TourLocationController.create(heritageTour, provider, attractions, false);

      controller.start();
      await flushPromises();

      const arrivalTime = Date.now();

      // Stop 1 reached
      capturedPositionCallback!(
        makeLocationObject(
          stop1Attraction.coordinates.latitude,
          stop1Attraction.coordinates.longitude,
          10,
          arrivalTime,
        ),
      );
      expect(controller.getSession().isCurrentStopReached).toBe(true);

      // Advance to Stop 2
      controller.moveToNextStop();
      expect(controller.getSession().currentStopIndex).toBe(1);
      expect(controller.getSession().isCurrentStopReached).toBe(false);

      // Suppose a buffered/stale GPS callback from before the transition arrives,
      // even if its coordinates theoretically matched Stop 2:
      const staleTimestamp = arrivalTime - 1000;
      capturedPositionCallback!(
        makeLocationObject(
          stop2Attraction.coordinates.latitude,
          stop2Attraction.coordinates.longitude,
          10,
          staleTimestamp,
        ),
      );

      // The stale callback must NOT mark Stop 2 reached
      expect(controller.getSession().isCurrentStopReached).toBe(false);

      // When a fresh update with timestamp after transition arrives:
      const freshTimestamp = Date.now() + 500;
      capturedPositionCallback!(
        makeLocationObject(
          stop2Attraction.coordinates.latitude,
          stop2Attraction.coordinates.longitude,
          10,
          freshTimestamp,
        ),
      );

      // Now Stop 2 is marked reached
      expect(controller.getSession().isCurrentStopReached).toBe(true);

      controller.destroy();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Temporary Location Unavailability & Recovery
  // -------------------------------------------------------------------------
  describe('Temporary location unavailability & recovery', () => {
    test('GPS error transitions provider to unavailable without crashing or resetting tour', async () => {
      const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
      const controller = TourLocationController.create(heritageTour, provider, attractions, false);

      const statusHistory: string[] = [];
      provider.subscribeStatus((s) => statusHistory.push(s));

      controller.start();
      await flushPromises();

      expect(provider.status).toBe('active');

      // Simulate native GPS sensor error (e.g. signal loss in tunnel)
      expect(capturedErrorCallback).toBeDefined();
      capturedErrorCallback!('GPS signal lost');

      expect(provider.status).toBe('unavailable');
      expect(statusHistory).toContain('unavailable');

      // Tour session state is completely intact
      expect(controller.getSession().hasStarted).toBe(true);
      expect(controller.getSession().currentStopIndex).toBe(0);
      expect(controller.getSession().isComplete).toBe(false);

      // When GPS lock returns and a location update arrives:
      capturedPositionCallback!(
        makeLocationObject(stop1Attraction.coordinates.latitude, stop1Attraction.coordinates.longitude, 10),
      );

      // Provider recovers to active status
      expect(provider.status).toBe('active');
      expect(controller.getSession().isCurrentStopReached).toBe(true);

      controller.destroy();
    });

    test('restarting GPS after unavailable state cleans up previous handle and starts anew', async () => {
      const provider = new DeviceLocationProvider(stop1Attraction.coordinates);
      provider.start();
      await flushPromises();

      expect(provider.status).toBe('active');
      capturedErrorCallback!('GPS interrupted');
      expect(provider.status).toBe('unavailable');

      // Restart provider (simulating user pressing "Retry GPS")
      provider.start();
      await flushPromises();

      expect(mockWatchPosition).toHaveBeenCalledTimes(2);
      expect(provider.status).toBe('active');

      provider.stop();
    });
  });

  // -------------------------------------------------------------------------
  // 6. Stop / Start Subscription Safety
  // -------------------------------------------------------------------------
  describe('Subscription lifecycle and cleanup safety', () => {
    test('stopping while permission is in flight aborts without starting watchPositionAsync', async () => {
      const provider = new DeviceLocationProvider(stop1Attraction.coordinates);

      // Call start() but immediately call stop() before permission resolves
      provider.start();
      provider.stop();

      await flushPromises();

      // Native watchPositionAsync was never called
      expect(mockWatchPosition).not.toHaveBeenCalled();
      expect(provider.isRunning).toBe(false);
      expect(provider.status).toBe('stopped');
    });

    test('stopping while watchPositionAsync is in flight cleans up native subscription upon resolution', async () => {
      const provider = new DeviceLocationProvider(stop1Attraction.coordinates);

      mockWatchPosition.mockImplementationOnce(async () => {
        // stop() is called while watchPositionAsync is awaiting
        provider.stop();
        return { remove: mockRemoveFn };
      });

      provider.start();
      await flushPromises();

      // The subscription that resolved was immediately removed
      expect(mockRemoveFn).toHaveBeenCalledTimes(1);
      expect(provider.isRunning).toBe(false);
      expect(provider.status).toBe('stopped');
    });

    test('TourLocationController.startListening() is idempotent and handles cleanup', () => {
      const simProvider = new SimulatedLocationProvider(stop1Attraction.coordinates);
      const controller = TourLocationController.create(heritageTour, simProvider, attractions, false);

      expect(controller.isListening).toBe(false);

      controller.startListening();
      expect(controller.isListening).toBe(true);
      expect(simProvider.listenerCount).toBe(1);

      // Second call should be a no-op and not duplicate listeners
      controller.startListening();
      expect(simProvider.listenerCount).toBe(1);

      controller.stopListening();
      expect(controller.isListening).toBe(false);
      expect(simProvider.listenerCount).toBe(0);

      controller.destroy();
    });
  });
});
