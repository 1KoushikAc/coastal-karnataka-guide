// src/__tests__/tourEngine.test.ts
// =============================================================================
// Tour Engine — Unit Tests
// =============================================================================
// Tests pure functions in engine/tourEngine.ts.
// No React, no React Native, no GPS, no UI dependencies.
// =============================================================================

import type { Tour } from '@shared-types/index';
import {
  startTour,
  getCurrentStop,
  markCurrentStopReached,
  moveToNextStop,
  getProgress,
  isComplete,
  resetTour,
} from '../engine/tourEngine';
import type { TourSession } from '../engine/types';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** A standard three-stop tour used in most tests. */
const THREE_STOP_TOUR: Tour = {
  id: 'test-tour',
  cityId: 'test-city',
  name: 'Test Heritage Walk',
  description: 'A three-stop test tour.',
  category: 'history',
  estimatedDurationMinutes: 90,
  stops: [
    {
      id: 'stop-1',
      attractionId: 'attraction-1',
      order: 1,
      triggerRadiusMeters: 50,
      storyId: 'story-1',
    },
    {
      id: 'stop-2',
      attractionId: 'attraction-2',
      order: 2,
      triggerRadiusMeters: 50,
      storyId: 'story-2',
    },
    {
      id: 'stop-3',
      attractionId: 'attraction-3',
      order: 3,
      triggerRadiusMeters: 50,
      storyId: 'story-3',
    },
  ],
};

/** A tour with exactly one stop (edge case). */
const ONE_STOP_TOUR: Tour = {
  id: 'one-stop-tour',
  cityId: 'test-city',
  name: 'Single Stop Tour',
  description: 'A tour with one stop.',
  category: 'coastal',
  estimatedDurationMinutes: 30,
  stops: [
    {
      id: 'only-stop',
      attractionId: 'attraction-only',
      order: 1,
      triggerRadiusMeters: 60,
      storyId: 'story-only',
    },
  ],
};

/** A tour with no stops (edge case). */
const EMPTY_TOUR: Tour = {
  id: 'empty-tour',
  cityId: 'test-city',
  name: 'Empty Tour',
  description: 'A tour with no stops.',
  category: 'nature',
  estimatedDurationMinutes: 0,
  stops: [],
};

// ---------------------------------------------------------------------------
// Helper: advance session through all stops to completion
// ---------------------------------------------------------------------------

