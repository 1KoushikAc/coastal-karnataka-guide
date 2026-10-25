// mobile/src/__tests__/planPersistence.test.ts
// =============================================================================
// M8: Personalized Plan Local Persistence Tests & Hardened Audit Cases
// =============================================================================
// Verifies:
//   1. Storage layer: save, load, delete, clear, corrupt data handling.
//   2. Concurrent write serialization (queue prevents write clobbering).
//   3. Defensive validation: strict schema version, coordinates, malformed records.
//   4. Registry hydration: restoring saved tours across simulated app restarts.
//   5. Hydration race-condition guard: concurrent tour registration during hydration.
//   6. getTourById(tourId) resolution of restored custom tours.
//   7. Active Tour Controller compatibility with restored custom tours.
//   8. Storage failure observability and retry recovery.
//   9. Curated tours (mangalore-heritage-walk) unaffected.
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  savePlanToStorage,
  loadPlansFromStorage,
  deletePlanFromStorage,
  clearPlansFromStorage,
  isValidPersonalizedPlan,
  STORAGE_KEY_PERSONALIZED_PLANS,
  STORAGE_SCHEMA_VERSION,
} from '../engine/planner/storage';
import {
  initializePlanRegistry,
  savePersonalizedPlan,
  savePersonalizedPlanAsync,
  getPersonalizedPlan,
  getTourById,
  getAllPersonalizedPlans,
  clearPlanRegistry,
  isPlanRegistryHydrated,
  waitForPlanRegistryHydration,
  onPersistenceError,
  getLastPersistenceError,
  clearLastPersistenceError,
  retryPendingPersistence,
} from '../engine/planner/registry';
import { planPersonalizedTour } from '../engine/planner/tripPlanner';
import type { PersonalizedPlanResult, TravelerPreferences } from '../engine/planner/types';
import { TourLocationController } from '../engine/TourLocationController';
import { SimulatedLocationProvider } from '../engine/location/SimulatedLocationProvider';
import { destinations, attractions, stories, tours as staticTours } from '@data/index';

