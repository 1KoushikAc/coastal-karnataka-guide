// src/types/index.ts
// =============================================================================
// Coastal Karnataka Guide — Core Data Model Types
// =============================================================================
// Strict, minimal TypeScript types for the application data layer.
// Designed to be serialisable (JSON-safe) and portable to any platform.
// =============================================================================

// ---------------------------------------------------------------------------
// Geographic Coordinates
// Standard WGS-84 decimal degrees.
// ---------------------------------------------------------------------------

export interface Coordinates {
  latitude: number;   // e.g. 12.8876
  longitude: number;  // e.g. 74.8429
}

// ---------------------------------------------------------------------------
// Category / Interest
// A curated list of themes a traveller might be interested in.
// ---------------------------------------------------------------------------

export type Category =
  | 'history'
  | 'religious'
  | 'nature'
  | 'food'
  | 'architecture'
  | 'coastal'
  | 'culture';

// ---------------------------------------------------------------------------
// ImageReference
// Standard reference for attraction photos and tour hero assets.
// Points to an abstract assetKey resolved by the platform asset registry.
// ---------------------------------------------------------------------------

export interface ImageReference {
  /** Identifier or relative path key for the asset (e.g. "placeholder-kadri-manjunatha-temple") */
  assetKey: string;
  /** Accessible description / caption */
  altText: string;
  /** True when using an identified temporary placeholder rather than verified production photo */
  isPlaceholder?: boolean;
}

// ---------------------------------------------------------------------------
// City
// Top-level geographic grouping. One city per data folder.
// ---------------------------------------------------------------------------

export interface City {
  id: string;          // e.g. "mangalore"
  name: string;        // e.g. "Mangalore"
  state: string;       // e.g. "Karnataka"
  country: string;     // e.g. "India"
  coordinates: Coordinates; // approximate city centre
}

// ---------------------------------------------------------------------------
// Attraction
// A physical location the traveller can visit.
// ---------------------------------------------------------------------------

export interface Attraction {
  id: string;                        // e.g. "kadri-temple"
  cityId: string;                    // foreign key → City.id
  name: string;
  coordinates: Coordinates;
  categories: Category[];
  shortDescription: string;          // 1–2 sentences shown on the map card
  estimatedVisitDurationMinutes: number;
  sources: string[];                 // URLs or book references for verification
  image: ImageReference;             // Photo or placeholder image reference
}

// ---------------------------------------------------------------------------
// Story
// The narration content delivered when a traveller arrives at an attraction.
// ---------------------------------------------------------------------------

export interface Story {
  id: string;                        // e.g. "kadri-temple-story"
  attractionId: string;              // foreign key → Attraction.id
  title: string;
  narrationText: string;             // full audio script — read aloud by the guide
  sources: string[];                 // URLs or references backing the facts
}

// ---------------------------------------------------------------------------
// TourStop
// One stop within a guided tour. Links a tour to an attraction + story.
// ---------------------------------------------------------------------------

export interface TourStop {
  id: string;
  attractionId: string;              // foreign key → Attraction.id
  order: number;                     // 1-based position in the tour
  triggerRadiusMeters: number;       // GPS proximity to auto-trigger the story
  storyId: string;                   // foreign key → Story.id
}

// ---------------------------------------------------------------------------
// Tour
// A curated, ordered sequence of stops around a theme.
// ---------------------------------------------------------------------------

export interface Tour {
  id: string;                        // e.g. "mangalore-heritage-walk"
  cityId: string;                    // foreign key → City.id
  name: string;
  description: string;
  category: Category;
  estimatedDurationMinutes: number;
  stops: TourStop[];
  heroImage?: ImageReference;        // Hero image for tour preview and cards
}