function completeAllStops(session: TourSession): TourSession {
  let s = session;
  while (!s.isComplete) {
    s = markCurrentStopReached(s);
    s = moveToNextStop(s);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Test 1: Starting a tour selects the first stop
// ---------------------------------------------------------------------------

describe('startTour', () => {
  test('1. Starting a tour selects the first stop (index 0)', () => {
    const session = startTour(THREE_STOP_TOUR);
    expect(session.currentStopIndex).toBe(0);
    expect(session.hasStarted).toBe(true);
  });

  test('2. Initial completed-stop count is zero', () => {
    const session = startTour(THREE_STOP_TOUR);
    expect(session.completedStopIndices.length).toBe(0);
  });

  test('Initial isCurrentStopReached is false', () => {
    const session = startTour(THREE_STOP_TOUR);
    expect(session.isCurrentStopReached).toBe(false);
  });

  test('Initial isComplete is false for a non-empty tour', () => {
    const session = startTour(THREE_STOP_TOUR);
    expect(session.isComplete).toBe(false);
  });

  test('Empty tour is immediately complete', () => {
    const session = startTour(EMPTY_TOUR);
    expect(session.isComplete).toBe(true);
    expect(session.hasStarted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 3: getCurrentStop returns the correct stop
// ---------------------------------------------------------------------------

describe('getCurrentStop', () => {
  test('3. Current stop is correct at the start', () => {
    const session = startTour(THREE_STOP_TOUR);
    const stop = getCurrentStop(session);
    expect(stop).not.toBeNull();
    expect(stop?.id).toBe('stop-1');
  });

  test('Current stop changes after advancing', () => {
    let session = startTour(THREE_STOP_TOUR);
    session = markCurrentStopReached(session);
    session = moveToNextStop(session);
    expect(getCurrentStop(session)?.id).toBe('stop-2');
  });

  test('Returns null when the tour is complete', () => {
    const session = completeAllStops(startTour(THREE_STOP_TOUR));
    expect(getCurrentStop(session)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test 4: Marking a stop as reached updates state
// ---------------------------------------------------------------------------

describe('markCurrentStopReached', () => {
  test('4. Marking a stop as reached sets isCurrentStopReached to true', () => {
    const session = startTour(THREE_STOP_TOUR);
    const reached = markCurrentStopReached(session);
    expect(reached.isCurrentStopReached).toBe(true);
  });

  test('10. A stop cannot be completed twice (idempotent)', () => {
    const session = startTour(THREE_STOP_TOUR);
    const reached1 = markCurrentStopReached(session);
    const reached2 = markCurrentStopReached(reached1);
    // State must be identical — calling twice is a no-op
    expect(reached2.isCurrentStopReached).toBe(true);
    expect(reached2.completedStopIndices.length).toBe(0); // not yet moved
    // The returned session reference should be the same object (idempotent shortcut)
    expect(reached2).toBe(reached1);
  });

  test('No-op when the tour is complete', () => {
    const completed = completeAllStops(startTour(THREE_STOP_TOUR));
    const after = markCurrentStopReached(completed);
    expect(after).toBe(completed); // same reference
  });
});

// ---------------------------------------------------------------------------
// Test 5: Moving to the next stop works
// ---------------------------------------------------------------------------

describe('moveToNextStop', () => {
  test('5. Moving to the next stop increments currentStopIndex', () => {
    let session = startTour(THREE_STOP_TOUR);
    session = markCurrentStopReached(session);
    session = moveToNextStop(session);
    expect(session.currentStopIndex).toBe(1);
    expect(session.isCurrentStopReached).toBe(false);
  });

  test('Completed stop is added to completedStopIndices', () => {
    let session = startTour(THREE_STOP_TOUR);
    session = markCurrentStopReached(session);
    session = moveToNextStop(session);
    expect(session.completedStopIndices).toContain(0);
    expect(session.completedStopIndices.length).toBe(1);
  });

  test('Cannot move without reaching the stop first', () => {
    const session = startTour(THREE_STOP_TOUR);
    const after = moveToNextStop(session); // reached not set
    expect(after.currentStopIndex).toBe(0); // unchanged
    expect(after).toBe(session); // same reference (no-op)
  });

  test('8. The session cannot move beyond the final stop', () => {
    const completed = completeAllStops(startTour(THREE_STOP_TOUR));
    const after = moveToNextStop(completed);
    expect(after).toBe(completed); // same reference — no mutation
    expect(after.isComplete).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 6: Progress is calculated correctly
// ---------------------------------------------------------------------------

describe('getProgress', () => {
  test('6. Progress is 0.0 at the start', () => {
    const session = startTour(THREE_STOP_TOUR);
    expect(getProgress(session)).toBeCloseTo(0.0);
  });

  test('Progress is 1/3 after completing the first stop', () => {
    let session = startTour(THREE_STOP_TOUR);
    session = markCurrentStopReached(session);
    session = moveToNextStop(session);
    expect(getProgress(session)).toBeCloseTo(1 / 3);
  });

  test('Progress is 2/3 after completing the second stop', () => {
    let session = startTour(THREE_STOP_TOUR);
    session = markCurrentStopReached(session);
    session = moveToNextStop(session);
    session = markCurrentStopReached(session);
    session = moveToNextStop(session);
    expect(getProgress(session)).toBeCloseTo(2 / 3);
  });

  test('Progress is 1.0 after completing all stops', () => {
    const session = completeAllStops(startTour(THREE_STOP_TOUR));
    expect(getProgress(session)).toBeCloseTo(1.0);
  });

  test('Empty tour progress is 1.0', () => {
    const session = startTour(EMPTY_TOUR);
    expect(getProgress(session)).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Test 7: The final stop completes the tour
// ---------------------------------------------------------------------------

describe('Tour completion', () => {
  test('7. The final stop completes the tour', () => {
    let session = startTour(ONE_STOP_TOUR);
    expect(session.isComplete).toBe(false);
    session = markCurrentStopReached(session);
    session = moveToNextStop(session);
    expect(session.isComplete).toBe(true);
    expect(isComplete(session)).toBe(true);
  });

  test('All stops appear in completedStopIndices after completion', () => {
    const session = completeAllStops(startTour(THREE_STOP_TOUR));
    expect(session.completedStopIndices.length).toBe(THREE_STOP_TOUR.stops.length);
    expect(session.completedStopIndices).toContain(0);
    expect(session.completedStopIndices).toContain(1);
    expect(session.completedStopIndices).toContain(2);
  });

  test('currentStopIndex does not go out of bounds on completion', () => {
    const session = completeAllStops(startTour(THREE_STOP_TOUR));
    expect(session.currentStopIndex).toBeLessThan(THREE_STOP_TOUR.stops.length);
  });
});

// ---------------------------------------------------------------------------
// Test 9: Reset returns the session to its initial state
// ---------------------------------------------------------------------------

describe('resetTour', () => {
  test('9. Reset returns currentStopIndex to 0', () => {
    let session = startTour(THREE_STOP_TOUR);
    session = markCurrentStopReached(session);
    session = moveToNextStop(session);
    // Now at stop 1
    const reset = resetTour(session);
    expect(reset.currentStopIndex).toBe(0);
  });

  test('Reset clears all completedStopIndices', () => {
    const session = completeAllStops(startTour(THREE_STOP_TOUR));
    const reset = resetTour(session);
    expect(reset.completedStopIndices.length).toBe(0);
  });

  test('Reset clears isCurrentStopReached', () => {
    let session = startTour(THREE_STOP_TOUR);
    session = markCurrentStopReached(session);
    const reset = resetTour(session);
    expect(reset.isCurrentStopReached).toBe(false);
  });

  test('Reset clears isComplete', () => {
    const session = completeAllStops(startTour(THREE_STOP_TOUR));
    const reset = resetTour(session);
    expect(reset.isComplete).toBe(false);
  });

  test('Reset preserves the same tour object', () => {
    const session = startTour(THREE_STOP_TOUR);
    const reset = resetTour(session);
    expect(reset.tour).toBe(THREE_STOP_TOUR);
  });

  test('Reset sets hasStarted to true (not unstarted)', () => {
    const session = completeAllStops(startTour(THREE_STOP_TOUR));
    const reset = resetTour(session);
    expect(reset.hasStarted).toBe(true);
  });
});
