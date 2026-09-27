// src/engine/types.ts
// =============================================================================
// Tour Engine — Core Types
// =============================================================================
// These types define the runtime state of an active tour session.
// They are intentionally separate from the M1 data model (Tour, Attraction …)
// to keep the engine portable and independently testable.
// =============================================================================

import type { Tour, TourStop } from '@shared-types/index';

// ---------------------------------------------------------------------------
// TourSession
// Pure, serialisable state for one active tour session.
// The LocationProvider is NOT part of this state — it lives in the hook.
// ---------------------------------------------------------------------------

export interface TourSession {
  /** The tour being walked. */
  readonly tour: Tour;

  /** True once startTour() has been called. */
  readonly hasStarted: boolean;

  /** 0-based index of the stop the traveler is currently heading toward (or at). */
  readonly currentStopIndex: number;

  /** 0-based indices of stops that have been fully completed (story read, Continue pressed). */
  readonly completedStopIndices: readonly number[];

  /**
   * True once the traveler's position is within the stop's triggerRadiusMeters.
   * Resets to false when moving to the next stop.
   */
  readonly isCurrentStopReached: boolean;

  /** True after the traveler has completed the final stop. */
  readonly isComplete: boolean;
}

// ---------------------------------------------------------------------------
// Convenience read-helpers (derived values — do not store in state)
// ---------------------------------------------------------------------------

/** Returns the current TourStop, or null if the tour is complete or unstarted. */
export function currentStop(session: TourSession): TourStop | null {
  if (!session.hasStarted || session.isComplete) return null;
  return session.tour.stops[session.currentStopIndex] ?? null;
}

/** Returns progress as a fraction 0.0–1.0 (completed stops / total stops). */
export function progressFraction(session: TourSession): number {
  const total = session.tour.stops.length;
  if (total === 0) return 1;
  return session.completedStopIndices.length / total;
}
