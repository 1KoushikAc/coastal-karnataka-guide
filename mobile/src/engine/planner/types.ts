// mobile/src/engine/planner/types.ts
// =============================================================================
// M8: Personalized Trip Builder — Type Definitions
// =============================================================================
// Strictly typed, deterministic models for destination-agnostic trip planning.
// Completely decoupled from React Native UI for pure testability.
// =============================================================================

import type { Category, Attraction, Story, Tour, Destination } from '@shared-types/index';

/**
 * Standardized available time options for itinerary generation.
 */
export type TimeOption =
  | '1-2_hours'
  | '3-4_hours'
  | 'half_day'
  | 'full_day';

export interface TimeConstraintConfig {
  targetMinutes: number;
  maxMinutes: number;
  label: string;
  description: string;
}

export const TIME_CONSTRAINTS: Record<TimeOption, TimeConstraintConfig> = {
  '1-2_hours': {
    targetMinutes: 90,
    maxMinutes: 120,
    label: '1–2 hours',
    description: 'Quick highlights walk (1–2 stops)',
  },
  '3-4_hours': {
    targetMinutes: 210,
    maxMinutes: 240,
    label: '3–4 hours',
    description: 'Balanced morning or afternoon exploration (2–3 stops)',
  },
  'half_day': {
    targetMinutes: 300,
    maxMinutes: 360,
    label: 'Half day (~5–6 hrs)',
    description: 'Deep dive into landmarks and coastal lookouts (3–4 stops)',
  },
  'full_day': {
    targetMinutes: 450,
    maxMinutes: 540,
    label: 'Full day (~7–8 hrs)',
    description: 'Complete cross-city heritage journey at an unhurried pace',
  },
};

/**
 * Budget preference tiers.
 */
export type BudgetTier =
  | 'free'        // Only free-admission landmarks
  | 'moderate'    // Standard entry or donation-based sites
  | 'any';        // No budget restriction

export interface BudgetConfig {
  label: string;
  description: string;
}

export const BUDGET_CONFIGS: Record<BudgetTier, BudgetConfig> = {
  free: {
    label: 'Free Admission Only',
    description: 'Public monuments, temples, and beaches with ₹0 mandatory entry',
  },
  moderate: {
    label: 'Standard / Modest Budget',
    description: 'Includes sites with modest entry or voluntary token donations',
  },
  any: {
    label: 'Any Budget',
    description: 'All suitable places regardless of admission fees',
  },
};

/**
 * Traveler type choices for trip context.
 * Strictly non-judgmental: does not assume solo travelers are unsafe or groups are safe.
 */
export type TravelerType = 'solo' | 'friends';

export interface TravelerTypeConfig {
  label: string;
  description: string;
  icon: string;
}

export const TRAVELER_TYPE_CONFIGS: Record<TravelerType, TravelerTypeConfig> = {
  solo: {
    label: 'Solo traveler',
    description: 'Exploring on your own at your own pace',
    icon: '🧭',
  },
  friends: {
    label: 'Traveling with friends',
    description: 'Exploring together with friends or a group',
    icon: '👥',
  },
};

/**
 * Explicit traveler preferences for personalized trip generation.
 * Contains NO demographic, religious, or sensitive inferences.
 */
export interface TravelerPreferences {
  destinationId: string;
  availableTime: TimeOption;
  budget: BudgetTier;
  selectedInterests: Category[];
  skippedAttractions: string[];
  travelerType?: TravelerType;
}

/**
 * An ordered stop in the planned route with spatial and timing context.
 */
export interface PlannedStop {
  order: number;
  attraction: Attraction;
  story: Story | null;
  visitDurationMinutes: number;
  transitMinutesFromPrevious: number;
  distanceMetersFromPrevious: number;
  matchReasons: string[];
}

/**
 * The deterministic outcome of a trip planning run.
 */
export interface PersonalizedPlanResult {
  id: string;
  success: boolean;
  destination: Destination;
  preferences: TravelerPreferences;
  plannedStops: PlannedStop[];
  totalDurationMinutes: number;
  totalVisitMinutes: number;
  totalTransitMinutes: number;
  skippedAttractionIds: string[];
  excludedByTimeIds: string[];
  excludedByBudgetIds: string[];
  generatedTour: Tour | null;
  summary: string;
  warnings: string[];
}
