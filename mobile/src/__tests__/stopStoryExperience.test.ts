// src/__tests__/stopStoryExperience.test.ts
// =============================================================================
// M6.5 — Story Experience & Stop Content Tests
// =============================================================================
// Verifies:
//   1. Correct M1 content is resolved for each stop (attraction + story).
//   2. Different stops display their own distinct data.
//   3. Opening/returning from the story screen does NOT alter tour progress.
//   4. Missing or absent story is handled gracefully without crashing.
//   5. Missing attraction is handled gracefully.
//   6. Content safety: "[PLACEHOLDER...]" narration text is filtered out.
//   7. Content safety: shortDescription fallback is used when narration is absent.
//   8. Stop order label is correct for each stop (e.g. "Stop 1 of 4").
//   9. All stops in the tour have resolvable attraction + story data.
//  10. Story titles are unique across stops.
//  11. Estimated visit duration is always a positive integer.
//  12. Tour session state is independent of story-screen data resolution.
// =============================================================================

import { tours, attractions, stories } from '@data/index';
import { TourLocationController } from '../engine/TourLocationController';
import { SimulatedLocationProvider } from '../engine/location/SimulatedLocationProvider';
import { getProgress } from '../engine/tourEngine';

// ---------------------------------------------------------------------------
// Helpers — mirrors StopStoryScreen logic without React rendering
// ---------------------------------------------------------------------------

/** Mirrors the content-safety filter in StopStoryScreen. */
function safeNarrationText(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith('[PLACEHOLDER') || trimmed.startsWith('[placeholder')) {
    return null;
  }
  return trimmed.length > 0 ? trimmed : null;
}

/** Mirrors the content-safety filter in StopStoryScreen. */
function safeShortDescription(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith('[PLACEHOLDER') || trimmed.startsWith('[placeholder')) {
    return null;
  }
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resolves the display data that StopStoryScreen would show for a given stop.
 * Returns the same object shape the screen derives from route params.
 */
