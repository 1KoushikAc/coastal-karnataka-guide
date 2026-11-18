// mobile/src/engine/planner/tripPlanner.ts
// =============================================================================
// M8: Personalized Trip Planner Engine
// =============================================================================
// Pure, deterministic trip planning service.
// Accepts traveler preferences and destination data; produces a tailored,
// time-bounded, budget-compliant itinerary ready for TourSession consumption.
//
// Rules:
//   - No AI, no external network calls, no probabilistic inference.
//   - Never asks for or infers religion, beliefs, or sensitive characteristics.
//   - Skipped attractions are strictly excluded from the result.
//   - Time constraints and budgets are strictly respected.
//   - Deterministic: identical inputs always yield identical routes.
// =============================================================================

import type { Attraction, Story, Tour, TourStop, Destination, Category } from '@shared-types/index';
import { computeDistanceMeters } from '../distance';
import type {
  TravelerPreferences,
  PersonalizedPlanResult,
  PlannedStop,
} from './types';
import { TIME_CONSTRAINTS } from './types';

/** Average walking/transit speed assumed across coastal city stops (meters/minute: ~4.5 km/h) */
const ASSUMED_TRANSIT_SPEED_METERS_PER_MIN = 75;

/** Minimum realistic buffer for transferring between distinct city landmarks (minutes) */
const MIN_TRANSIT_BUFFER_MINUTES = 10;

/**
 * Calculates estimated transit duration between two geographic coordinates in minutes.
 */
export function estimateTransitMinutes(
  fromCoords: { latitude: number; longitude: number },
  toCoords: { latitude: number; longitude: number },
): { distanceMeters: number; transitMinutes: number } {
  const distanceMeters = Math.round(computeDistanceMeters(fromCoords, toCoords));
  if (distanceMeters < 50) {
    return { distanceMeters, transitMinutes: 0 };
  }
  const rawMinutes = Math.round(distanceMeters / ASSUMED_TRANSIT_SPEED_METERS_PER_MIN);
  const transitMinutes = Math.max(MIN_TRANSIT_BUFFER_MINUTES, rawMinutes);
  return { distanceMeters, transitMinutes };
}

/**
 * Core planner: deterministic route construction based on traveler preferences.
 */
