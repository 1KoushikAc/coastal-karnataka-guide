// mobile/src/engine/safety/saferPlaces.ts
// =============================================================================
// Safer Public Places Guidance
// =============================================================================
// Practical, realistic advice for relocating to populated, staffed environments
// in Mangaluru and Coastal Karnataka when feeling uneasy or needing support.
//
// Safety Disclaimer:
//   While Mangaluru is generally welcoming, no city or location has zero danger.
//   The app cannot guarantee personal safety or dispatch physical assistance.
//   Always trust your instincts and relocate early if something feels off.
// =============================================================================

import type { SaferPlaceGuideline } from './types';

export const SAFETY_GENERAL_DISCLAIMER =
  'Mangaluru is a vibrant coastal city, but no destination has zero risk and personal safety cannot be guaranteed. Always trust your instincts. If a situation feels uncomfortable or uncertain, move early to a busy public area or contact emergency services directly.';

export const SAFER_PLACE_GUIDELINES: SaferPlaceGuideline[] = [
  {
    id: 'sp-staffed-commercial',
    category: 'shops_cafes',
    title: 'Enter a Staffed Shop or Café',
    guidance:
      'Step inside an open, brightly lit business with active counter staff. Being near employees and customers immediately diffuses unwanted attention.',
    examples: [
      'Café counters or bakery shops',
      'Operating retail stores and supermarkets',
      'Pharmacies or medical dispensaries',
    ],
    icon: '🏬',
  },
  {
    id: 'sp-official-facilities',
    category: 'official_staff',
    title: 'Head to Hotel Receptions & Temple Desks',
    guidance:
      'Hotel lobbies, guesthouses, and heritage site administrative offices are staffed around the clock and have security personnel present.',
    examples: [
      'Hotel front desks or lodge lobbies',
      'Temple administrative offices and shoe-keeping counters',
      'Museum ticket booths or visitor information points',
    ],
    icon: '🏨',
  },
  {
    id: 'sp-main-roads',
    category: 'well_lit_streets',
    title: 'Stay on Main Commercial Thoroughfares',
    guidance:
      'Avoid quiet alleyways, deserted back lanes, or unlit beach stretches after sunset. Stick to main corridors with vehicle movement and open storefronts.',
    examples: [
      'KS Rao Road & Hampankatta market corridors',
      'Balmatta Road & Lighthouse Hill Road',
      'Commercial crossroads with street lighting',
    ],
    icon: '🚶',
  },
  {
    id: 'sp-transit-points',
    category: 'transit_hubs',
    title: 'Approach Official Transit Hubs & Traffic Booths',
    guidance:
      'Transportation hubs have steady police presence, station superintendents, and transport staff.',
    examples: [
      'Traffic police assistance kiosks',
      'KSRTC State Bus Stand (Bejai) or City Bus Stand (State Bank)',
      'Mangaluru Central or Junction Railway Stations',
    ],
    icon: '🚉',
  },
];