function resolveStopContent(tourId: string, stopIndex: number) {
  const tour = tours.find((t) => t.id === tourId) ?? null;
  const stop = tour?.stops[stopIndex] ?? null;
  const attraction = stop
    ? attractions.find((a) => a.id === stop.attractionId) ?? null
    : null;
  const story = stop
    ? stories.find((s) => s.id === stop.storyId) ?? null
    : null;
  const narrationText = story?.narrationText
    ? safeNarrationText(story.narrationText)
    : null;
  const shortDescription = attraction?.shortDescription
    ? safeShortDescription(attraction.shortDescription)
    : null;
  const stopLabel = tour && stop ? `Stop ${stop.order} of ${tour.stops.length}` : null;

  return { tour, stop, attraction, story, narrationText, shortDescription, stopLabel };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TOUR_ID = 'mangalore-heritage-walk';
const heritageTour = tours.find((t) => t.id === TOUR_ID)!;

// ---------------------------------------------------------------------------
// 1. Correct content for each stop
// ---------------------------------------------------------------------------

describe('M6.5 — 1. Correct content is resolved per stop', () => {
  test('stop 0 resolves to Kadri Manjunatha Temple', () => {
    const { attraction, story } = resolveStopContent(TOUR_ID, 0);
    expect(attraction).not.toBeNull();
    expect(attraction!.name).toBe('Kadri Manjunatha Temple');
    expect(story).not.toBeNull();
    expect(story!.title).toBe('A Thousand Years at Kadri Hill');
  });

  test('stop 1 resolves to St. Aloysius Chapel', () => {
    const { attraction, story } = resolveStopContent(TOUR_ID, 1);
    expect(attraction!.name).toBe('St. Aloysius Chapel');
    expect(story!.title).toBe('The Chapel of a Thousand Frescoes');
  });

  test('stop 2 resolves to Mangaladevi Temple', () => {
    const { attraction, story } = resolveStopContent(TOUR_ID, 2);
    expect(attraction!.name).toBe('Mangaladevi Temple');
    expect(story!.title).toBe('The Goddess Who Named a City');
  });

  test('stop 3 resolves to Sultan Battery', () => {
    const { attraction, story } = resolveStopContent(TOUR_ID, 3);
    expect(attraction!.name).toBe('Sultan Battery');
    expect(story!.title).toBe("Tipu Sultan's Eye on the Sea");
  });

  test('stop label is "Stop N of 4" for each stop', () => {
    for (let i = 0; i < heritageTour.stops.length; i++) {
      const { stopLabel } = resolveStopContent(TOUR_ID, i);
      expect(stopLabel).toBe(`Stop ${i + 1} of 4`);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Different stops show their own distinct data
// ---------------------------------------------------------------------------

describe('M6.5 — 2. Different stops have distinct content', () => {
  test('all 4 stops have unique attraction names', () => {
    const names = heritageTour.stops.map((_, i) => {
      const { attraction } = resolveStopContent(TOUR_ID, i);
      return attraction!.name;
    });
    expect(new Set(names).size).toBe(4);
  });

  test('all 4 stops have unique story titles', () => {
    const titles = heritageTour.stops.map((_, i) => {
      const { story } = resolveStopContent(TOUR_ID, i);
      return story!.title;
    });
    expect(new Set(titles).size).toBe(4);
  });

  test('all 4 stops have unique narration texts', () => {
    const texts = heritageTour.stops.map((_, i) => {
      const { narrationText } = resolveStopContent(TOUR_ID, i);
      return narrationText;
    });
    const unique = new Set(texts.filter(Boolean));
    expect(unique.size).toBe(4);
  });

  test('attraction IDs match their respective stops', () => {
    for (let i = 0; i < heritageTour.stops.length; i++) {
      const { attraction, stop } = resolveStopContent(TOUR_ID, i);
      expect(attraction!.id).toBe(stop!.attractionId);
    }
  });

  test('story attractionIds link to the correct attraction for each stop', () => {
    for (let i = 0; i < heritageTour.stops.length; i++) {
      const { attraction, story } = resolveStopContent(TOUR_ID, i);
      expect(story!.attractionId).toBe(attraction!.id);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Opening the story screen does NOT alter tour session state
// ---------------------------------------------------------------------------

describe('M6.5 — 3. Story screen data resolution is read-only (no session mutation)', () => {
  test('resolving stop content does not change session progress', () => {
    const firstAttr = attractions.find((a) => a.id === heritageTour.stops[0].attractionId)!;
    const provider = new SimulatedLocationProvider(firstAttr.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions);

    const progressBefore = getProgress(controller.getSession());

    // Simulate what StopStoryScreen.useMemo calls do — pure data resolution
    resolveStopContent(TOUR_ID, 0);
    resolveStopContent(TOUR_ID, 1);

    const progressAfter = getProgress(controller.getSession());
    expect(progressAfter).toBe(progressBefore);
    expect(progressAfter).toBe(0);

    controller.destroy();
  });

  test('resolving stop content does not mark any stop as reached', () => {
    const firstAttr = attractions.find((a) => a.id === heritageTour.stops[0].attractionId)!;
    const provider = new SimulatedLocationProvider(firstAttr.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions);

    // Open and "close" the story screen (just resolve data)
    for (let i = 0; i < heritageTour.stops.length; i++) {
      resolveStopContent(TOUR_ID, i);
    }

    expect(controller.getSession().isCurrentStopReached).toBe(false);
    expect(controller.getSession().completedStopIndices.length).toBe(0);

    controller.destroy();
  });

  test('completing stops via engine is unaffected by story resolution', () => {
    const firstAttr = attractions.find((a) => a.id === heritageTour.stops[0].attractionId)!;
    const provider = new SimulatedLocationProvider(firstAttr.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions);

    // Arrive at stop 1
    provider.arriveAt(firstAttr.coordinates, heritageTour.stops[0].triggerRadiusMeters);
    expect(controller.getSession().isCurrentStopReached).toBe(true);

    // Resolve story data (as if StopStoryScreen opened)
    resolveStopContent(TOUR_ID, 0);

    // Still reached; no session mutation
    expect(controller.getSession().isCurrentStopReached).toBe(true);
    expect(controller.getSession().currentStopIndex).toBe(0);

    // Advance stop normally
    controller.moveToNextStop();
    expect(controller.getSession().currentStopIndex).toBe(1);
    expect(getProgress(controller.getSession())).toBeCloseTo(0.25, 2);

    controller.destroy();
  });

  test('story data for stop 0 is still correct after advancing to stop 1', () => {
    const firstAttr = attractions.find((a) => a.id === heritageTour.stops[0].attractionId)!;
    const provider = new SimulatedLocationProvider(firstAttr.coordinates);
    const controller = TourLocationController.create(heritageTour, provider, attractions);

    provider.arriveAt(firstAttr.coordinates, heritageTour.stops[0].triggerRadiusMeters);
    controller.moveToNextStop();

    // After advancing, resolving stop 0 data still returns stop 0's content
    const { attraction, story } = resolveStopContent(TOUR_ID, 0);
    expect(attraction!.name).toBe('Kadri Manjunatha Temple');
    expect(story!.title).toBe('A Thousand Years at Kadri Hill');

    controller.destroy();
  });
});

// ---------------------------------------------------------------------------
// 4. Graceful handling of missing story
// ---------------------------------------------------------------------------

describe('M6.5 — 4. Missing story handled gracefully', () => {
  test('stop with no matching story returns null story', () => {
    // Simulate a hypothetical stop where storyId does not resolve
    const syntheticStop = { ...heritageTour.stops[0], storyId: 'non-existent-story-id' };
    const syntheticTour = {
      ...heritageTour,
      stops: [syntheticStop],
    };
    const syntheticTourLookup = [syntheticTour];

    const tour = syntheticTourLookup.find((t) => t.id === TOUR_ID)!;
    const stop = tour.stops[0];
    const story = stories.find((s) => s.id === stop.storyId) ?? null;

    expect(story).toBeNull();
    // Attraction is still present
    const attraction = attractions.find((a) => a.id === stop.attractionId);
    expect(attraction).toBeDefined();
  });

  test('shortDescription is a valid fallback when story is absent', () => {
    // All current attractions have shortDescription — verify for each
    for (const attr of attractions) {
      expect(attr.shortDescription).toBeDefined();
      expect(attr.shortDescription.length).toBeGreaterThan(0);
    }
  });

  test('invalid stopIndex (out of range) gracefully returns null stop', () => {
    const { stop, attraction, story } = resolveStopContent(TOUR_ID, 999);
    expect(stop).toBeNull();
    expect(attraction).toBeNull();
    expect(story).toBeNull();
  });

  test('invalid tourId gracefully returns null tour', () => {
    const { tour, stop, attraction, story } = resolveStopContent('non-existent-tour', 0);
    expect(tour).toBeNull();
    expect(stop).toBeNull();
    expect(attraction).toBeNull();
    expect(story).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 5. Content safety — placeholder suppression
// ---------------------------------------------------------------------------

describe('M6.5 — 5. Content safety: placeholder text is suppressed', () => {
  test('safeNarrationText returns null for text beginning with [PLACEHOLDER', () => {
    expect(safeNarrationText('[PLACEHOLDER] This is draft content')).toBeNull();
    expect(safeNarrationText('[PLACEHOLDER content pending]')).toBeNull();
  });

  test('safeNarrationText returns null for empty or whitespace-only text', () => {
    expect(safeNarrationText('')).toBeNull();
    expect(safeNarrationText('   ')).toBeNull();
  });

  test('safeNarrationText returns real content unchanged', () => {
    const real = 'Welcome to the Kadri Manjunatha Temple.';
    expect(safeNarrationText(real)).toBe(real);
  });

  test('safeShortDescription returns null for text beginning with [PLACEHOLDER', () => {
    expect(safeShortDescription('[PLACEHOLDER: Write description here]')).toBeNull();
  });

  test('safeShortDescription returns real description unchanged', () => {
    const real = 'A Jesuit chapel built in 1880.';
    expect(safeShortDescription(real)).toBe(real);
  });

  test('all current narration texts pass the safety filter (no placeholder markers)', () => {
    for (const story of stories) {
      const safe = safeNarrationText(story.narrationText);
      expect(safe).not.toBeNull();
      expect(safe!.length).toBeGreaterThan(50);
    }
  });

  test('all current shortDescriptions pass the safety filter', () => {
    for (const attraction of attractions) {
      const safe = safeShortDescription(attraction.shortDescription);
      expect(safe).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Data completeness for the story screen
// ---------------------------------------------------------------------------

describe('M6.5 — 6. All stops have complete resolvable data for the story screen', () => {
  test('all 4 heritage tour stops have a resolvable attraction', () => {
    for (let i = 0; i < heritageTour.stops.length; i++) {
      const { attraction } = resolveStopContent(TOUR_ID, i);
      expect(attraction).not.toBeNull();
    }
  });

  test('all 4 heritage tour stops have a resolvable story', () => {
    for (let i = 0; i < heritageTour.stops.length; i++) {
      const { story } = resolveStopContent(TOUR_ID, i);
      expect(story).not.toBeNull();
    }
  });

  test('all attractions have a positive estimatedVisitDurationMinutes', () => {
    for (const attr of attractions) {
      expect(attr.estimatedVisitDurationMinutes).toBeGreaterThan(0);
      expect(Number.isInteger(attr.estimatedVisitDurationMinutes)).toBe(true);
    }
  });

  test('all attractions have at least one category', () => {
    for (const attr of attractions) {
      expect(attr.categories.length).toBeGreaterThan(0);
    }
  });

  test('all attraction images have an assetKey string', () => {
    for (const attr of attractions) {
      expect(typeof attr.image.assetKey).toBe('string');
      expect(attr.image.assetKey.length).toBeGreaterThan(0);
    }
  });

  test('all story narration texts are substantive (> 100 chars)', () => {
    for (const story of stories) {
      expect(story.narrationText.trim().length).toBeGreaterThan(100);
    }
  });
});
