// =============================================================================
// Coastal Karnataka Guide — Core TypeScript Types
// =============================================================================
// These interfaces define the data model for the entire application.
// Mangalore is the first city, but the model supports any number of cities.
// =============================================================================

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// ---------------------------------------------------------------------------
// Category
// A union of known interest tags. Extend as new categories are needed.
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
}
