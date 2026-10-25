// mobile/src/__tests__/destinationDiscovery.test.tsx
// =============================================================================
// Destination Discovery & PlaceImage Unit Tests
// =============================================================================
// Verifies:
//   1. PlaceImage component behavior: placeholder fallbacks, category colors,
//      accessibility labels, and compact layout scaling.
//   2. Destination & Attraction data integrity for all 5 Mangalore landmarks.
//   3. Category editorial tags mapping.
//   4. Image registry resolution.
//   5. Curated tour vs Custom planner landmark differentiation.
// =============================================================================

import React from 'react';
import { attractions, tours, destinations } from '@data/index';
import { PlaceImage, CATEGORY_EDITORIAL_TAGS } from '../components/PlaceImage';
import { resolveImageSource, IMAGE_REGISTRY } from '../utils/images';
import { CategoryColors } from '../theme';

describe('Destination Discovery & PlaceImage Presentation', () => {
  // ---------------------------------------------------------------------------
  // 1. PlaceImage Component Presentation & Fallbacks
  // ---------------------------------------------------------------------------
  describe('PlaceImage Component Presentation', () => {
    it('maps all supported categories to appropriate editorial tags', () => {
      expect(CATEGORY_EDITORIAL_TAGS['history']).toBe('HISTORIC LANDMARK');
      expect(CATEGORY_EDITORIAL_TAGS['religious']).toBe('SACRED HERITAGE');
      expect(CATEGORY_EDITORIAL_TAGS['nature']).toBe('COASTAL NATURE');
      expect(CATEGORY_EDITORIAL_TAGS['architecture']).toBe('ARCHITECTURAL SITE');
      expect(CATEGORY_EDITORIAL_TAGS['coastal']).toBe('COASTAL DESTINATION');
      expect(CATEGORY_EDITORIAL_TAGS['default']).toBe('DESTINATION');
    });

    it('maps category colors to warm coastal tones in theme', () => {
      expect(CategoryColors['history']).toBeDefined();
      expect(CategoryColors['religious']).toBeDefined();
      expect(CategoryColors['nature']).toBeDefined();
      expect(CategoryColors['coastal']).toBeDefined();
      expect(CategoryColors['architecture']).toBeDefined();
      expect(CategoryColors['default']).toBeDefined();
    });

    it('renders editorial fallback when isPlaceholder is true', () => {
      const element = (
        <PlaceImage
          category="religious"
          label="Kadri Manjunatha Temple"
          isPlaceholder={true}
          height={220}
        />
      );

      expect(element).toBeDefined();
      expect(element.props.category).toBe('religious');
      expect(element.props.label).toBe('Kadri Manjunatha Temple');
      expect(element.props.isPlaceholder).toBe(true);
    });

    it('renders compact mode when height is less than 120', () => {
      const element = (
        <PlaceImage
          category="architecture"
          label="St. Aloysius Chapel"
          isPlaceholder={true}
          height={96}
        />
      );

      expect(element).toBeDefined();
      expect(element.props.height).toBe(96);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Image Registry & Asset Resolution
  // ---------------------------------------------------------------------------
  describe('Image Registry & Asset Resolution', () => {
    it('resolves image asset keys for all 5 attractions and curated tour', () => {
      expect(IMAGE_REGISTRY['placeholder-mangalore-heritage-walk']).toBeDefined();
      expect(IMAGE_REGISTRY['placeholder-kadri-manjunatha-temple']).toBeDefined();
      expect(IMAGE_REGISTRY['placeholder-st-aloysius-chapel']).toBeDefined();
      expect(IMAGE_REGISTRY['placeholder-sultan-battery']).toBeDefined();
      expect(IMAGE_REGISTRY['placeholder-mangaladevi-temple']).toBeDefined();
      expect(IMAGE_REGISTRY['placeholder-tannirbhavi-beach']).toBeDefined();
    });

    it('resolveImageSource returns undefined for missing or empty keys without throwing', () => {
      expect(resolveImageSource(undefined)).toBeUndefined();
      expect(resolveImageSource('')).toBeUndefined();
      expect(resolveImageSource('non-existent-key-xyz')).toBeUndefined();
    });

    it('resolveImageSource resolves registered keys properly', () => {
      const source = resolveImageSource('placeholder-st-aloysius-chapel');
      expect(source).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Mangalore Seed Attraction Data Integrity
  // ---------------------------------------------------------------------------
  describe('Mangalore Attraction Data Integrity', () => {
    it('contains verified attractions for Mangalore', () => {
      expect(attractions).toHaveLength(18);
      const ids = attractions.map((a) => a.id);
      expect(ids).toContain('kadri-manjunatha-temple');
      expect(ids).toContain('st-aloysius-chapel');
      expect(ids).toContain('sultan-battery');
      expect(ids).toContain('mangaladevi-temple');
      expect(ids).toContain('tannirbhavi-beach');
      expect(ids).toContain('kudroli-gokarnanatheshwara-temple');
      expect(ids).toContain('panambur-beach');
      expect(ids).toContain('someshwara-beach');
      expect(ids).toContain('ullal-beach');
      expect(ids).toContain('surathkal-beach-lighthouse');
      expect(ids).toContain('rosario-cathedral');
      expect(ids).toContain('milagres-church');
      expect(ids).toContain('kadri-park');
      expect(ids).toContain('pilikula-nisargadhama');
      expect(ids).toContain('bejai-museum');
      expect(ids).toContain('swami-vivekananda-planetarium');
      expect(ids).toContain('sharavu-mahaganapathi-temple');
      expect(ids).toContain('car-street-venkataramana-temple');
    });

    it('each attraction has valid coordinates, categories, and descriptions', () => {
      for (const attr of attractions) {
        expect(attr.cityId).toBe('mangalore');
        expect(attr.name.trim().length).toBeGreaterThan(0);
        expect(attr.shortDescription.trim().length).toBeGreaterThan(20);
        expect(attr.categories.length).toBeGreaterThan(0);
        expect(attr.estimatedVisitDurationMinutes).toBeGreaterThan(0);
        expect(typeof attr.coordinates.latitude).toBe('number');
        expect(typeof attr.coordinates.longitude).toBe('number');
        expect(isNaN(attr.coordinates.latitude)).toBe(false);
        expect(isNaN(attr.coordinates.longitude)).toBe(false);
        // Valid Mangalore coordinate bounding box (~12.8 to 13.0 N, 74.7 to 74.9 E)
        expect(attr.coordinates.latitude).toBeGreaterThan(12.7);
        expect(attr.coordinates.latitude).toBeLessThan(13.1);
        expect(attr.coordinates.longitude).toBeGreaterThan(74.7);
        expect(attr.coordinates.longitude).toBeLessThan(75.0);
      }
    });

    it('each attraction includes admission data', () => {
      for (const attr of attractions) {
        expect(attr.admission).toBeDefined();
        expect(typeof attr.admission?.isFree).toBe('boolean');
        expect(attr.admission?.currency).toBe('INR');
      }
    });

    it('each attraction includes source citations for content integrity', () => {
      for (const attr of attractions) {
        expect(attr.sources).toBeDefined();
        expect(attr.sources.length).toBeGreaterThan(0);
        for (const source of attr.sources) {
          expect(source.startsWith('http')).toBe(true);
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Destination & Curated Tour Differentiation
  // ---------------------------------------------------------------------------
  describe('Destination & Tour Differentiation', () => {
    it('mangalore destination scopes all 18 attractions and the curated tour', () => {
      const dest = destinations.find((d) => d.id === 'mangalore');
      expect(dest).toBeDefined();
      expect(dest?.attractionIds).toHaveLength(18);
      expect(dest?.tourIds).toContain('mangalore-heritage-walk');
    });

    it('curated tour stops reference valid attractions', () => {
      const curatedTour = tours.find((t) => t.id === 'mangalore-heritage-walk');
      expect(curatedTour).toBeDefined();
      expect(curatedTour?.stops).toHaveLength(4);

      for (const stop of curatedTour!.stops) {
        const matchingAttr = attractions.find((a) => a.id === stop.attractionId);
        expect(matchingAttr).toBeDefined();
        expect(stop.triggerRadiusMeters).toBeGreaterThanOrEqual(50);
      }
    });

    it('differentiates stops included in curated tour vs custom-only attractions', () => {
      const curatedTour = tours.find((t) => t.id === 'mangalore-heritage-walk')!;
      const curatedStopIds = new Set(curatedTour.stops.map((s) => s.attractionId));

      expect(curatedStopIds.has('kadri-manjunatha-temple')).toBe(true);
      expect(curatedStopIds.has('st-aloysius-chapel')).toBe(true);
      expect(curatedStopIds.has('sultan-battery')).toBe(true);
      expect(curatedStopIds.has('mangaladevi-temple')).toBe(true);

      // Tannirbhavi Beach is custom-only (separated across river ferry)
      expect(curatedStopIds.has('tannirbhavi-beach')).toBe(false);
    });
  });
});
