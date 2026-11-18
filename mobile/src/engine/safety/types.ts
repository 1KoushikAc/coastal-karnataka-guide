// mobile/src/engine/safety/types.ts
// =============================================================================
// Quick Help & Safety Types
// =============================================================================
// Pure models for polite responses, public place guidance, trusted contacts,
// and verified emergency services.
// =============================================================================

export interface RespectDistinction {
  withRespect: string;
  withoutRespect: string;
}

export interface GenderAlternatives {
  male: string;
  female: string;
}

export interface PoliteResponseItem {
  id: string;
  english: string;
  phrase: string;
  tulu: string;
  context?: string;
  respectDistinction?: RespectDistinction;
  genderAlternatives?: GenderAlternatives;
  intendedFor?: 'all' | 'solo' | 'friends';
}

export interface UsefulTuluExpression {
  id: string;
  tulu: string;
  english: string;
  context?: string;
}

export interface SaferPlaceGuideline {
  id: string;
  category: 'shops_cafes' | 'official_staff' | 'well_lit_streets' | 'transit_hubs';
  title: string;
  guidance: string;
  examples: string[];
  icon: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  category: 'national' | 'police' | 'medical' | 'helpline';
  description: string;
  authoritySource: string;
  isNational: boolean;
  priorityOrder: number;
}

export interface TrustedContact {
  name: string;
  phoneNumber: string;
  relationship?: string;
}

export type QuickHelpTab = 'responses' | 'places' | 'contacts' | 'emergency';
