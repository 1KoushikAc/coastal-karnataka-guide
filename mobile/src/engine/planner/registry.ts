// mobile/src/engine/planner/registry.ts
// =============================================================================
// M8: Trip Plan & Custom Tour Registry with Local Persistence
// =============================================================================
// Central in-memory registry for personalized trip plans and custom tours,
// backed by reliable local persistence via AsyncStorage.
//
// Key Features:
//   - Synchronous lookups: getTourById and getPersonalizedPlan remain instant
//     and synchronous for seamless navigation and GPS engine handoff.
//   - Hydration on boot: initializePlanRegistry() restores previously generated
//     itineraries when the app or Expo Go process restarts.
//   - Race-condition guard: Newly registered in-memory tours are never
//     overwritten by older asynchronous disk hydration reads.
//   - Curated tours preserved: Curated static tours (e.g. mangalore-heritage-walk)
//     always resolve reliably, regardless of persistence state.
//   - Observable persistence errors: Listeners and last-error accessors allow
//     inspecting background persistence status.
//   - Fault recovery: retryPendingPersistence() attempts re-saving unpersisted plans.
// =============================================================================

import type { Tour } from '@shared-types/index';
import { tours as staticTours } from '@data/index';
import type { PersonalizedPlanResult } from './types';
import {
  savePlanToStorage,
  loadPlansFromStorage,
  clearPlansFromStorage,
} from './storage';

const planStore = new Map<string, PersonalizedPlanResult>();
const customTourStore = new Map<string, Tour>();

let isHydrated = false;
let hydrationPromise: Promise<void> | null = null;

export interface PersistenceErrorInfo {
  error: Error;
  planId: string;
  timestamp: number;
}

export type PersistenceErrorListener = (info: PersistenceErrorInfo) => void;

let lastPersistenceError: PersistenceErrorInfo | null = null;
const persistenceErrorListeners = new Set<PersistenceErrorListener>();

function notifyPersistenceError(error: Error, planId: string): void {
  lastPersistenceError = {
    error,
    planId,
    timestamp: Date.now(),
  };

  for (const listener of persistenceErrorListeners) {
    try {
      listener(lastPersistenceError);
    } catch (listenerErr) {
      console.warn('[PlanRegistry] Persistence error listener threw:', listenerErr);
    }
  }
}

/**
 * Subscribes to background persistence errors.
 * Returns an unsubscribe callback.
 */
export function onPersistenceError(listener: PersistenceErrorListener): () => void {
  persistenceErrorListeners.add(listener);
  return () => {
    persistenceErrorListeners.delete(listener);
  };
}

/**
 * Returns the most recent background persistence error, or null if healthy.
 */
export function getLastPersistenceError(): PersistenceErrorInfo | null {
  return lastPersistenceError;
}

/**
 * Clears the recorded last persistence error.
 */
export function clearLastPersistenceError(): void {
  lastPersistenceError = null;
}

/**
 * Hydrates the in-memory registry from local storage.
 * Safe to call multiple times concurrently; will reuse the same in-flight promise.
 *
 * Race-condition guard:
 *   If any plan was already created in memory while hydration was in-flight,
 *   the newer in-memory plan is NOT overwritten by the older disk record.
 */
export async function initializePlanRegistry(): Promise<void> {
  if (isHydrated) {
    return;
  }

  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = (async () => {
    try {
      const persistedPlans = await loadPlansFromStorage();
      for (const plan of persistedPlans) {
        // Only insert if not already present in memory (prevents hydration from
        // clobbering plans created while hydration was in-flight).
        if (!planStore.has(plan.id)) {
          planStore.set(plan.id, plan);
          if (plan.generatedTour && !customTourStore.has(plan.generatedTour.id)) {
            customTourStore.set(plan.generatedTour.id, plan.generatedTour);
          }
        }
      }
    } catch (err) {
      console.warn('[PlanRegistry] Failed to load persisted plans into registry:', err);
    } finally {
      isHydrated = true;
      hydrationPromise = null;
    }
  })();

  return hydrationPromise;
}

/**
 * Checks whether the plan registry has completed initial storage hydration.
 */
export function isPlanRegistryHydrated(): boolean {
  return isHydrated;
}

/**
 * Awaits registry hydration if currently in progress or not yet started.
 */
export async function waitForPlanRegistryHydration(): Promise<void> {
  if (isHydrated) {
    return;
  }
  return initializePlanRegistry();
}

/**
 * Saves a generated personalized plan and registers its Tour in memory,
 * simultaneously triggering asynchronous local storage persistence.
 *
 * If background persistence fails, it records the error and notifies listeners
 * without crashing caller UI flows.
 */
export function savePersonalizedPlan(plan: PersonalizedPlanResult): string {
  planStore.set(plan.id, plan);
  if (plan.generatedTour) {
    customTourStore.set(plan.generatedTour.id, plan.generatedTour);
  }

  // Trigger non-blocking persistence
  savePlanToStorage(plan).catch((err: unknown) => {
    const error = err instanceof Error ? err : new Error(String(err));
    console.warn(`[PlanRegistry] Background persistence failed for plan ${plan.id}:`, error);
    notifyPersistenceError(error, plan.id);
  });

  return plan.id;
}

/**
 * Asynchronous variant of savePersonalizedPlan that guarantees local storage
 * has been written before resolving. Throws on storage failure.
 */
export async function savePersonalizedPlanAsync(plan: PersonalizedPlanResult): Promise<string> {
  planStore.set(plan.id, plan);
  if (plan.generatedTour) {
    customTourStore.set(plan.generatedTour.id, plan.generatedTour);
  }

  try {
    await savePlanToStorage(plan);
    return plan.id;
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    notifyPersistenceError(error, plan.id);
    throw error;
  }
}

/**
 * Attempts to re-persist all currently registered in-memory plans to local storage.
 * Useful for recovering after temporary storage errors.
 */
export async function retryPendingPersistence(): Promise<{ succeeded: string[]; failed: string[] }> {
  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const plan of planStore.values()) {
    try {
      await savePlanToStorage(plan);
      succeeded.push(plan.id);
    } catch {
      failed.push(plan.id);
    }
  }

  if (failed.length === 0) {
    clearLastPersistenceError();
  }

  return { succeeded, failed };
}

/**
 * Explicitly registers a custom tour in memory.
 */
export function registerCustomTour(tour: Tour): void {
  customTourStore.set(tour.id, tour);
}

/**
 * Retrieves a plan by ID from in-memory cache.
 */
export function getPersonalizedPlan(planId: string): PersonalizedPlanResult | null {
  return planStore.get(planId) ?? null;
}

/**
 * Returns all currently loaded personalized plans.
 */
export function getAllPersonalizedPlans(): PersonalizedPlanResult[] {
  return Array.from(planStore.values());
}

/**
 * Resolves a tour by ID across both custom generated tours and static M1 tours.
 * This guarantees custom tours never trigger "Tour Not Found", even across restarts.
 */
export function getTourById(tourId: string): Tour | null {
  return customTourStore.get(tourId) ?? staticTours.find((t) => t.id === tourId) ?? null;
}

/**
 * Clears the registry.
 * By default clears only in-memory stores. If includeStorage is true,
 * also wipes the underlying local storage.
 */
export async function clearPlanRegistry(
  options: { includeStorage?: boolean } = {},
): Promise<void> {
  planStore.clear();
  customTourStore.clear();
  isHydrated = false;
  hydrationPromise = null;
  lastPersistenceError = null;
  persistenceErrorListeners.clear();

  if (options.includeStorage) {
    await clearPlansFromStorage();
  }
}
