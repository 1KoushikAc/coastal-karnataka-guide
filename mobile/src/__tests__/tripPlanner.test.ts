// mobile/src/__tests__/tripPlanner.test.ts
// =============================================================================
// M8: Personalized Trip Planner Engine — Unit Tests
// =============================================================================
// Verifies deterministic itinerary planning across:
//   - Destination scoping
//   - Interest scoring & filtering
//   - Skipped attraction exclusions
//   - Time budget constraints
//   - Budget tier filtering
//   - Deterministic sequencing & transit calculation
//   - Edge cases (all skipped, empty interests, tight time budgets)
//   - Consumability by TourSession
// =============================================================================

import { destinations, attractions, stories } from '@data/index';
import type { Attraction, Destination } from '@shared-types/index';
import { planPersonalizedTour } from '../engine/planner/tripPlanner';
import type { TravelerPreferences } from '../engine/planner/types';
import {
  savePersonalizedPlan,
  getPersonalizedPlan,
  getTourById,
  clearPlanRegistry,
} from '../engine/planner/registry';

describe('M8: Trip Planner Engine', () => {
  const mangaloreDest = destinations.find((d) => d.id === 'mangalore')!;

  beforeEach(() => {
    clearPlanRegistry();
  });

  // ---------------------------------------------------------------------------
  // 1. Destination Scoping
  // ---------------------------------------------------------------------------
  describe('1. Destination scoping', () => {
    test('only includes attractions belonging to the selected destination', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: 'full_day',
        budget: 'any',
        selectedInterests: ['history'],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);

      expect(result.success).toBe(true);
      expect(result.plannedStops.length).toBeGreaterThan(0);
      for (const stop of result.plannedStops) {
        expect(stop.attraction.cityId).toBe('mangalore');
      }
    });

    test('returns graceful failure when destination has no attractions', () => {
      const emptyDest: Destination = {
        id: 'empty-city',
        name: 'Empty City',
        state: 'Karnataka',
        country: 'India',
        description: 'Test city with no attractions',
        coordinates: { latitude: 13.0, longitude: 75.0 },
        attractionIds: [],
        tourIds: [],
      };

      const preferences: TravelerPreferences = {
        destinationId: 'empty-city',
        availableTime: 'full_day',
        budget: 'any',
        selectedInterests: ['history'],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, emptyDest, attractions, stories);
      expect(result.success).toBe(false);
      expect(result.plannedStops.length).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Skipped Attractions (Traveler Agency)
  // ---------------------------------------------------------------------------
  describe('2. Skipped attractions (Traveler Agency)', () => {
    test('strictly excludes a single skipped attraction from planned stops', () => {
      const skipTarget = 'kadri-manjunatha-temple';

      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: 'full_day',
        budget: 'any',
        selectedInterests: ['history', 'religious'],
        skippedAttractions: [skipTarget],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);

      expect(result.success).toBe(true);
      expect(result.skippedAttractionIds).toContain(skipTarget);

      // Verify Kadri never appears in planned stops
      const includedIds = result.plannedStops.map((s) => s.attraction.id);
      expect(includedIds).not.toContain(skipTarget);

      // Verify Kadri never appears in generated tour stops
      const tourStopIds = result.generatedTour!.stops.map((s) => s.attractionId);
      expect(tourStopIds).not.toContain(skipTarget);
    });

    test('strictly excludes multiple skipped attractions', () => {
      const skipped = ['kadri-manjunatha-temple', 'mangaladevi-temple'];

      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: 'full_day',
        budget: 'any',
        selectedInterests: ['history', 'religious', 'coastal'],
        skippedAttractions: skipped,
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);

      expect(result.success).toBe(true);
      const includedIds = result.plannedStops.map((s) => s.attraction.id);
      expect(includedIds).not.toContain('kadri-manjunatha-temple');
      expect(includedIds).not.toContain('mangaladevi-temple');
    });

    test('returns graceful failure when all destination attractions are skipped', () => {
      const allIds = attractions.map((a) => a.id);

      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: 'full_day',
        budget: 'any',
        selectedInterests: ['history'],
        skippedAttractions: allIds,
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);
      expect(result.success).toBe(false);
      expect(result.plannedStops.length).toBe(0);
      expect(result.skippedAttractionIds.length).toBe(allIds.length);
      expect(result.summary).toContain('marked as skipped');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Interest Matching & Scoring
  // ---------------------------------------------------------------------------
  describe('3. Interest matching and scoring', () => {
    test('prioritizes attractions matching selected interests', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: '1-2_hours',
        budget: 'any',
        selectedInterests: ['coastal'],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);

      expect(result.success).toBe(true);
      // The first stop should be a coastal attraction (Sultan Battery or Tannirbhavi Beach)
      expect(result.plannedStops[0].attraction.categories).toContain('coastal');
    });

    test('works seamlessly when no interests are selected (general highlights)', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: '3-4_hours',
        budget: 'any',
        selectedInterests: [],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);

      expect(result.success).toBe(true);
      expect(result.plannedStops.length).toBeGreaterThan(0);
    });

    test('populates match reasons accurately for each stop', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: '3-4_hours',
        budget: 'any',
        selectedInterests: ['history'],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);

      for (const stop of result.plannedStops) {
        expect(stop.matchReasons.length).toBeGreaterThan(0);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Time Budget Constraints
  // ---------------------------------------------------------------------------
  describe('4. Time budget constraints', () => {
    test('1–2 hours option limits total time to <= 120 minutes', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: '1-2_hours',
        budget: 'any',
        selectedInterests: ['history'],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);

      expect(result.success).toBe(true);
      expect(result.totalDurationMinutes).toBeLessThanOrEqual(120);
      expect(result.plannedStops.length).toBeLessThanOrEqual(2);
    });

    test('3–4 hours option accommodates more stops than 1–2 hours', () => {
      const shortPrefs: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: '1-2_hours',
        budget: 'any',
        selectedInterests: ['history', 'religious', 'coastal'],
        skippedAttractions: [],
      };
      const longPrefs: TravelerPreferences = {
        ...shortPrefs,
        availableTime: '3-4_hours',
      };

      const shortResult = planPersonalizedTour(shortPrefs, mangaloreDest, attractions, stories);
      const longResult = planPersonalizedTour(longPrefs, mangaloreDest, attractions, stories);

      expect(longResult.totalDurationMinutes).toBeLessThanOrEqual(240);
      expect(longResult.plannedStops.length).toBeGreaterThanOrEqual(shortResult.plannedStops.length);
    });

    test('full day option includes all compatible stops without exceeding max minutes', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: 'full_day',
        budget: 'any',
        selectedInterests: ['history', 'religious', 'architecture', 'coastal'],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);

      expect(result.success).toBe(true);
      expect(result.totalDurationMinutes).toBeLessThanOrEqual(540);
      expect(result.plannedStops.length).toBeGreaterThanOrEqual(5);
    });

    test('calculates non-zero transit time between distinct successive stops', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: 'full_day',
        budget: 'any',
        selectedInterests: ['history', 'religious'],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);

      expect(result.plannedStops.length).toBeGreaterThanOrEqual(2);
      expect(result.plannedStops[0].transitMinutesFromPrevious).toBe(0);
      expect(result.plannedStops[1].transitMinutesFromPrevious).toBeGreaterThan(0);
      expect(result.totalTransitMinutes).toBeGreaterThan(0);
      expect(result.totalDurationMinutes).toBe(result.totalVisitMinutes + result.totalTransitMinutes);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Budget Constraints
  // ---------------------------------------------------------------------------
  describe('5. Budget constraints', () => {
    test('free tier admits all free Mangalore landmarks', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: 'full_day',
        budget: 'free',
        selectedInterests: ['history', 'religious', 'coastal'],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);

      expect(result.success).toBe(true);
      expect(result.plannedStops.length).toBeGreaterThan(0);
      for (const stop of result.plannedStops) {
        expect(stop.attraction.admission?.isFree ?? true).toBe(true);
      }
    });

    test('excludes paid attractions when budget is set to free', () => {
      const syntheticPaidAttr: Attraction = {
        id: 'synthetic-paid-museum',
        cityId: 'mangalore',
        name: 'Synthetic Paid Museum',
        coordinates: { latitude: 12.87, longitude: 74.84 },
        categories: ['history'],
        shortDescription: 'Paid private museum',
        estimatedVisitDurationMinutes: 30,
        sources: ['https://example.com'],
        image: { assetKey: 'placeholder-kadri-manjunatha-temple', altText: 'Museum', isPlaceholder: true },
        admission: { isFree: false, amount: 250, currency: 'INR' },
      };

      const testAttractions = [...attractions, syntheticPaidAttr];

      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: 'full_day',
        budget: 'free',
        selectedInterests: ['history'],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, testAttractions, stories);

      expect(result.excludedByBudgetIds).toContain('synthetic-paid-museum');
      const stopIds = result.plannedStops.map((s) => s.attraction.id);
      expect(stopIds).not.toContain('synthetic-paid-museum');
    });

    test('includes paid attractions when budget is set to any', () => {
      const syntheticPaidAttr: Attraction = {
        id: 'synthetic-paid-museum',
        cityId: 'mangalore',
        name: 'Synthetic Paid Museum',
        coordinates: { latitude: 12.87, longitude: 74.84 },
        categories: ['history'],
        shortDescription: 'Paid private museum',
        estimatedVisitDurationMinutes: 15,
        sources: ['https://example.com'],
        image: { assetKey: 'placeholder-kadri-manjunatha-temple', altText: 'Museum', isPlaceholder: true },
        admission: { isFree: false, amount: 250, currency: 'INR' },
      };

      const testAttractions = [...attractions, syntheticPaidAttr];

      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: 'full_day',
        budget: 'any',
        selectedInterests: ['history'],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, testAttractions, stories);

      expect(result.excludedByBudgetIds).not.toContain('synthetic-paid-museum');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Determinism & Sequencing
  // ---------------------------------------------------------------------------
  describe('6. Determinism and sequencing', () => {
    test('identical preferences generate identical routes across runs', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: '3-4_hours',
        budget: 'any',
        selectedInterests: ['history', 'religious'],
        skippedAttractions: ['sultan-battery'],
      };

      const run1 = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);
      const run2 = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);

      expect(run1.plannedStops.length).toBe(run2.plannedStops.length);
      expect(run1.totalDurationMinutes).toBe(run2.totalDurationMinutes);
      for (let i = 0; i < run1.plannedStops.length; i++) {
        expect(run1.plannedStops[i].attraction.id).toBe(run2.plannedStops[i].attraction.id);
        expect(run1.plannedStops[i].order).toBe(run2.plannedStops[i].order);
      }
    });

    test('assigns sequential 1-based order to all stops', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: 'full_day',
        budget: 'any',
        selectedInterests: ['history', 'religious', 'coastal'],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);

      for (let i = 0; i < result.plannedStops.length; i++) {
        expect(result.plannedStops[i].order).toBe(i + 1);
      }
    });

    test('ensures no duplicate attractions in generated route', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: 'full_day',
        budget: 'any',
        selectedInterests: ['history', 'religious', 'architecture', 'coastal', 'nature'],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);
      const stopIds = result.plannedStops.map((s) => s.attraction.id);
      const uniqueIds = new Set(stopIds);

      expect(stopIds.length).toBe(uniqueIds.size);
    });
  });

  // ---------------------------------------------------------------------------
  // 7. TourSession Consumability
  // ---------------------------------------------------------------------------
  describe('7. Consumability by TourSession architecture', () => {
    test('generatedTour conforms to Tour interface with valid stops', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: '3-4_hours',
        budget: 'any',
        selectedInterests: ['history'],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);
      const tour = result.generatedTour;

      expect(tour).not.toBeNull();
      expect(tour!.id).toBeDefined();
      expect(tour!.cityId).toBe('mangalore');
      expect(tour!.stops.length).toBe(result.plannedStops.length);

      for (let i = 0; i < tour!.stops.length; i++) {
        const stop = tour!.stops[i];
        expect(stop.order).toBe(i + 1);
        expect(stop.triggerRadiusMeters).toBeGreaterThan(0);
        expect(stop.attractionId).toBe(result.plannedStops[i].attraction.id);
        expect(stop.storyId).toBeDefined();
      }
    });

    test('saves and resolves custom tour from registry for useActiveTour', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: '3-4_hours',
        budget: 'any',
        selectedInterests: ['history'],
        skippedAttractions: [],
      };

      const result = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);
      const planId = savePersonalizedPlan(result);

      // Verify plan lookup
      const retrievedPlan = getPersonalizedPlan(planId);
      expect(retrievedPlan).not.toBeNull();
      expect(retrievedPlan!.id).toBe(result.id);

      // Verify tour lookup by ID (simulating useActiveTour hook)
      const retrievedTour = getTourById(result.generatedTour!.id);
      expect(retrievedTour).not.toBeNull();
      expect(retrievedTour!.id).toBe(result.generatedTour!.id);
    });
  });
});
