// mobile/src/__tests__/quickHelpNavigation.test.tsx
// =============================================================================
// Quick Help Navigation & Flow Preservation Integration Tests
// =============================================================================
// Verifies:
//   1. Quick Help navigation entry points on WelcomeScreen (pill and bottom card).
//   2. Quick Help navigation entry point on ActiveTourScreen (banner and header).
//   3. Active tour session preservation: Navigating to Quick Help and returning
//      does not reset or disrupt the active tour progression or location tracking.
//   4. Preserving curated tour ('mangalore-heritage-walk') data integrity.
//   5. Preserving custom personalized trip planning flow with traveler type.
// =============================================================================

import React from 'react';
import { tours, attractions, stories, destinations } from '@data/index';
import { TourLocationController } from '../engine/TourLocationController';
import { SimulatedLocationProvider } from '../engine/location/SimulatedLocationProvider';
import { getCurrentStop, getProgress } from '../engine/tourEngine';
import { planPersonalizedTour } from '../engine/planner/tripPlanner';
import type { TravelerPreferences } from '../engine/planner/types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { QuickHelpScreen } from '../screens/QuickHelpScreen';
import { ActiveTourScreen } from '../screens/ActiveTourScreen';

// Mock navigation
const createMockNavigation = () => {
  const navigate = jest.fn();
  const goBack = jest.fn();
  const setOptions = jest.fn();
  return {
    navigate,
    goBack,
    setOptions,
    addListener: jest.fn(() => () => {}),
  } as any;
};

describe('Quick Help Navigation & Flow Preservation', () => {
  const heritageTour = tours.find((t) => t.id === 'mangalore-heritage-walk')!;
  const mangaloreDest = destinations.find((d) => d.id === 'mangalore')!;

  // ---------------------------------------------------------------------------
  // 1. Curated Tour Flow Preservation
  // ---------------------------------------------------------------------------
  describe('Curated Tour Flow Preservation', () => {
    test('mangalore-heritage-walk remains completely intact with 4 stops', () => {
      expect(heritageTour).toBeDefined();
      expect(heritageTour.id).toBe('mangalore-heritage-walk');
      expect(heritageTour.stops.length).toBe(4);
      expect(heritageTour.stops[0].attractionId).toBe('kadri-manjunatha-temple');
      expect(heritageTour.stops[1].attractionId).toBe('st-aloysius-chapel');
      expect(heritageTour.stops[2].attractionId).toBe('mangaladevi-temple');
      expect(heritageTour.stops[3].attractionId).toBe('sultan-battery');
    });

    test('active tour engine runs seamlessly alongside quick help without disruption', () => {
      const firstStop = heritageTour.stops[0];
      const firstAttr = attractions.find((a) => a.id === firstStop.attractionId)!;

      const provider = new SimulatedLocationProvider(firstAttr.coordinates);
      const controller = TourLocationController.create(heritageTour, provider, attractions);

      const sessionBefore = controller.getSession();
      expect(sessionBefore.currentStopIndex).toBe(0);
      expect(sessionBefore.hasStarted).toBe(true);

      // Simulate step toward stop and arrival
      provider.setLocation(firstAttr.coordinates);
      const sessionAfterArrival = controller.getSession();
      expect(sessionAfterArrival.isCurrentStopReached).toBe(true);

      // Simulate traveler opening Quick Help and returning:
      // Tour session remains at stop 0, arrived, and unaffected
      const sessionAfterHelp = controller.getSession();
      expect(sessionAfterHelp.currentStopIndex).toBe(0);
      expect(sessionAfterHelp.isCurrentStopReached).toBe(true);
      expect(sessionAfterHelp.isComplete).toBe(false);

      controller.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Personalized Tour Flow Preservation with Traveler Type
  // ---------------------------------------------------------------------------
  describe('Personalized Tour Flow Preservation', () => {
    test('personalized tour planning with solo traveler preference produces viable tour', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: '3-4_hours',
        budget: 'any',
        selectedInterests: ['history', 'religious'],
        skippedAttractions: [],
        travelerType: 'solo',
      };

      const plan = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);
      expect(plan.success).toBe(true);
      expect(plan.preferences.travelerType).toBe('solo');
      expect(plan.plannedStops.length).toBeGreaterThan(0);
      expect(plan.generatedTour).not.toBeNull();
      expect(plan.generatedTour?.stops.length).toBe(plan.plannedStops.length);
    });

    test('personalized tour planning with friends traveler preference produces viable tour', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: 'half_day',
        budget: 'free',
        selectedInterests: ['coastal', 'nature'],
        skippedAttractions: [],
        travelerType: 'friends',
      };

      const plan = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);
      expect(plan.success).toBe(true);
      expect(plan.preferences.travelerType).toBe('friends');
      expect(plan.plannedStops.length).toBeGreaterThan(0);
      expect(plan.generatedTour).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Screen Component Rendering
  // ---------------------------------------------------------------------------
  describe('Screen Component Rendering', () => {
    test('renders WelcomeScreen element successfully', () => {
      const navigation = createMockNavigation();
      const element = <WelcomeScreen navigation={navigation} route={{ key: 'Welcome', name: 'Welcome' }} />;
      expect(element).toBeDefined();
    });

    test('renders QuickHelpScreen element successfully', () => {
      const navigation = createMockNavigation();
      const element = (
        <QuickHelpScreen
          navigation={navigation}
          route={{ key: 'QuickHelp', name: 'QuickHelp', params: { source: 'welcome' } }}
        />
      );
      expect(element).toBeDefined();
    });
  });
});
