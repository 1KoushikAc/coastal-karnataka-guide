// =============================================================================
// M1 Validation Script
// Checks referential integrity of the seed data without any test framework.
// Run with: npx ts-node tests/validate.ts
// =============================================================================

import { cities, attractions, stories, tours } from '../src/data';
import type { Tour } from '../src/types';

type ValidationResult = { passed: boolean; errors: string[] };

function validate(): ValidationResult {
  const errors: string[] = [];

  const cityIds = new Set(cities.map((c) => c.id));
  const attractionIds = new Set(attractions.map((a) => a.id));
  const storyIds = new Set(stories.map((s) => s.id));

  // --- 1. All attractions belong to a known city ---
  for (const attr of attractions) {
    if (!cityIds.has(attr.cityId)) {
      errors.push(
        `Attraction "${attr.id}" references unknown cityId "${attr.cityId}"`
      );
    }
  }

  // --- 2. All stories reference a known attraction ---
  for (const story of stories) {
    if (!attractionIds.has(story.attractionId)) {
      errors.push(
        `Story "${story.id}" references unknown attractionId "${story.attractionId}"`
      );
    }
  }

  // --- 3. Tour-level checks ---
  for (const tour of tours) {
    // Tour references a known city
    if (!cityIds.has(tour.cityId)) {
      errors.push(
        `Tour "${tour.id}" references unknown cityId "${tour.cityId}"`
      );
    }

    if (tour.stops.length === 0) {
      errors.push(`Tour "${tour.id}" has no stops`);
    }

    // Check stop ordering is sequential starting at 1
    const orders = tour.stops.map((s) => s.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        errors.push(
          `Tour "${tour.id}" stop ordering is not sequential. Expected ${
            i + 1
          }, got ${orders[i]}`
        );
      }
    }

    // Each stop must reference a known attraction and a known story
    for (const stop of tour.stops) {
      if (!attractionIds.has(stop.attractionId)) {
        errors.push(
          `Tour "${tour.id}" stop "${stop.id}" references unknown attractionId "${stop.attractionId}"`
        );
      }
      if (!storyIds.has(stop.storyId)) {
        errors.push(
          `Tour "${tour.id}" stop "${stop.id}" references unknown storyId "${stop.storyId}"`
        );
      }
      // Trigger radius must be positive
      if (stop.triggerRadiusMeters <= 0) {
        errors.push(
          `Tour "${tour.id}" stop "${stop.id}" has invalid triggerRadiusMeters: ${stop.triggerRadiusMeters}`
        );
      }
    }

    // Each stop's attraction must belong to the same city as the tour
    for (const stop of tour.stops) {
      const attr = attractions.find((a) => a.id === stop.attractionId);
      if (attr && attr.cityId !== tour.cityId) {
        errors.push(
          `Tour "${tour.id}" stop "${stop.id}" attraction "${attr.id}" ` +
            `belongs to city "${attr.cityId}", not tour city "${tour.cityId}"`
        );
      }
    }
  }

  return { passed: errors.length === 0, errors };
}

// --- Run and report ---
const result = validate();

console.log('\n=== Coastal Karnataka Guide — M1 Data Validation ===\n');
console.log(`Cities   : ${cities.map((c) => c.name).join(', ')}`);
console.log(`Attractions: ${attractions.length}`);
console.log(`Stories  : ${stories.length}`);
console.log(`Tours    : ${tours.length}`);
console.log(`Stops    : ${tours.reduce((n, t) => n + t.stops.length, 0)}`);
console.log('');

if (result.passed) {
  console.log('✅  All validation checks passed.\n');
  process.exit(0);
} else {
  console.error('❌  Validation failed:\n');
  result.errors.forEach((e) => console.error('   •', e));
  console.log('');
  process.exit(1);
}
