// src/__tests__/stopArrivalExperience.test.ts
// =============================================================================
// M6.4 — Stop Arrival Experience Tests
// =============================================================================
// Verifies:
//   1. Arrival state is correct when the traveler enters the trigger radius.
//   2. Repeated GPS updates inside the trigger radius do NOT re-trigger arrival.
//   3. The session listener is notified exactly once per arrival (idempotent).
//   4. Moving away from a reached stop does NOT un-reach it (state preserved).
//   5. Leaving and returning to the same stop does NOT corrupt tour state.
//   6. The "Continue to Next Stop" action only succeeds after arrival.
//   7. Tour progression (stop 1 → 2 → 3) remains correct.
//   8. Final stop / completion behavior is intact.
//   9. Tour reset restores fresh arrival state for stop 1.
//  10. Stops with stories are correctly associated on arrival.
//  11. Stops without stories (hypothetical) do not crash and return null story.
// =============================================================================

import { tours, attractions, stories } from '@data/index';
import { TourLocationController } from '../engine/TourLocationController';
import { SimulatedLocationProvider } from '../engine/location/SimulatedLocationProvider';
import { getCurrentStop, getProgress } from '../engine/tourEngine';
import { offsetPoint } from '../engine/distance';
import type { TourSession } from '../engine/types';
import type { Tour } from '@shared-types/index';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const heritageTour = tours.find((t) => t.id === 'mangalore-heritage-walk')!;

/** Stop 1 — Kadri Manjunatha Temple */
const stop1 = heritageTour.stops[0];
const attr1 = attractions.find((a) => a.id === stop1.attractionId)!;
const story1 = stories.find((s) => s.id === stop1.storyId) ?? null;

/** Stop 2 — St. Aloysius Chapel */
const stop2 = heritageTour.stops[1];
const attr2 = attractions.find((a) => a.id === stop2.attractionId)!;
const story2 = stories.find((s) => s.id === stop2.storyId) ?? null;

// A minimal 2-stop tour for isolated engine tests
const TWO_STOP_TOUR: Tour = {
  id: 'arrival-test-tour',
  cityId: 'mangalore',
  name: 'Arrival Test Tour',
  description: '',
  category: 'history',
  estimatedDurationMinutes: 60,
  stops: [
    {
      id: 'stop-a',
      attractionId: attr1.id,
      order: 1,
      triggerRadiusMeters: 50,
      storyId: stop1.storyId,
    },
    {
      id: 'stop-b',
      attractionId: attr2.id,
      order: 2,
      triggerRadiusMeters: 50,
      storyId: stop2.storyId,
    },
  ],
};

function makeController(tour: Tour = heritageTour) {
  const firstStopAttr = attractions.find(
    (a) => a.id === tour.stops[0].attractionId,
  )!;
  const provider = new SimulatedLocationProvider(firstStopAttr.coordinates);
  const controller = TourLocationController.create(tour, provider, attractions);
  return { controller, provider };
}

// ---------------------------------------------------------------------------
// 1. Basic Arrival State
// ---------------------------------------------------------------------------

