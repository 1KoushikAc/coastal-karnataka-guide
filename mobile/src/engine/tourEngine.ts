// src/engine/tourEngine.ts
// =============================================================================
// Tour Engine — Pure State Functions
// =============================================================================
// All functions are pure: they accept a TourSession and return a new one.
// No mutations, no side effects, no React, no UI, no GPS, no audio.
//
// These functions are the single source of truth for tour progression.
// The UI hook (useTourSession) wraps these with React state management.
// =============================================================================

import type { Tour, TourStop } from '@shared-types/index';
import type { TourSession } from './types';

// ---------------------------------------------------------------------------
// startTour
// ---------------------------------------------------------------------------

/**
 * Creates a new TourSession for the given tour.
 *
 * - If the tour has no stops, the session is immediately marked complete.
 * - The traveler begins at the first stop (index 0).
 */
export function startTour(tour: Tour): TourSession {
  const hasStops = tour.stops.length > 0;
  return {
    tour,
    hasStarted: true,
    currentStopIndex: 0,
    completedStopIndices: [],
    isCurrentStopReached: false,
    isComplete: !hasStops, // empty tour → nothing to do
  };
}

// ---------------------------------------------------------------------------
// getCurrentStop
// ---------------------------------------------------------------------------

/**
 * Returns the TourStop the traveler is currently heading toward (or has reached).
 * Returns null when:
 *   - The tour has not started.
 *   - The tour is complete.
 *   - currentStopIndex is out of bounds (safety guard).
 */
export function getCurrentStop(session: TourSession): TourStop | null {
  if (!session.hasStarted || session.isComplete) return null;
  return session.tour.stops[session.currentStopIndex] ?? null;
}

// ---------------------------------------------------------------------------
// markCurrentStopReached
// ---------------------------------------------------------------------------

/**
 * Records that the traveler has arrived at the current stop.
 *
 * - Idempotent: calling when already reached returns the session unchanged.
 * - No-op when the tour is not started or is already complete.
 * - Does NOT advance to the next stop — call moveToNextStop() for that.
 */
export function markCurrentStopReached(session: TourSession): TourSession {
  if (!session.hasStarted) return session;
  if (session.isComplete) return session;
  if (session.isCurrentStopReached) return session; // idempotent

  return { ...session, isCurrentStopReached: true };
}

// ---------------------------------------------------------------------------
// moveToNextStop
// ---------------------------------------------------------------------------

/**
 * Marks the current stop as completed and advances to the next one.
 *
 * Requirements:
 *   - The tour must have started.
 *   - The current stop must have been reached (markCurrentStopReached called).
 *   - Returns the session unchanged if those conditions are not met.
 *
 * Behavior on the final stop:
 *   - Adds the stop to completedStopIndices.
 *   - Sets isComplete = true.
 *   - Does NOT increment currentStopIndex beyond bounds.
 *
 * Calling after completion:
 *   - Returns the session unchanged (cannot advance past end).
 */
export function moveToNextStop(session: TourSession): TourSession {
  if (!session.hasStarted) return session;
  if (session.isComplete) return session;           // already done — no-op
  if (!session.isCurrentStopReached) return session; // must arrive first

  const newCompleted = [...session.completedStopIndices, session.currentStopIndex];
  const isLastStop = session.currentStopIndex >= session.tour.stops.length - 1;

  if (isLastStop) {
    return {
      ...session,
      completedStopIndices: newCompleted,
      isCurrentStopReached: false,
      isComplete: true,
      // currentStopIndex stays at the last stop — do not go out of bounds
    };
  }

  return {
    ...session,
    currentStopIndex: session.currentStopIndex + 1,
    completedStopIndices: newCompleted,
    isCurrentStopReached: false,
    isComplete: false,
  };
}

// ---------------------------------------------------------------------------
// getProgress
// ---------------------------------------------------------------------------

/**
 * Returns tour progress as a fraction in [0.0, 1.0].
 *
 * - 0.0 → no stops completed.
 * - 1.0 → all stops completed (or empty tour).
 *
 * Progress is based on completed stops, not the current stop index.
 */
export function getProgress(session: TourSession): number {
  const total = session.tour.stops.length;
  if (total === 0) return 1.0;
  return session.completedStopIndices.length / total;
}

// ---------------------------------------------------------------------------
// isComplete (convenience wrapper)
// ---------------------------------------------------------------------------

/**
 * Returns whether the tour has been fully completed.
 * Equivalent to reading session.isComplete directly.
 */
export function isComplete(session: TourSession): boolean {
  return session.isComplete;
}

// ---------------------------------------------------------------------------
// resetTour
// ---------------------------------------------------------------------------

/**
 * Resets the session back to its initial state for the same tour.
 * Equivalent to calling startTour(session.tour) from scratch.
 */
export function resetTour(session: TourSession): TourSession {
  return startTour(session.tour);
}
