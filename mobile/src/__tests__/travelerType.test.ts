// mobile/src/__tests__/travelerType.test.ts
// =============================================================================
// Traveler Type Preference & Non-Biased Itinerary Planning Tests
// =============================================================================
// Verifies:
//   1. TravelerType definitions ('solo' | 'friends') and UI configuration labels.
//   2. Trip preferences correctly capture and store travelerType.
//   3. Non-biased itinerary planning: Itinerary recommendations are NOT
//      altered or skewed based on unsupported assumptions about solo vs group safety.
//   4. Plan persistence preserves travelerType across serialization & hydration.
//   5. Defensive validation enforces valid travelerType values ('solo', 'friends', undefined).
//   6. User's default traveler type preference is persisted across sessions.
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TRAVELER_TYPE_CONFIGS,
  type TravelerPreferences,
  type TravelerType,
  type PersonalizedPlanResult,
} from '../engine/planner/types';
import { planPersonalizedTour } from '../engine/planner/tripPlanner';
import {
  savePlanToStorage,
  loadPlansFromStorage,
  isValidPersonalizedPlan,
  saveStoredTravelerType,
  loadStoredTravelerType,
  STORAGE_KEY_TRAVELER_TYPE,
  clearPlansFromStorage,
} from '../engine/planner/storage';
import { destinations, attractions, stories } from '@data/index';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('Traveler Type Preferences & Deterministic Planning', () => {
  const mangaloreDest = destinations.find((d) => d.id === 'mangalore')!;

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('1. Configuration & Labels', () => {
    test('defines non-judgmental configurations for solo and friends', () => {
      expect(TRAVELER_TYPE_CONFIGS.solo).toBeDefined();
      expect(TRAVELER_TYPE_CONFIGS.solo.label).toBe('Solo traveler');
      expect(TRAVELER_TYPE_CONFIGS.solo.description).toContain('own pace');
      expect(TRAVELER_TYPE_CONFIGS.solo.icon).toBe('🧭');

      expect(TRAVELER_TYPE_CONFIGS.friends).toBeDefined();
      expect(TRAVELER_TYPE_CONFIGS.friends.label).toBe('Traveling with friends');
      expect(TRAVELER_TYPE_CONFIGS.friends.description).toContain('friends or a group');
      expect(TRAVELER_TYPE_CONFIGS.friends.icon).toBe('👥');
    });
  });

  describe('2. Deterministic Planning & Preservation in Preferences', () => {
    test('preserves travelerType in plan result when set to "solo"', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: '3-4_hours',
        budget: 'any',
        selectedInterests: ['history'],
        skippedAttractions: [],
        travelerType: 'solo',
      };

      const plan = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);
      expect(plan.success).toBe(true);
      expect(plan.preferences.travelerType).toBe('solo');
    });

    test('preserves travelerType in plan result when set to "friends"', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: '3-4_hours',
        budget: 'any',
        selectedInterests: ['history'],
        skippedAttractions: [],
        travelerType: 'friends',
      };

      const plan = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);
      expect(plan.success).toBe(true);
      expect(plan.preferences.travelerType).toBe('friends');
    });

    test('preserves undefined travelerType when skipped or optional', () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: '3-4_hours',
        budget: 'any',
        selectedInterests: ['history'],
        skippedAttractions: [],
        travelerType: undefined,
      };

      const plan = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);
      expect(plan.success).toBe(true);
      expect(plan.preferences.travelerType).toBeUndefined();
    });

    test('does NOT change itinerary recommendations based on unsupported assumptions', () => {
      // Rule: Do not assume that solo travelers are always unsafe or groups always safe.
      // Do not change itinerary recommendations based on unsupported assumptions.
      const basePreferences: Omit<TravelerPreferences, 'travelerType'> = {
        destinationId: 'mangalore',
        availableTime: 'full_day',
        budget: 'any',
        selectedInterests: ['history', 'religious', 'coastal'],
        skippedAttractions: [],
      };

      const planSolo = planPersonalizedTour(
        { ...basePreferences, travelerType: 'solo' },
        mangaloreDest,
        attractions,
        stories,
      );

      const planFriends = planPersonalizedTour(
        { ...basePreferences, travelerType: 'friends' },
        mangaloreDest,
        attractions,
        stories,
      );

      const planUnspecified = planPersonalizedTour(
        { ...basePreferences, travelerType: undefined },
        mangaloreDest,
        attractions,
        stories,
      );

      // Both should yield the exact same recommended stops and visit order
      expect(planSolo.plannedStops.length).toBe(planFriends.plannedStops.length);
      expect(planSolo.plannedStops.length).toBe(planUnspecified.plannedStops.length);

      for (let i = 0; i < planSolo.plannedStops.length; i++) {
        expect(planSolo.plannedStops[i].attraction.id).toBe(
          planFriends.plannedStops[i].attraction.id,
        );
        expect(planSolo.plannedStops[i].attraction.id).toBe(
          planUnspecified.plannedStops[i].attraction.id,
        );
      }

      expect(planSolo.totalVisitMinutes).toBe(planFriends.totalVisitMinutes);
      expect(planSolo.totalTransitMinutes).toBe(planFriends.totalTransitMinutes);
    });
  });

  describe('3. Local Storage Persistence & Validation', () => {
    test('persists and loads plan with travelerType', async () => {
      const preferences: TravelerPreferences = {
        destinationId: 'mangalore',
        availableTime: '1-2_hours',
        budget: 'free',
        selectedInterests: ['religious'],
        skippedAttractions: [],
        travelerType: 'solo',
      };

      const plan = planPersonalizedTour(preferences, mangaloreDest, attractions, stories);
      await savePlanToStorage(plan);

      const loadedPlans = await loadPlansFromStorage();
      expect(loadedPlans.length).toBe(1);
      expect(loadedPlans[0].id).toBe(plan.id);
      expect(loadedPlans[0].preferences.travelerType).toBe('solo');
    });

    test('validates candidate plans strictly: accepts valid or undefined travelerType', () => {
      const plan = planPersonalizedTour(
        {
          destinationId: 'mangalore',
          availableTime: '1-2_hours',
          budget: 'free',
          selectedInterests: ['history'],
          skippedAttractions: [],
          travelerType: 'friends',
        },
        mangaloreDest,
        attractions,
        stories,
      );

      expect(isValidPersonalizedPlan(plan)).toBe(true);

      const planWithoutType = {
        ...plan,
        preferences: {
          ...plan.preferences,
          travelerType: undefined,
        },
      };
      expect(isValidPersonalizedPlan(planWithoutType)).toBe(true);
    });

    test('rejects candidate plan with malformed/unsupported travelerType string', () => {
      const plan = planPersonalizedTour(
        {
          destinationId: 'mangalore',
          availableTime: '1-2_hours',
          budget: 'free',
          selectedInterests: ['history'],
          skippedAttractions: [],
        },
        mangaloreDest,
        attractions,
        stories,
      );

      const malformedPlan = {
        ...plan,
        preferences: {
          ...plan.preferences,
          travelerType: 'unsupported_type_value',
        },
      };

      expect(isValidPersonalizedPlan(malformedPlan)).toBe(false);
    });

    test('stores and loads user preferred traveler type preference', async () => {
      expect(await loadStoredTravelerType()).toBeUndefined();

      await saveStoredTravelerType('solo');
      expect(await loadStoredTravelerType()).toBe('solo');

      await saveStoredTravelerType('friends');
      expect(await loadStoredTravelerType()).toBe('friends');

      await saveStoredTravelerType(undefined);
      expect(await loadStoredTravelerType()).toBeUndefined();
    });
  });
});