// Mock AsyncStorage using the official mock implementation
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('M8: Personalized Tour Local Persistence & Hardening Audit', () => {
  const mangaloreDest = destinations.find((d) => d.id === 'mangalore')!;

  function createTestPlan(overrides: Partial<TravelerPreferences> = {}): PersonalizedPlanResult {
    const prefs: TravelerPreferences = {
      destinationId: 'mangalore',
      availableTime: '3-4_hours',
      budget: 'any',
      selectedInterests: ['history', 'religious'],
      skippedAttractions: [],
      ...overrides,
    };
    return planPersonalizedTour(prefs, mangaloreDest, attractions, stories);
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    await clearPlanRegistry({ includeStorage: true });
    clearLastPersistenceError();
  });

  // ---------------------------------------------------------------------------
  // 1. Storage Module Unit Tests
  // ---------------------------------------------------------------------------
  describe('Storage Module (storage.ts)', () => {
    it('returns empty array when storage is uninitialized', async () => {
      const plans = await loadPlansFromStorage();
      expect(plans).toEqual([]);
    });

    it('saves and loads a valid personalized plan', async () => {
      const plan = createTestPlan();
      expect(plan.success).toBe(true);

      await savePlanToStorage(plan);
      const loaded = await loadPlansFromStorage();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(plan.id);
      expect(loaded[0].generatedTour?.id).toBe(plan.generatedTour?.id);
      expect(loaded[0].plannedStops).toHaveLength(plan.plannedStops.length);
    });

    it('merges multiple plans without overwriting others', async () => {
      const plan1 = createTestPlan({ availableTime: '3-4_hours' });
      const plan2 = createTestPlan({ availableTime: '1-2_hours' });

      await savePlanToStorage(plan1);
      await savePlanToStorage(plan2);

      const loaded = await loadPlansFromStorage();
      expect(loaded).toHaveLength(2);

      const ids = loaded.map((p) => p.id);
      expect(ids).toContain(plan1.id);
      expect(ids).toContain(plan2.id);
    });

    it('serializes concurrent writes via the internal queue without dropping data', async () => {
      const planA = createTestPlan({ availableTime: '1-2_hours' });
      const planB = createTestPlan({ availableTime: '3-4_hours' });
      const planC = createTestPlan({ availableTime: 'half_day' });

      // Fire all three saves simultaneously without awaiting individually
      await Promise.all([
        savePlanToStorage(planA),
        savePlanToStorage(planB),
        savePlanToStorage(planC),
      ]);

      const loaded = await loadPlansFromStorage();
      expect(loaded).toHaveLength(3);

      const ids = loaded.map((p) => p.id);
      expect(ids).toContain(planA.id);
      expect(ids).toContain(planB.id);
      expect(ids).toContain(planC.id);
    });

    it('deletes a specific plan from storage', async () => {
      const plan1 = createTestPlan({ availableTime: '3-4_hours' });
      const plan2 = createTestPlan({ availableTime: '1-2_hours' });

      await savePlanToStorage(plan1);
      await savePlanToStorage(plan2);

      await deletePlanFromStorage(plan1.id);

      const loaded = await loadPlansFromStorage();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(plan2.id);
    });

    it('clears all plans from storage', async () => {
      const plan = createTestPlan();
      await savePlanToStorage(plan);

      await clearPlansFromStorage();
      const loaded = await loadPlansFromStorage();
      expect(loaded).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Defensive Validation & Corruption Handling
  // ---------------------------------------------------------------------------
  describe('Defensive Validation & Corruption Handling', () => {
    it('correctly identifies valid and invalid plan structures', () => {
      const validPlan = createTestPlan();
      expect(isValidPersonalizedPlan(validPlan)).toBe(true);

      expect(isValidPersonalizedPlan(null)).toBe(false);
      expect(isValidPersonalizedPlan(undefined)).toBe(false);
      expect(isValidPersonalizedPlan('invalid string')).toBe(false);
      expect(isValidPersonalizedPlan({})).toBe(false);

      // Missing destination
      expect(isValidPersonalizedPlan({ ...validPlan, destination: null as any })).toBe(false);

      // Malformed stops
      expect(isValidPersonalizedPlan({ ...validPlan, plannedStops: 'not-an-array' as any })).toBe(false);

      // Malformed plannedStop coordinates
      const corruptCoords = {
        ...validPlan,
        plannedStops: [
          {
            ...validPlan.plannedStops[0],
            attraction: {
              ...validPlan.plannedStops[0].attraction,
              coordinates: { latitude: NaN, longitude: 0 },
            },
          },
        ],
      };
      expect(isValidPersonalizedPlan(corruptCoords)).toBe(false);

      // Malformed generatedTour
      if (validPlan.generatedTour) {
        const corruptTour = {
          ...validPlan,
          generatedTour: {
            ...validPlan.generatedTour,
            stops: [{ attractionId: 123, triggerRadiusMeters: 'bad' }] as any,
          },
        };
        expect(isValidPersonalizedPlan(corruptTour)).toBe(false);
      }
    });

    it('handles non-JSON corrupted storage gracefully without crashing', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await AsyncStorage.setItem(
        STORAGE_KEY_PERSONALIZED_PLANS,
        '{ corrupted json string ::: invalid',
      );

      const plans = await loadPlansFromStorage();
      expect(plans).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PlanStorage] Corrupted JSON in AsyncStorage'),
        expect.any(Error),
      );

      warnSpy.mockRestore();
    });

    it('safely rejects unsupported schema versions', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await AsyncStorage.setItem(
        STORAGE_KEY_PERSONALIZED_PLANS,
        JSON.stringify({ version: 999, updatedAt: new Date().toISOString(), plans: {} }),
      );

      const plans = await loadPlansFromStorage();
      expect(plans).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PlanStorage] Unsupported schema version: 999'),
      );

      warnSpy.mockRestore();
    });

    it('discards individually malformed plan records while preserving valid ones', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const validPlan = createTestPlan();

      const payload = {
        version: STORAGE_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        plans: {
          [validPlan.id]: validPlan,
          'corrupted-plan-1': { id: 'corrupted-plan-1', badData: true },
        },
      };

      await AsyncStorage.setItem(
        STORAGE_KEY_PERSONALIZED_PLANS,
        JSON.stringify(payload),
      );

      const loaded = await loadPlansFromStorage();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(validPlan.id);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Discarding malformed plan record at key: corrupted-plan-1'),
      );

      warnSpy.mockRestore();
    });

    it('propagates storage write errors when saving', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage quota exceeded'),
      );

      const validPlan = createTestPlan();
      await expect(savePlanToStorage(validPlan)).rejects.toThrow('Storage quota exceeded');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save plan'),
        expect.any(Error),
      );

      warnSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Registry & Process Restart Simulation
  // ---------------------------------------------------------------------------
  describe('Registry Hydration & Process Restart Simulation', () => {
    it('restores generated tour after process restart (in-memory wipe)', async () => {
      // Step 1: Traveler generates a plan and saves it
      const plan = createTestPlan();
      expect(plan.success).toBe(true);
      const customTour = plan.generatedTour!;
      expect(customTour).toBeDefined();

      await savePersonalizedPlanAsync(plan);

      // Verify in-memory resolution works immediately
      expect(getPersonalizedPlan(plan.id)).not.toBeNull();
      expect(getTourById(customTour.id)).not.toBeNull();

      // Step 2: Simulate process termination (wipe in-memory registry without touching disk)
      await clearPlanRegistry({ includeStorage: false });

      // Before hydration, memory is clean
      expect(isPlanRegistryHydrated()).toBe(false);
      expect(getTourById(customTour.id)).toBeNull();
      expect(getPersonalizedPlan(plan.id)).toBeNull();

      // Step 3: App boots up and hydrates the registry
      await initializePlanRegistry();
      expect(isPlanRegistryHydrated()).toBe(true);

      // Step 4: Verify custom tour and plan are restored
      const restoredTour = getTourById(customTour.id);
      expect(restoredTour).not.toBeNull();
      expect(restoredTour?.id).toBe(customTour.id);
      expect(restoredTour?.name).toBe(customTour.name);
      expect(restoredTour?.cityId).toBe('mangalore');
      expect(restoredTour?.stops).toHaveLength(customTour.stops.length);

      const restoredPlan = getPersonalizedPlan(plan.id);
      expect(restoredPlan).not.toBeNull();
      expect(restoredPlan?.id).toBe(plan.id);
      expect(restoredPlan?.totalDurationMinutes).toBe(plan.totalDurationMinutes);
    });

    it('does not overwrite new in-memory plans when hydration completes concurrently', async () => {
      // Save an initial plan to disk
      const diskPlan = createTestPlan({ availableTime: '1-2_hours' });
      await savePlanToStorage(diskPlan);

      // Simulate a new session with clean memory
      await clearPlanRegistry({ includeStorage: false });

      // Create a brand-new in-memory plan before/during hydration
      const inMemoryPlan = createTestPlan({ availableTime: 'half_day' });
      savePersonalizedPlan(inMemoryPlan);

      // Now run hydration
      await initializePlanRegistry();

      // Verify BOTH the disk plan and the newly registered in-memory plan coexist
      expect(getPersonalizedPlan(diskPlan.id)).not.toBeNull();
      expect(getPersonalizedPlan(inMemoryPlan.id)).not.toBeNull();
      expect(getTourById(inMemoryPlan.generatedTour!.id)).not.toBeNull();
      expect(getTourById(diskPlan.generatedTour!.id)).not.toBeNull();
    });

    it('deduplicates concurrent initializePlanRegistry calls', async () => {
      const plan = createTestPlan();
      await savePlanToStorage(plan);

      // Call initialize concurrently
      const promise1 = initializePlanRegistry();
      const promise2 = initializePlanRegistry();
      const promise3 = waitForPlanRegistryHydration();

      await Promise.all([promise1, promise2, promise3]);
      expect(isPlanRegistryHydrated()).toBe(true);
      expect(getAllPersonalizedPlans()).toHaveLength(1);
    });

    it('repeated initialization does not duplicate entries or create unexpected state', async () => {
      const plan = createTestPlan();
      await savePlanToStorage(plan);

      await initializePlanRegistry();
      expect(getAllPersonalizedPlans()).toHaveLength(1);

      // Call again
      await initializePlanRegistry();
      expect(getAllPersonalizedPlans()).toHaveLength(1);
      expect(getTourById(plan.generatedTour!.id)).not.toBeNull();
    });

    it('handles storage read failure during hydration safely without crashing', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Hardware failure'));

      await expect(initializePlanRegistry()).resolves.not.toThrow();
      expect(isPlanRegistryHydrated()).toBe(true);
      expect(getAllPersonalizedPlans()).toEqual([]);

      warnSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Persistence Observability & Fault Recovery
  // ---------------------------------------------------------------------------
  describe('Persistence Observability & Fault Recovery', () => {
    it('notifies listeners and records error when background persistence fails', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Disk full'));

      const errorListener = jest.fn();
      const unsub = onPersistenceError(errorListener);

      const plan = createTestPlan();
      savePersonalizedPlan(plan);

      // Allow background microtasks to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: plan.id,
          error: expect.any(Error),
        }),
      );

      const lastError = getLastPersistenceError();
      expect(lastError).not.toBeNull();
      expect(lastError?.planId).toBe(plan.id);

      unsub();
      warnSpy.mockRestore();
    });

    it('recovers unpersisted plans via retryPendingPersistence', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      // First save fails
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Transient failure'));

      const plan = createTestPlan();
      savePersonalizedPlan(plan);

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(getLastPersistenceError()).not.toBeNull();

      // Retry succeeding
      const retryResult = await retryPendingPersistence();
      expect(retryResult.succeeded).toContain(plan.id);
      expect(retryResult.failed).toHaveLength(0);
      expect(getLastPersistenceError()).toBeNull();

      const loaded = await loadPlansFromStorage();
      expect(loaded.some((p) => p.id === plan.id)).toBe(true);

      warnSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Active Tour Engine Compatibility with Restored Tour
  // ---------------------------------------------------------------------------
  describe('Active Tour Engine Compatibility', () => {
    it('restored tour runs successfully in TourLocationController with GPS simulator', async () => {
      const plan = createTestPlan();
      const customTour = plan.generatedTour!;
      await savePersonalizedPlanAsync(plan);

      // Simulate process restart and reload
      await clearPlanRegistry({ includeStorage: false });
      await initializePlanRegistry();

      const restoredTour = getTourById(customTour.id);
      expect(restoredTour).not.toBeNull();

      // Resolve first stop's coordinates
      const firstStop = restoredTour!.stops[0];
      const firstAttraction = attractions.find((a) => a.id === firstStop.attractionId);
      expect(firstAttraction).toBeDefined();

      const startCoords = firstAttraction!.coordinates;
      const provider = new SimulatedLocationProvider(startCoords);
      const controller = TourLocationController.create(restoredTour!, provider, attractions, false);

      controller.start();
      const initialSession = controller.getSession();

      expect(initialSession.tour.id).toBe(restoredTour!.id);
      expect(initialSession.currentStopIndex).toBe(0);
      expect(initialSession.isComplete).toBe(false);

      // Simulate arriving at stop 1
      provider.arriveAt(startCoords, firstStop.triggerRadiusMeters);
      controller.checkLocation();
      expect(controller.getSession().isCurrentStopReached).toBe(true);
      expect(controller.getProximityState()).toBe('arrived');

      // Now advance stop
      const advancedSession = controller.moveToNextStop();
      if (restoredTour!.stops.length > 1) {
        expect(advancedSession.currentStopIndex).toBe(1);
      } else {
        expect(advancedSession.isComplete).toBe(true);
      }

      controller.stop();
      controller.destroy();
    });

    it('preserves stop trigger radiuses and story IDs accurately across persistence', async () => {
      const plan = createTestPlan();
      const customTour = plan.generatedTour!;
      await savePersonalizedPlanAsync(plan);

      await clearPlanRegistry({ includeStorage: false });
      await initializePlanRegistry();

      const restoredTour = getTourById(customTour.id)!;
      expect(restoredTour.stops.length).toBe(customTour.stops.length);

      for (let i = 0; i < customTour.stops.length; i++) {
        expect(restoredTour.stops[i].attractionId).toBe(customTour.stops[i].attractionId);
        expect(restoredTour.stops[i].triggerRadiusMeters).toBe(customTour.stops[i].triggerRadiusMeters);
        expect(restoredTour.stops[i].storyId).toBe(customTour.stops[i].storyId);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Curated Tours Unaffected
  // ---------------------------------------------------------------------------
  describe('Curated Tours Unaffected', () => {
    it('always resolves static curated tours regardless of hydration or custom storage state', async () => {
      const curatedTourId = 'mangalore-heritage-walk';

      // 1. Before hydration / clean memory
      const tourBefore = getTourById(curatedTourId);
      expect(tourBefore).not.toBeNull();
      expect(tourBefore?.id).toBe(curatedTourId);

      // 2. After hydration with no custom plans
      await initializePlanRegistry();
      const tourAfterEmptyHydration = getTourById(curatedTourId);
      expect(tourAfterEmptyHydration).not.toBeNull();
      expect(tourAfterEmptyHydration?.id).toBe(curatedTourId);

      // 3. With custom tours loaded
      const plan = createTestPlan();
      await savePersonalizedPlanAsync(plan);
      const tourWithCustoms = getTourById(curatedTourId);
      expect(tourWithCustoms).not.toBeNull();
      expect(tourWithCustoms?.id).toBe(curatedTourId);

      // 4. After wiping custom storage
      await clearPlanRegistry({ includeStorage: true });
      const tourAfterWipe = getTourById(curatedTourId);
      expect(tourAfterWipe).not.toBeNull();
      expect(tourAfterWipe?.id).toBe(curatedTourId);
    });

    it('returns null for truly nonexistent tour IDs', () => {
      expect(getTourById('nonexistent-ghost-tour-xyz')).toBeNull();
    });
  });
});
