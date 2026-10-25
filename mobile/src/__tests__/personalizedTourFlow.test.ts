// mobile/src/__tests__/personalizedTourFlow.test.ts
// =============================================================================
// M8: Personalized Tour End-to-End Integration Test
// =============================================================================
// Verifies the complete lifecycle:
//   Trip Builder preferences
//   → Deterministic plan generation
//   → Personalized Tour Preview data resolution
//   → Generated Tour synthesis & in-memory registry
//   → Active Tour engine resolution & GPS Controller execution
//   → On-site Story resolution
//
// Also verifies:
//   - Destination-agnostic planning
//   - Time-constraint exclusion tracking
//   - Strict skip enforcement across all layers
//   - Preservation of curated M1 tour flow
// =============================================================================

import { destinations, attractions, stories, tours as staticTours } from '@data/index';
import type { Attraction, Story, Destination } from '@shared-types/index';
import { planPersonalizedTour } from '../engine/planner/tripPlanner';
import type { TravelerPreferences } from '../engine/planner/types';
import {
  savePersonalizedPlan,
  getPersonalizedPlan,
  getTourById,
  clearPlanRegistry,
} from '../engine/planner/registry';
import { TourLocationController } from '../engine/TourLocationController';
import { SimulatedLocationProvider } from '../engine/location/SimulatedLocationProvider';
import { getCurrentStop, getProgress } from '../engine/tourEngine';

