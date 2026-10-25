// mobile/src/engine/planner/storage.ts
// =============================================================================
// M8: Personalized Plan Local Persistence Storage Module
// =============================================================================
// Provides robust, fault-tolerant local storage for generated itineraries
// using AsyncStorage. Features:
//   - Schema versioning and strict version checking
//   - Sequential write queue preventing concurrent write clobbering
//   - Defensive validation: validates structural integrity and coordinates
//   - Non-blocking corruption handling: damaged records are safely discarded
//   - Observable write failures: propagates errors through promise chains
//   - Full isolation: UI components never interact with AsyncStorage directly
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersonalizedPlanResult } from './types';
import type { Tour } from '@shared-types/index';

export const STORAGE_KEY_PERSONALIZED_PLANS = '@coastal_karnataka/personalized_plans_v1';
export const STORAGE_SCHEMA_VERSION = 1;

export interface PersistedPlansPayload {
  version: number;
  updatedAt: string;
  plans: Record<string, PersonalizedPlanResult>;
}

/**
 * Sequential write queue to serialize all storage modifications.
 * Guarantees that concurrent saves/deletes never overwrite each other with stale reads.
 */
let storageOperationQueue: Promise<void> = Promise.resolve();

export function enqueueStorageOperation<T>(operation: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    storageOperationQueue = storageOperationQueue.then(
      async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      },
      async () => {
        // Even if the previous operation failed, run this one
        try {
          const result = await operation();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      },
    );
  });
}

/**
 * Validates whether a candidate object meets the structural requirements
 * of a PersonalizedPlanResult, its planned stops, and its generated Tour.
 */
export function isValidPersonalizedPlan(data: unknown): data is PersonalizedPlanResult {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const candidate = data as Partial<PersonalizedPlanResult>;

  // Basic required fields
  if (
    typeof candidate.id !== 'string' ||
    candidate.id.trim().length === 0 ||
    typeof candidate.success !== 'boolean' ||
    !candidate.destination ||
    typeof candidate.destination.id !== 'string' ||
    typeof candidate.destination.name !== 'string' ||
    !candidate.preferences ||
    typeof candidate.preferences.destinationId !== 'string' ||
    !Array.isArray(candidate.plannedStops)
  ) {
    return false;
  }

  // Validate plannedStops structure and coordinates
  for (const ps of candidate.plannedStops) {
    if (
      !ps ||
      typeof ps !== 'object' ||
      typeof ps.order !== 'number' ||
      !ps.attraction ||
      typeof ps.attraction.id !== 'string' ||
      !ps.attraction.coordinates ||
      typeof ps.attraction.coordinates.latitude !== 'number' ||
      typeof ps.attraction.coordinates.longitude !== 'number' ||
      isNaN(ps.attraction.coordinates.latitude) ||
      isNaN(ps.attraction.coordinates.longitude)
    ) {
      return false;
    }
  }

  // If a tour was generated, validate its stops
  if (candidate.generatedTour) {
    const tour = candidate.generatedTour as Partial<Tour>;
    if (
      typeof tour.id !== 'string' ||
      tour.id.trim().length === 0 ||
      typeof tour.cityId !== 'string' ||
      typeof tour.name !== 'string' ||
      !Array.isArray(tour.stops)
    ) {
      return false;
    }

    for (const stop of tour.stops) {
      if (
        !stop ||
        typeof stop.attractionId !== 'string' ||
        typeof stop.triggerRadiusMeters !== 'number' ||
        typeof stop.storyId !== 'string'
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Reads and parses the stored plans payload from AsyncStorage.
 * Discards corrupted or structurally incompatible data without throwing.
 */
export async function loadPlansFromStorage(): Promise<PersonalizedPlanResult[]> {
  try {
    const rawData = await AsyncStorage.getItem(STORAGE_KEY_PERSONALIZED_PLANS);
    if (!rawData) {
      return [];
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawData);
    } catch (parseErr) {
      console.warn(
        '[PlanStorage] Corrupted JSON in AsyncStorage. Discarding invalid payload:',
        parseErr,
      );
      return [];
    }

    if (!parsed || typeof parsed !== 'object' || !('plans' in parsed)) {
      console.warn(
        '[PlanStorage] Incompatible storage format encountered. Skipping restoration.',
      );
      return [];
    }

    const payload = parsed as Partial<PersistedPlansPayload>;

    // Strict schema version check
    if (
      typeof payload.version !== 'number' ||
      payload.version !== STORAGE_SCHEMA_VERSION
    ) {
      console.warn(
        `[PlanStorage] Unsupported schema version: ${payload.version} (expected: ${STORAGE_SCHEMA_VERSION}). Skipping restoration.`,
      );
      return [];
    }

    const rawPlans = payload.plans;
    if (!rawPlans || typeof rawPlans !== 'object') {
      return [];
    }

    const validPlans: PersonalizedPlanResult[] = [];
    for (const [key, plan] of Object.entries(rawPlans)) {
      if (isValidPersonalizedPlan(plan)) {
        validPlans.push(plan);
      } else {
        console.warn(`[PlanStorage] Discarding malformed plan record at key: ${key}`);
      }
    }

    return validPlans;
  } catch (storageErr) {
    console.warn('[PlanStorage] Failed to read from AsyncStorage:', storageErr);
    return [];
  }
}

/**
 * Persists a personalized plan result into AsyncStorage.
 * Serialized through the internal queue to prevent concurrent write clobbering.
 */
export function savePlanToStorage(plan: PersonalizedPlanResult): Promise<void> {
  if (!isValidPersonalizedPlan(plan)) {
    console.warn('[PlanStorage] Refusing to persist invalid plan:', plan);
    return Promise.resolve();
  }

  return enqueueStorageOperation(async () => {
    try {
      const existingPlans = await loadPlansFromStorage();
      const plansMap: Record<string, PersonalizedPlanResult> = {};

      for (const p of existingPlans) {
        plansMap[p.id] = p;
      }
      // Set or overwrite with updated plan
      plansMap[plan.id] = plan;

      const payload: PersistedPlansPayload = {
        version: STORAGE_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        plans: plansMap,
      };

      await AsyncStorage.setItem(
        STORAGE_KEY_PERSONALIZED_PLANS,
        JSON.stringify(payload),
      );
    } catch (err) {
      console.warn(`[PlanStorage] Failed to save plan "${plan.id}" to AsyncStorage:`, err);
      throw err;
    }
  });
}

/**
 * Deletes a specific personalized plan from storage.
 * Serialized through the internal queue.
 */
export function deletePlanFromStorage(planId: string): Promise<void> {
  return enqueueStorageOperation(async () => {
    try {
      const existingPlans = await loadPlansFromStorage();
      const plansMap: Record<string, PersonalizedPlanResult> = {};

      for (const p of existingPlans) {
        if (p.id !== planId) {
          plansMap[p.id] = p;
        }
      }

      const payload: PersistedPlansPayload = {
        version: STORAGE_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        plans: plansMap,
      };

      await AsyncStorage.setItem(
        STORAGE_KEY_PERSONALIZED_PLANS,
        JSON.stringify(payload),
      );
    } catch (err) {
      console.warn(`[PlanStorage] Failed to delete plan "${planId}" from AsyncStorage:`, err);
      throw err;
    }
  });
}

/**
 * Completely clears all personalized plans from AsyncStorage.
 * Serialized through the internal queue.
 */
export function clearPlansFromStorage(): Promise<void> {
  return enqueueStorageOperation(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_PERSONALIZED_PLANS);
    } catch (err) {
      console.warn('[PlanStorage] Failed to clear AsyncStorage:', err);
      throw err;
    }
  });
}