export function planPersonalizedTour(
  preferences: TravelerPreferences,
  destination: Destination,
  allAttractions: Attraction[],
  allStories: Story[],
): PersonalizedPlanResult {
  const warnings: string[] = [];
  const planId = `plan-${destination.id}-${Math.abs(hashPreferences(preferences))}`;

  // 1. Filter destination attractions (by cityId and registered attractionIds)
  const registeredIds = new Set(destination.attractionIds);
  const destinationPool = allAttractions.filter(
    (a) => a.cityId === destination.id || registeredIds.has(a.id),
  );

  if (destinationPool.length === 0) {
    return createEmptyResult(
      planId,
      destination,
      preferences,
      'No attractions currently available for this destination.',
      ['Destination has no registered attractions.'],
    );
  }

  // 2. Filter out explicitly skipped attractions (strict skip rule)
  const skippedSet = new Set(preferences.skippedAttractions);
  const skippedAttractionIds: string[] = [];
  const nonSkippedPool: Attraction[] = [];

  for (const attr of destinationPool) {
    if (skippedSet.has(attr.id)) {
      skippedAttractionIds.push(attr.id);
    } else {
      nonSkippedPool.push(attr);
    }
  }

  if (nonSkippedPool.length === 0) {
    return createEmptyResult(
      planId,
      destination,
      preferences,
      'All available attractions in this destination were marked as skipped.',
      ['Every destination landmark was excluded by traveler skip preferences.'],
      skippedAttractionIds,
    );
  }

  // 3. Budget filtering
  const excludedByBudgetIds: string[] = [];
  const budgetCompliantPool: Attraction[] = [];

  for (const attr of nonSkippedPool) {
    if (preferences.budget === 'free') {
      const isPaid = attr.admission && !attr.admission.isFree && (attr.admission.amount ?? 0) > 0;
      if (isPaid) {
        excludedByBudgetIds.push(attr.id);
      } else {
        budgetCompliantPool.push(attr);
      }
    } else {
      budgetCompliantPool.push(attr);
    }
  }

  if (budgetCompliantPool.length === 0) {
    return createEmptyResult(
      planId,
      destination,
      preferences,
      'No attractions matched your budget criteria.',
      ['All matching landmarks require admission fees above the selected tier.'],
      skippedAttractionIds,
      excludedByBudgetIds,
    );
  }

  // 4. Interest scoring & deduplication
  const hasInterests = preferences.selectedInterests.length > 0;
  const interestSet = new Set<Category>(preferences.selectedInterests);

  interface ScoredCandidate {
    attraction: Attraction;
    score: number;
    matchingInterests: Category[];
  }

  const scoredCandidates: ScoredCandidate[] = [];

  for (const attr of budgetCompliantPool) {
    const matchingInterests = attr.categories.filter((cat) => interestSet.has(cat));
    const score = hasInterests ? matchingInterests.length : 1;

    // Only include if matches at least one selected interest (or if no interests specified, include all)
    if (!hasInterests || score > 0) {
      scoredCandidates.push({ attraction: attr, score, matchingInterests });
    }
  }

  // If no candidates matched chosen interests, fallback gracefully to all budget-compliant places
  if (scoredCandidates.length === 0 && hasInterests) {
    warnings.push('No attractions matched all selected interests; broadened selection to highlights.');
    for (const attr of budgetCompliantPool) {
      scoredCandidates.push({ attraction: attr, score: 0.5, matchingInterests: [] });
    }
  }

  // 5. Deterministic initial sort: highest score first, then shorter visit time, then alphabetical by ID
  scoredCandidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.attraction.estimatedVisitDurationMinutes !== b.attraction.estimatedVisitDurationMinutes) {
      return a.attraction.estimatedVisitDurationMinutes - b.attraction.estimatedVisitDurationMinutes;
    }
    return a.attraction.id.localeCompare(b.attraction.id);
  });

  // 6. Time budget constraints & spatial route building
  const timeConfig = TIME_CONSTRAINTS[preferences.availableTime];
  const maxMinutes = timeConfig.maxMinutes;

  const plannedStops: PlannedStop[] = [];
  const excludedByTimeIds: string[] = [];
  let totalVisitMinutes = 0;
  let totalTransitMinutes = 0;

  const remaining = [...scoredCandidates];

  // Pick anchor (first stop)
  if (remaining.length > 0) {
    const firstCandidate = remaining.shift()!;
    const visitDuration = firstCandidate.attraction.estimatedVisitDurationMinutes;

    if (visitDuration <= maxMinutes) {
      const matchReasons = formatMatchReasons(firstCandidate.matchingInterests, firstCandidate.score);
      const story = allStories.find((s) => s.attractionId === firstCandidate.attraction.id) ?? null;

      plannedStops.push({
        order: 1,
        attraction: firstCandidate.attraction,
        story,
        visitDurationMinutes: visitDuration,
        transitMinutesFromPrevious: 0,
        distanceMetersFromPrevious: 0,
        matchReasons,
      });

      totalVisitMinutes += visitDuration;
    } else {
      excludedByTimeIds.push(firstCandidate.attraction.id);
    }
  }

  // Iteratively add nearest next candidate within time limit
  while (remaining.length > 0 && plannedStops.length > 0) {
    const lastStop = plannedStops[plannedStops.length - 1];

    // Score remaining candidates by (distance proximity + score weighting)
    let bestIndex = -1;
    let bestCost = Infinity;
    let bestTransit = { distanceMeters: 0, transitMinutes: 0 };

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const transit = estimateTransitMinutes(lastStop.attraction.coordinates, candidate.attraction.coordinates);
      const prospectiveTotal =
        totalVisitMinutes + totalTransitMinutes + transit.transitMinutes + candidate.attraction.estimatedVisitDurationMinutes;

      // Check if fits in maxMinutes
      if (prospectiveTotal <= maxMinutes) {
        // Cost heuristic: prioritize lower distance + higher interest score
        const cost = transit.distanceMeters - candidate.score * 500;
        if (cost < bestCost) {
          bestCost = cost;
          bestIndex = i;
          bestTransit = transit;
        }
      }
    }

    if (bestIndex >= 0) {
      const selected = remaining.splice(bestIndex, 1)[0];
      const story = allStories.find((s) => s.attractionId === selected.attraction.id) ?? null;
      const matchReasons = formatMatchReasons(selected.matchingInterests, selected.score);

      totalTransitMinutes += bestTransit.transitMinutes;
      totalVisitMinutes += selected.attraction.estimatedVisitDurationMinutes;

      plannedStops.push({
        order: plannedStops.length + 1,
        attraction: selected.attraction,
        story,
        visitDurationMinutes: selected.attraction.estimatedVisitDurationMinutes,
        transitMinutesFromPrevious: bestTransit.transitMinutes,
        distanceMetersFromPrevious: bestTransit.distanceMeters,
        matchReasons,
      });
    } else {
      // No remaining candidate fits within time budget
      for (const unplaced of remaining) {
        excludedByTimeIds.push(unplaced.attraction.id);
      }
      break;
    }
  }

  const totalDurationMinutes = totalVisitMinutes + totalTransitMinutes;

  if (plannedStops.length === 0) {
    return createEmptyResult(
      planId,
      destination,
      preferences,
      'Could not fit any landmark within the specified time budget.',
      ['Selected landmarks exceed the maximum available time duration.'],
      skippedAttractionIds,
      excludedByBudgetIds,
      excludedByTimeIds,
    );
  }

  // 7. Generate Tour object consumable by existing TourSession
  const generatedTour = buildTourFromPlannedStops(planId, destination, preferences, plannedStops, totalDurationMinutes);

  // 8. Generate transparent, honest traveler summary
  const summary = buildSummaryText(destination, preferences, plannedStops.length, totalDurationMinutes, skippedAttractionIds.length);

  return {
    id: planId,
    success: true,
    destination,
    preferences,
    plannedStops,
    totalDurationMinutes,
    totalVisitMinutes,
    totalTransitMinutes,
    skippedAttractionIds,
    excludedByTimeIds,
    excludedByBudgetIds,
    generatedTour,
    summary,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMatchReasons(matchingInterests: Category[], score: number): string[] {
  if (matchingInterests.length > 0) {
    return matchingInterests.map((cat) => `Matches: ${cat.charAt(0).toUpperCase() + cat.slice(1)}`);
  }
  return score > 0 ? ['Key destination landmark'] : ['Curated highlight'];
}

function buildTourFromPlannedStops(
  planId: string,
  destination: Destination,
  preferences: TravelerPreferences,
  plannedStops: PlannedStop[],
  totalDurationMinutes: number,
): Tour {
  const primaryCategory: Category =
    preferences.selectedInterests[0] ?? plannedStops[0]?.attraction.categories[0] ?? 'history';

  const tourStops: TourStop[] = plannedStops.map((ps) => ({
    id: `stop-${ps.attraction.id}`,
    attractionId: ps.attraction.id,
    order: ps.order,
    triggerRadiusMeters: 50,
    storyId: ps.story?.id ?? `story-${ps.attraction.id}`,
  }));

  const tourId = `custom-tour-${planId}`;

  return {
    id: tourId,
    cityId: destination.id,
    name: `Personalized ${destination.name} Walk`,
    description: `A custom-tailored ${plannedStops.length}-stop itinerary created for your chosen interests and time budget.`,
    category: primaryCategory,
    estimatedDurationMinutes: totalDurationMinutes,
    stops: tourStops,
    heroImage: destination.heroImage ?? plannedStops[0]?.attraction.image,
  };
}

function buildSummaryText(
  destination: Destination,
  preferences: TravelerPreferences,
  stopCount: number,
  totalMinutes: number,
  skippedCount: number,
): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeFormatted = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim() : `${mins}m`;

  const interestText =
    preferences.selectedInterests.length > 0
      ? `focused on ${preferences.selectedInterests.join(', ')}`
      : 'covering top regional highlights';

  const skipText = skippedCount > 0 ? ` (${skippedCount} ${skippedCount === 1 ? 'place' : 'places'} excluded by your choice)` : '';

  return `Personalized ${stopCount}-stop route in ${destination.name} ${interestText}, estimated at ~${timeFormatted}${skipText}.`;
}

function createEmptyResult(
  id: string,
  destination: Destination,
  preferences: TravelerPreferences,
  summary: string,
  warnings: string[],
  skippedAttractionIds: string[] = [],
  excludedByBudgetIds: string[] = [],
  excludedByTimeIds: string[] = [],
): PersonalizedPlanResult {
  return {
    id,
    success: false,
    destination,
    preferences,
    plannedStops: [],
    totalDurationMinutes: 0,
    totalVisitMinutes: 0,
    totalTransitMinutes: 0,
    skippedAttractionIds,
    excludedByBudgetIds,
    excludedByTimeIds,
    generatedTour: null,
    summary,
    warnings,
  };
}

function hashPreferences(p: TravelerPreferences): number {
  const str = `${p.destinationId}:${p.availableTime}:${p.budget}:${p.selectedInterests.sort().join(',')}:${p.skippedAttractions.sort().join(',')}:${p.travelerType ?? ''}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