describe('M8: Personalized Tour Flow End-to-End', () => {
  const mangaloreDest = destinations.find((d) => d.id === 'mangalore')!;

  beforeEach(() => {
    clearPlanRegistry();
  });

  // ---------------------------------------------------------------------------
  // 1. Full End-to-End Lifecycle
  // ---------------------------------------------------------------------------
  test('end-to-end flow: preferences → plan → preview → tour registry → GPS walking session → story resolution', () => {
    // 1. Traveler preferences (Trip Builder)
    const preferences: TravelerPreferences = {
      destinationId: 'mangalore',
      availableTime: '3-4_hours',
      budget: 'free',
      selectedInterests: ['history', 'religious'],
      skippedAttractions: ['tannirbhavi-beach'],
    };

    // 2. Generate personalized plan (Service)
    const plan = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);

    expect(plan.success).toBe(true);
    expect(plan.destination.id).toBe('mangalore');
    expect(plan.plannedStops.length).toBeGreaterThan(0);
    expect(plan.totalDurationMinutes).toBeLessThanOrEqual(240); // Within 3–4 hrs (max 240 mins)
    expect(plan.totalDurationMinutes).toBe(plan.totalVisitMinutes + plan.totalTransitMinutes);

    // Verify strict skip rule: tannirbhavi-beach is excluded
    expect(plan.skippedAttractionIds).toContain('tannirbhavi-beach');
    const plannedIds = plan.plannedStops.map((s) => s.attraction.id);
    expect(plannedIds).not.toContain('tannirbhavi-beach');

    // 3. Register plan & preview retrieval (PersonalizedTourPreviewScreen)
    const planId = savePersonalizedPlan(plan);
    const previewPlan = getPersonalizedPlan(planId);

    expect(previewPlan).not.toBeNull();
    expect(previewPlan!.id).toBe(plan.id);
    expect(previewPlan!.summary).toContain('Mangalore');
    expect(previewPlan!.plannedStops.length).toBe(plan.plannedStops.length);

    // Verify all planned stops have match reasons and duration info
    for (const stop of previewPlan!.plannedStops) {
      expect(stop.order).toBeGreaterThanOrEqual(1);
      expect(stop.visitDurationMinutes).toBeGreaterThan(0);
      expect(stop.matchReasons.length).toBeGreaterThan(0);
    }

    // 4. Tour resolution for Active Tour (ActiveTourScreen / useActiveTour)
    const generatedTourId = plan.generatedTour!.id;
    const activeTour = getTourById(generatedTourId);

    expect(activeTour).not.toBeNull();
    expect(activeTour!.id).toBe(generatedTourId);
    expect(activeTour!.cityId).toBe('mangalore');
    expect(activeTour!.stops.length).toBe(plan.plannedStops.length);

    // Verify tour stop structural integrity
    for (let i = 0; i < activeTour!.stops.length; i++) {
      const stop = activeTour!.stops[i];
      expect(stop.order).toBe(i + 1);
      expect(stop.triggerRadiusMeters).toBe(50);
      expect(stop.attractionId).toBe(plan.plannedStops[i].attraction.id);
      expect(stop.storyId).toBeDefined();
    }

    // 5. GPS TourLocationController execution (Active walking session)
    const firstStopAttraction = attractions.find((a) => a.id === activeTour!.stops[0].attractionId)!;
    const provider = new SimulatedLocationProvider(firstStopAttraction.coordinates);
    const controller = TourLocationController.create(activeTour!, provider, attractions);

    const session = controller.getSession();
    expect(session.hasStarted).toBe(true);
    expect(session.currentStopIndex).toBe(0);
    expect(session.isCurrentStopReached).toBe(false);
    expect(session.isComplete).toBe(false);

    const initialCurrentStop = getCurrentStop(session);
    expect(initialCurrentStop?.id).toBe(activeTour!.stops[0].id);

    // Simulate arriving at Stop 1 (teleport within trigger radius)
    provider.setLocation(firstStopAttraction.coordinates);

    expect(controller.getSession().isCurrentStopReached).toBe(true);

    // Advance to Stop 2
    if (activeTour!.stops.length > 1) {
      controller.moveToNextStop();
      expect(controller.getSession().currentStopIndex).toBe(1);
      expect(controller.getSession().isCurrentStopReached).toBe(false);
    }

    // 6. Stop Story resolution (StopStoryScreen)
    const stop0 = activeTour!.stops[0];
    const resolvedStory = stories.find((s) => s.id === stop0.storyId);
    expect(resolvedStory).toBeDefined();
    expect(resolvedStory!.narrationText.length).toBeGreaterThan(0);
    expect(resolvedStory!.narrationText).not.toContain('[PLACEHOLDER');

    controller.destroy();
  });

  // ---------------------------------------------------------------------------
  // 2. Time-Constraint Exclusion Feedback
  // ---------------------------------------------------------------------------
  describe('Time-constraint exclusion tracking', () => {
    test('populates excludedByTimeIds when time is tight (1–2 hours)', () => {
      const tightPreferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: '1-2_hours', // Max 120 minutes
        budget: 'any',
        selectedInterests: ['history', 'religious', 'coastal', 'architecture', 'nature'],
        skippedAttractions: [],
      };

      const plan = planPersonalizedTour(tightPreferences, mangaloreDest, attractions, stories);

      expect(plan.success).toBe(true);
      expect(plan.plannedStops.length).toBeLessThanOrEqual(3);
      expect(plan.totalDurationMinutes).toBeLessThanOrEqual(120);

      // Must record attractions that could not fit into the 1-2 hour walk
      expect(plan.excludedByTimeIds.length).toBeGreaterThan(0);

      // Excluded attractions must be valid destination attractions
      for (const excludedId of plan.excludedByTimeIds) {
        const found = attractions.find((a) => a.id === excludedId);
        expect(found).toBeDefined();
        expect(found!.cityId).toBe('mangalore');
      }
    });

    test('manages time constraints for full day tour without exceeding limit', () => {
      const fullDayPreferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: 'full_day', // Max 540 minutes
        budget: 'any',
        selectedInterests: ['history', 'religious', 'coastal', 'architecture', 'nature'],
        skippedAttractions: [],
      };

      const plan = planPersonalizedTour(fullDayPreferences, mangaloreDest, attractions, stories);

      expect(plan.success).toBe(true);
      expect(plan.plannedStops.length).toBeGreaterThanOrEqual(5);
      expect(plan.totalDurationMinutes).toBeLessThanOrEqual(540);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Destination Architectural Independence
  // ---------------------------------------------------------------------------
  describe('Multi-destination architectural readiness', () => {
    test('plans and registers a tour for a distinct second destination without Mangalore coupling', () => {
      const udupiDest: Destination = {
        id: 'udupi',
        name: 'Udupi',
        state: 'Karnataka',
        country: 'India',
        description: 'Vibrant temple town famed for Sri Krishna Matha and Malpe coast.',
        coordinates: { latitude: 13.3409, longitude: 74.7421 },
        attractionIds: ['udupi-krishna-temple', 'malpe-beach'],
        tourIds: ['udupi-temple-walk'],
      };

      const udupiAttractions: Attraction[] = [
        {
          id: 'udupi-krishna-temple',
          cityId: 'udupi',
          name: 'Sri Krishna Matha',
          coordinates: { latitude: 13.3409, longitude: 74.7421 },
          categories: ['religious', 'history'],
          shortDescription: '13th-century sacred temple monastery.',
          estimatedVisitDurationMinutes: 45,
          sources: ['https://example.com'],
          image: { assetKey: 'placeholder-kadri-manjunatha-temple', altText: 'Temple', isPlaceholder: true },
          admission: { isFree: true, amount: 0, currency: 'INR' },
        },
        {
          id: 'malpe-beach',
          cityId: 'udupi',
          name: 'Malpe Beach',
          coordinates: { latitude: 13.3592, longitude: 74.7042 },
          categories: ['coastal', 'nature'],
          shortDescription: 'Golden beach and port.',
          estimatedVisitDurationMinutes: 40,
          sources: ['https://example.com'],
          image: { assetKey: 'placeholder-tannirbhavi-beach', altText: 'Beach', isPlaceholder: true },
          admission: { isFree: true, amount: 0, currency: 'INR' },
        },
      ];

      const udupiStories: Story[] = [
        {
          id: 'story-udupi-krishna-temple',
          attractionId: 'udupi-krishna-temple',
          title: 'The Window of Faith',
          narrationText: 'Centuries ago, poet saint Kanakadasa composed songs at this sacred threshold.',
          sources: ['https://example.com/udupi'],
        },
        {
          id: 'story-malpe-beach',
          attractionId: 'malpe-beach',
          title: 'Where Boats Meet the Arabian Sea',
          narrationText: 'Fishermen launch their wooden craft into the dawn across Malpe bay.',
          sources: ['https://example.com/malpe'],
        },
      ];

      const preferences: TravelerPreferences = {
        destinationId: 'udupi',
        availableTime: '3-4_hours',
        budget: 'free',
        selectedInterests: ['religious', 'coastal'],
        skippedAttractions: [],
      };

      const plan = planPersonalizedTour(preferences, udupiDest, udupiAttractions, udupiStories);

      expect(plan.success).toBe(true);
      expect(plan.destination.id).toBe('udupi');
      expect(plan.plannedStops.length).toBe(2);

      for (const stop of plan.plannedStops) {
        expect(stop.attraction.cityId).toBe('udupi');
      }

      // Save to registry and verify custom tour lookup
      const planId = savePersonalizedPlan(plan);
      const customTour = getTourById(plan.generatedTour!.id);

      expect(customTour).not.toBeNull();
      expect(customTour!.cityId).toBe('udupi');
      expect(customTour!.name).toContain('Udupi');

      // Verify controller can drive the Udupi tour
      const provider = new SimulatedLocationProvider(udupiAttractions[0].coordinates);
      const controller = TourLocationController.create(customTour!, provider, udupiAttractions);
      expect(controller.getSession().hasStarted).toBe(true);
      controller.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Preservation of Curated Tour Flow
  // ---------------------------------------------------------------------------
  describe('Curated tour flow regression check', () => {
    test('static curated tour resolves directly from registry fallback and runs in controller', () => {
      const staticTour = getTourById('mangalore-heritage-walk');

      expect(staticTour).not.toBeNull();
      expect(staticTour!.id).toBe('mangalore-heritage-walk');
      expect(staticTour!.stops.length).toBe(4);

      const firstStop = staticTour!.stops[0];
      const attraction = attractions.find((a) => a.id === firstStop.attractionId)!;
      const provider = new SimulatedLocationProvider(attraction.coordinates);
      const controller = TourLocationController.create(staticTour!, provider, attractions);

      expect(controller.getSession().hasStarted).toBe(true);
      expect(controller.getSession().currentStopIndex).toBe(0);

      controller.destroy();
    });
  });
});