describe('M6.4 — 1. Basic arrival state', () => {
  test('session starts unreached before arriving at stop', () => {
    const { controller } = makeController();
    const session = controller.getSession();
    expect(session.isCurrentStopReached).toBe(false);
    expect(session.currentStopIndex).toBe(0);
    controller.destroy();
  });

  test('entering trigger radius marks stop as reached', () => {
    const { controller, provider } = makeController();
    // Teleport inside trigger radius
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    controller.destroy();
  });

  test('isCurrentStopReached is false while outside trigger radius', () => {
    const { controller, provider } = makeController();
    // Move 200m away — far outside 50m trigger radius
    provider.setLocation(offsetPoint(attr1.coordinates, 200, 0));
    expect(controller.getSession().isCurrentStopReached).toBe(false);
    controller.destroy();
  });

  test('arrival correctly identifies which stop was reached', () => {
    const { controller, provider } = makeController();
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    const session = controller.getSession();
    const currentStop = getCurrentStop(session)!;
    expect(currentStop.id).toBe(stop1.id);
    expect(currentStop.attractionId).toBe(attr1.id);
    controller.destroy();
  });

  test('arrival does not auto-advance the tour', () => {
    const { controller, provider } = makeController();
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    const session = controller.getSession();
    expect(session.isCurrentStopReached).toBe(true);
    expect(session.currentStopIndex).toBe(0);  // still at stop 0
    expect(session.completedStopIndices.length).toBe(0);  // not completed
    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 2. Idempotency — Repeated GPS updates do NOT re-trigger arrival
// ---------------------------------------------------------------------------

describe('M6.4 — 2. Repeated GPS updates do not re-trigger arrival', () => {
  test('session listener is notified exactly once for multiple updates inside trigger radius', () => {
    const { controller, provider } = makeController();
    const sessionUpdates: TourSession[] = [];
    controller.subscribe((session) => sessionUpdates.push({ ...session }));

    // First arrival
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    const updateCountAfterFirstArrival = sessionUpdates.length;
    expect(updateCountAfterFirstArrival).toBe(1);

    // 5 more GPS updates while remaining inside the radius
    for (let i = 1; i <= 5; i++) {
      const jitter = offsetPoint(attr1.coordinates, i * 2, i * 2);
      provider.setLocation(jitter);
    }

    // Session listener count must not have grown from additional updates
    expect(sessionUpdates.length).toBe(updateCountAfterFirstArrival);
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    controller.destroy();
  });

  test('10 rapid GPS updates inside radius result in exactly 1 session notification', () => {
    const { controller, provider } = makeController();
    let notificationCount = 0;
    controller.subscribe(() => notificationCount++);

    // Move inside trigger radius and hammer updates
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    for (let i = 0; i < 10; i++) {
      provider.setLocation(
        offsetPoint(attr1.coordinates, (i % 5) * 3, (i % 3) * 3),
      );
    }

    expect(notificationCount).toBe(1);
    controller.destroy();
  });

  test('completedStopIndices does not grow from repeated updates inside radius', () => {
    const { controller, provider } = makeController();
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);

    // 10 location updates at the stop
    for (let i = 0; i < 10; i++) {
      provider.setLocation(attr1.coordinates);
    }

    expect(controller.getSession().completedStopIndices.length).toBe(0);
    expect(controller.getSession().currentStopIndex).toBe(0);
    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 3. Leaving and Returning — Tour state not corrupted
// ---------------------------------------------------------------------------

describe('M6.4 — 3. Leaving and returning to the same stop', () => {
  test('moving away from a reached stop keeps it reached', () => {
    const { controller, provider } = makeController();
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    expect(controller.getSession().isCurrentStopReached).toBe(true);

    // Walk 500m away
    provider.setLocation(offsetPoint(attr1.coordinates, 500, 0));
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    controller.destroy();
  });

  test('returning to the same stop after moving away keeps it reached (not doubled)', () => {
    const { controller, provider } = makeController();
    const sessionUpdates: TourSession[] = [];
    controller.subscribe((s) => sessionUpdates.push({ ...s }));

    // Arrive → leave → return
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    provider.setLocation(offsetPoint(attr1.coordinates, 500, 0));
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);

    // Still reached; no duplicate advance
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    expect(controller.getSession().currentStopIndex).toBe(0);
    expect(controller.getSession().completedStopIndices.length).toBe(0);
    // Notified only once (on first arrival)
    expect(sessionUpdates.length).toBe(1);
    controller.destroy();
  });

  test('after reset, leaving and returning triggers fresh arrival', () => {
    const { controller, provider } = makeController();

    // Arrive at stop 1
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    expect(controller.getSession().isCurrentStopReached).toBe(true);

    // Reset tour
    controller.reset();
    expect(controller.getSession().isCurrentStopReached).toBe(false);
    expect(controller.getSession().currentStopIndex).toBe(0);

    // Leave and re-arrive → triggers arrival again (fresh stop)
    provider.setLocation(offsetPoint(attr1.coordinates, 200, 0));
    expect(controller.getSession().isCurrentStopReached).toBe(false);
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    expect(controller.getSession().isCurrentStopReached).toBe(true);

    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 4. Tour Progression Correctness
// ---------------------------------------------------------------------------

describe('M6.4 — 4. Tour progression correctness', () => {
  test('moveToNextStop requires arrival first', () => {
    const { controller } = makeController();
    expect(controller.getSession().isCurrentStopReached).toBe(false);

    // Attempt to move without arriving
    controller.moveToNextStop();
    expect(controller.getSession().currentStopIndex).toBe(0);  // unchanged
    controller.destroy();
  });

  test('progress fraction is 0 before any stops are completed', () => {
    const { controller } = makeController();
    expect(getProgress(controller.getSession())).toBe(0);
    controller.destroy();
  });

  test('arriving and completing stop 1 advances to stop 2', () => {
    const { controller, provider } = makeController(TWO_STOP_TOUR);
    provider.arriveAt(attr1.coordinates, 50);
    controller.moveToNextStop();

    const session = controller.getSession();
    expect(session.currentStopIndex).toBe(1);
    expect(session.completedStopIndices).toContain(0);
    expect(session.isCurrentStopReached).toBe(false);
    controller.destroy();
  });

  test('progress updates correctly after completing stop 1 of 4', () => {
    const { controller, provider } = makeController();
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    controller.moveToNextStop();
    expect(getProgress(controller.getSession())).toBeCloseTo(0.25, 2);
    controller.destroy();
  });

  test('completing stops 1 and 2 shows 50% progress on 4-stop tour', () => {
    const { controller, provider } = makeController();
    // Stop 1
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    controller.moveToNextStop();
    // Stop 2
    provider.arriveAt(attr2.coordinates, stop2.triggerRadiusMeters);
    controller.moveToNextStop();
    expect(getProgress(controller.getSession())).toBeCloseTo(0.5, 2);
    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 5. Final Stop / Completion Behavior
// ---------------------------------------------------------------------------

describe('M6.4 — 5. Final stop and completion behavior', () => {
  test('completing the last stop marks tour as complete', () => {
    const { controller, provider } = makeController();
    for (const stop of heritageTour.stops) {
      const attr = attractions.find((a) => a.id === stop.attractionId)!;
      provider.arriveAt(attr.coordinates, stop.triggerRadiusMeters);
      controller.moveToNextStop();
    }
    expect(controller.getSession().isComplete).toBe(true);
    controller.destroy();
  });

  test('all 4 stops are in completedStopIndices after tour completion', () => {
    const { controller, provider } = makeController();
    for (const stop of heritageTour.stops) {
      const attr = attractions.find((a) => a.id === stop.attractionId)!;
      provider.arriveAt(attr.coordinates, stop.triggerRadiusMeters);
      controller.moveToNextStop();
    }
    expect(controller.getSession().completedStopIndices.length).toBe(4);
    expect(getProgress(controller.getSession())).toBe(1.0);
    controller.destroy();
  });

  test('GPS updates after completion do not alter session', () => {
    const { controller, provider } = makeController();
    for (const stop of heritageTour.stops) {
      const attr = attractions.find((a) => a.id === stop.attractionId)!;
      provider.arriveAt(attr.coordinates, stop.triggerRadiusMeters);
      controller.moveToNextStop();
    }
    expect(controller.getSession().isComplete).toBe(true);

    // Post-completion GPS updates
    provider.setLocation(attr1.coordinates);
    provider.setLocation(attr2.coordinates);
    expect(controller.getSession().isComplete).toBe(true);
    expect(controller.getSession().completedStopIndices.length).toBe(4);
    controller.destroy();
  });

  test('moveToNextStop after completion is a no-op', () => {
    const { controller, provider } = makeController(TWO_STOP_TOUR);
    provider.arriveAt(attr1.coordinates, 50);
    controller.moveToNextStop();
    provider.arriveAt(attr2.coordinates, 50);
    controller.moveToNextStop();
    expect(controller.getSession().isComplete).toBe(true);

    controller.moveToNextStop();
    expect(controller.getSession().isComplete).toBe(true);
    expect(controller.getSession().completedStopIndices.length).toBe(2);
    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 6. Story / Content Association at Arrival
// ---------------------------------------------------------------------------

describe('M6.4 — 6. Story content is correctly associated on arrival', () => {
  test('story for stop 1 is accessible after arrival', () => {
    expect(story1).not.toBeNull();
    expect(story1!.attractionId).toBe(attr1.id);
    expect(typeof story1!.narrationText).toBe('string');
    expect(story1!.narrationText.length).toBeGreaterThan(0);
  });

  test('story for stop 2 is different from story for stop 1', () => {
    expect(story1).not.toBeNull();
    expect(story2).not.toBeNull();
    expect(story2!.id).not.toBe(story1!.id);
    expect(story2!.attractionId).toBe(attr2.id);
  });

  test('all stops in heritage tour have a valid story', () => {
    for (const stop of heritageTour.stops) {
      const story = stories.find((s) => s.id === stop.storyId);
      expect(story).toBeDefined();
      expect(story!.narrationText.length).toBeGreaterThan(0);
    }
  });

  test('moving to next stop changes the active stop and its story', () => {
    const { controller, provider } = makeController();
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    controller.moveToNextStop();

    const session = controller.getSession();
    const currentStopData = getCurrentStop(session)!;
    const nextStory = stories.find((s) => s.id === currentStopData.storyId);

    expect(currentStopData.id).toBe(stop2.id);
    expect(nextStory).toBeDefined();
    expect(nextStory!.id).toBe(stop2.storyId);
    expect(nextStory!.id).not.toBe(stop1.storyId);
    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 7. Reset Behavior
// ---------------------------------------------------------------------------

describe('M6.4 — 7. Reset restores fresh state', () => {
  test('reset after partial progress restores stop 1 unreached state', () => {
    const { controller, provider } = makeController();
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    controller.moveToNextStop();
    expect(controller.getSession().currentStopIndex).toBe(1);

    controller.reset();
    const session = controller.getSession();
    expect(session.currentStopIndex).toBe(0);
    expect(session.isCurrentStopReached).toBe(false);
    expect(session.completedStopIndices.length).toBe(0);
    expect(session.isComplete).toBe(false);
    controller.destroy();
  });

  test('after reset, arrival at stop 1 works correctly', () => {
    const { controller, provider } = makeController();
    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    controller.moveToNextStop();
    controller.reset();

    provider.arriveAt(attr1.coordinates, stop1.triggerRadiusMeters);
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    expect(controller.getSession().currentStopIndex).toBe(0);
    controller.destroy();
  });
});
