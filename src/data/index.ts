// =============================================================================
// Central data registry — add new cities here as they are onboarded.
// =============================================================================

import type { City, Destination, Attraction, Story, Tour } from '../types';

import {
  mangaloreCity,
  mangaloreDestination,
  mangaloreAttractions,
  mangaloreStories,
  mangaloreTours,
} from './mangalore';

export const cities: City[] = [mangaloreCity];

export const destinations: Destination[] = [mangaloreDestination];

export const attractions: Attraction[] = [...mangaloreAttractions];

export const stories: Story[] = [...mangaloreStories];

export const tours: Tour[] = [...mangaloreTours];
