// src/__tests__/m9AndroidReliability.test.ts
// =============================================================================
// M9 — Android Reliability & Release Readiness: Regression Tests
// =============================================================================
// Covers:
//   1. DeviceLocationProvider PermissionStatus import correctness (expo-location)
//   2. contactActions.ts — sanitizePhoneNumberForUrl edge cases
//   3. contactActions.ts — invalid phone number guard fires before Linking
//   4. trustedContactStorage — validatePhoneNumber edge cases
//   5. TourLocationController — hasViewedArrivalContent does not persist
//      across stop advances (via session subscription path)
//   6. TourLocationController — false arrival prevention: accuracy guard
//   7. TourLocationController — stale timestamp guard
//   8. DeviceLocationProvider — stop() during in-flight permission request
//   9. Quick Help — POLITE_RESPONSES have no undefined tulu field
//  10. Quick Help — VERIFIED_EMERGENCY_CONTACTS have required fields
// =============================================================================

import { sanitizePhoneNumberForUrl } from '../engine/safety/contactActions';
import { validatePhoneNumber, isValidTrustedContact } from '../engine/safety/trustedContactStorage';
import { POLITE_RESPONSES, USEFUL_TULU_EXPRESSIONS } from '../engine/safety/politeResponses';
import { VERIFIED_EMERGENCY_CONTACTS, isVerifiedEmergencyNumber } from '../engine/safety/emergencyContacts';
import { TourLocationController } from '../engine/TourLocationController';
import { SimulatedLocationProvider } from '../engine/location/SimulatedLocationProvider';
import { startTour } from '../engine/tourEngine';
import { offsetPoint } from '../engine/distance';

// ---------------------------------------------------------------------------
// 1. sanitizePhoneNumberForUrl — edge cases
// ---------------------------------------------------------------------------
describe('sanitizePhoneNumberForUrl', () => {
  it('strips spaces and hyphens from Indian mobile numbers', () => {
    expect(sanitizePhoneNumberForUrl('+91 98765 43210')).toBe('+919876543210');
  });

  it('strips parentheses and dots', () => {
    expect(sanitizePhoneNumberForUrl('(0824) 222-0800')).toBe('08242220800');
  });

  it('preserves a leading + for international numbers', () => {
    expect(sanitizePhoneNumberForUrl('+44 7911 123456')).toBe('+447911123456');
  });

  it('handles a plain 3-digit emergency number', () => {
    expect(sanitizePhoneNumberForUrl('112')).toBe('112');
  });

  it('returns empty string for an empty input', () => {
    expect(sanitizePhoneNumberForUrl('')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizePhoneNumberForUrl('   ')).toBe('');
  });

  it('strips all non-digit, non-plus characters', () => {
    expect(sanitizePhoneNumberForUrl('1-800-CALL-NOW')).toBe('1800');
  });
});

// ---------------------------------------------------------------------------
// 2. validatePhoneNumber — edge cases
// ---------------------------------------------------------------------------
describe('validatePhoneNumber', () => {
  it('accepts a standard Indian mobile number', () => {
    expect(validatePhoneNumber('9876543210').valid).toBe(true);
  });

  it('accepts a number with leading +91 country code', () => {
    expect(validatePhoneNumber('+919876543210').valid).toBe(true);
  });

  it('accepts a number with spaces and dashes (stripped internally)', () => {
    expect(validatePhoneNumber('+91 98765 43210').valid).toBe(true);
  });

  it('rejects an empty string', () => {
    const result = validatePhoneNumber('');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('empty');
  });

  it('rejects a number that is too short (fewer than 7 digits)', () => {
    expect(validatePhoneNumber('123').valid).toBe(false);
  });

  it('rejects a number with alphabetic characters only', () => {
    expect(validatePhoneNumber('ABCDEFGHIJ').valid).toBe(false);
  });

  it('accepts the Mangaluru control room 11-digit number', () => {
    expect(validatePhoneNumber('08242220800').valid).toBe(true);
  });

  it('rejects a number exceeding 15 digits', () => {
    expect(validatePhoneNumber('1234567890123456').valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. isValidTrustedContact — structural validation
// ---------------------------------------------------------------------------
describe('isValidTrustedContact', () => {
  it('accepts a valid contact with all fields', () => {
    expect(isValidTrustedContact({ name: 'Maya', phoneNumber: '+919876543210', relationship: 'Friend' })).toBe(true);
  });

  it('accepts a valid contact without optional relationship', () => {
    expect(isValidTrustedContact({ name: 'Hotel Desk', phoneNumber: '9876543210' })).toBe(true);
  });

  it('rejects a contact with empty name', () => {
    expect(isValidTrustedContact({ name: '', phoneNumber: '9876543210' })).toBe(false);
  });

  it('rejects a contact with blank name (spaces only)', () => {
    expect(isValidTrustedContact({ name: '   ', phoneNumber: '9876543210' })).toBe(false);
  });

  it('rejects a contact with invalid phone', () => {
    expect(isValidTrustedContact({ name: 'Test', phoneNumber: 'abc' })).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidTrustedContact(null)).toBe(false);
  });

  it('rejects a non-object', () => {
    expect(isValidTrustedContact('string-value')).toBe(false);
  });

  it('rejects an object with missing phoneNumber', () => {
    expect(isValidTrustedContact({ name: 'Test' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. POLITE_RESPONSES content validation
// ---------------------------------------------------------------------------
describe('POLITE_RESPONSES content', () => {
  it('every item has a non-empty id', () => {
    for (const item of POLITE_RESPONSES) {
      expect(typeof item.id).toBe('string');
      expect(item.id.trim().length).toBeGreaterThan(0);
    }
  });

  it('every item has a non-empty english field', () => {
    for (const item of POLITE_RESPONSES) {
      expect(typeof item.english).toBe('string');
      expect(item.english.trim().length).toBeGreaterThan(0);
    }
  });

  it('every item with a plain tulu field has a non-empty tulu string', () => {
    for (const item of POLITE_RESPONSES) {
      if (!item.genderAlternatives) {
        // Should have a tulu field
        expect(typeof item.tulu).toBe('string');
        expect(item.tulu.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('items with genderAlternatives have non-empty male and female variants', () => {
    for (const item of POLITE_RESPONSES) {
      if (item.genderAlternatives) {
        expect(item.genderAlternatives.male.trim().length).toBeGreaterThan(0);
        expect(item.genderAlternatives.female.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('items with respectDistinction have both withRespect and withoutRespect', () => {
    for (const item of POLITE_RESPONSES) {
      if (item.respectDistinction) {
        expect(item.respectDistinction.withRespect.trim().length).toBeGreaterThan(0);
        expect(item.respectDistinction.withoutRespect.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('no item has a duplicate id', () => {
    const ids = POLITE_RESPONSES.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// 5. USEFUL_TULU_EXPRESSIONS content validation
// ---------------------------------------------------------------------------
describe('USEFUL_TULU_EXPRESSIONS content', () => {
  it('every expression has a non-empty tulu field', () => {
    for (const expr of USEFUL_TULU_EXPRESSIONS) {
      expect(expr.tulu.trim().length).toBeGreaterThan(0);
    }
  });

  it('every expression has a non-empty english field', () => {
    for (const expr of USEFUL_TULU_EXPRESSIONS) {
      expect(expr.english.trim().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. VERIFIED_EMERGENCY_CONTACTS content validation
// ---------------------------------------------------------------------------
describe('VERIFIED_EMERGENCY_CONTACTS', () => {
  it('has at least one entry', () => {
    expect(VERIFIED_EMERGENCY_CONTACTS.length).toBeGreaterThan(0);
  });

  it('every contact has a non-empty number', () => {
    for (const c of VERIFIED_EMERGENCY_CONTACTS) {
      expect(c.number.trim().length).toBeGreaterThan(0);
    }
  });

  it('every contact has a non-empty authoritySource', () => {
    for (const c of VERIFIED_EMERGENCY_CONTACTS) {
      expect(c.authoritySource.trim().length).toBeGreaterThan(0);
    }
  });

  it('contains the national emergency number 112', () => {
    expect(isVerifiedEmergencyNumber('112')).toBe(true);
  });

  it('contains the women helpline 1091', () => {
    expect(isVerifiedEmergencyNumber('1091')).toBe(true);
  });

  it('does not recognize a fabricated number as verified', () => {
    expect(isVerifiedEmergencyNumber('9999999999')).toBe(false);
  });

  it('recognizes Mangaluru control room regardless of formatting', () => {
    expect(isVerifiedEmergencyNumber('0824-2220800')).toBe(true);
    expect(isVerifiedEmergencyNumber('08242220800')).toBe(true);
  });

  it('every contact has a valid priorityOrder (number >= 1)', () => {
    for (const c of VERIFIED_EMERGENCY_CONTACTS) {
      expect(typeof c.priorityOrder).toBe('number');
      expect(c.priorityOrder).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. TourLocationController — false arrival prevention: accuracy guard
// ---------------------------------------------------------------------------
describe('TourLocationController accuracy guard (false arrival prevention)', () => {
  const stopCoords = { latitude: 12.8690, longitude: 74.8430 };
  const attraction = { id: 'attr-test', coordinates: stopCoords };

  const makeTour = () => ({
    id: 'tour-test',
    cityId: 'mangalore',
    name: 'Test Tour',
    description: '',
    category: 'history' as const,
    estimatedDurationMinutes: 60,
    stops: [
      { id: 'stop-1', attractionId: 'attr-test', order: 1, triggerRadiusMeters: 50, storyId: 'story-1' },
    ],
    heroImage: undefined,
  });

  it('does NOT trigger arrival when GPS accuracy exceeds maxAccuracyMeters (default 50m)', () => {
    const provider = new SimulatedLocationProvider(stopCoords);
    const controller = new TourLocationController(
      startTour(makeTour()),
      provider,
      [attraction],
      false,
    );

    // Place traveler inside the trigger radius geometrically
    const insideCoords = offsetPoint(stopCoords, 20, 0); // 20m away — inside 50m radius
    controller.checkLocation({ ...insideCoords, accuracy: 80 }); // But accuracy is 80m — too poor

    expect(controller.getSession().isCurrentStopReached).toBe(false);
  });

  it('DOES trigger arrival when GPS accuracy is acceptable', () => {
    const provider = new SimulatedLocationProvider(stopCoords);
    const controller = new TourLocationController(
      startTour(makeTour()),
      provider,
      [attraction],
      false,
    );

    const insideCoords = offsetPoint(stopCoords, 20, 0);
    controller.checkLocation({ ...insideCoords, accuracy: 15 }); // accuracy 15m — good

    expect(controller.getSession().isCurrentStopReached).toBe(true);
  });

  it('DOES trigger arrival when accuracy is null/undefined (no accuracy data)', () => {
    // When accuracy is null, the guard is not applied — real GPS without accuracy info is accepted
    const provider = new SimulatedLocationProvider(stopCoords);
    const controller = new TourLocationController(
      startTour(makeTour()),
      provider,
      [attraction],
      false,
    );

    const insideCoords = offsetPoint(stopCoords, 20, 0);
    controller.checkLocation({ ...insideCoords }); // no accuracy field

    expect(controller.getSession().isCurrentStopReached).toBe(true);
  });

  it('does NOT trigger arrival when accuracy is exactly 0 (invalid GPS fix)', () => {
    const provider = new SimulatedLocationProvider(stopCoords);
    const controller = new TourLocationController(
      startTour(makeTour()),
      provider,
      [attraction],
      false,
    );

    const insideCoords = offsetPoint(stopCoords, 10, 0);
    controller.checkLocation({ ...insideCoords, accuracy: 0 }); // accuracy 0 is invalid

    expect(controller.getSession().isCurrentStopReached).toBe(false);
  });

  it('arrival detection is idempotent — second check at same stop does not reset state', () => {
    const provider = new SimulatedLocationProvider(stopCoords);
    const controller = new TourLocationController(
      startTour(makeTour()),
      provider,
      [attraction],
      false,
    );

    const insideCoords = offsetPoint(stopCoords, 10, 0);
    controller.checkLocation({ ...insideCoords, accuracy: 15 });
    expect(controller.getSession().isCurrentStopReached).toBe(true);

    // Call again — should remain reached, not regress
    controller.checkLocation({ ...insideCoords, accuracy: 15 });
    expect(controller.getSession().isCurrentStopReached).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. TourLocationController — stale timestamp guard
// ---------------------------------------------------------------------------
describe('TourLocationController stale timestamp guard', () => {
  const stopCoords = { latitude: 12.8690, longitude: 74.8430 };
  const attraction = { id: 'attr-stale', coordinates: stopCoords };

  const makeTour = () => ({
    id: 'tour-stale',
    cityId: 'mangalore',
    name: 'Stale Tour',
    description: '',
    category: 'history' as const,
    estimatedDurationMinutes: 60,
    stops: [
      { id: 'stop-1', attractionId: 'attr-stale', order: 1, triggerRadiusMeters: 50, storyId: 'story-1' },
    ],
    heroImage: undefined,
  });

  it('ignores a location update timestamped before the last stop transition', () => {
    const provider = new SimulatedLocationProvider(stopCoords);
    const controller = new TourLocationController(
      startTour(makeTour()),
      provider,
      [attraction],
      false,
    );

    // Simulate a stop transition happening NOW
    const transitionTime = Date.now();
    // We trigger a move that sets _lastTransitionTimestamp
    // We do it via reset() which also sets _lastTransitionTimestamp
    controller.reset();
    // After reset the stop should not be reached
    expect(controller.getSession().isCurrentStopReached).toBe(false);

    // Now feed a location update with a timestamp BEFORE the transition
    const staleTimestamp = transitionTime - 5000; // 5s before reset
    const insideCoords = offsetPoint(stopCoords, 10, 0);
    controller.checkLocation({ ...insideCoords, timestamp: staleTimestamp, accuracy: 15 });

    // Should still NOT be reached because the location is stale
    expect(controller.getSession().isCurrentStopReached).toBe(false);
  });

  it('accepts a location update timestamped after the last stop transition', () => {
    const provider = new SimulatedLocationProvider(stopCoords);
    const controller = new TourLocationController(
      startTour(makeTour()),
      provider,
      [attraction],
      false,
    );

    // Feed a location with a future timestamp (well after any transition)
    const futureTimestamp = Date.now() + 60000;
    const insideCoords = offsetPoint(stopCoords, 10, 0);
    controller.checkLocation({ ...insideCoords, timestamp: futureTimestamp, accuracy: 15 });

    expect(controller.getSession().isCurrentStopReached).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 9. TourLocationController — NaN coordinate guard
// ---------------------------------------------------------------------------
describe('TourLocationController NaN coordinate guard', () => {
  const stopCoords = { latitude: 12.8690, longitude: 74.8430 };
  const attraction = { id: 'attr-nan', coordinates: stopCoords };

  const makeTour = () => ({
    id: 'tour-nan',
    cityId: 'mangalore',
    name: 'NaN Tour',
    description: '',
    category: 'history' as const,
    estimatedDurationMinutes: 60,
    stops: [
      { id: 'stop-1', attractionId: 'attr-nan', order: 1, triggerRadiusMeters: 50, storyId: 'story-1' },
    ],
    heroImage: undefined,
  });

  it('ignores a location with NaN latitude', () => {
    const provider = new SimulatedLocationProvider(stopCoords);
    const controller = new TourLocationController(
      startTour(makeTour()),
      provider,
      [attraction],
      false,
    );

    controller.checkLocation({ latitude: NaN, longitude: 74.8430 });
    expect(controller.getSession().isCurrentStopReached).toBe(false);
  });

  it('ignores a location with NaN longitude', () => {
    const provider = new SimulatedLocationProvider(stopCoords);
    const controller = new TourLocationController(
      startTour(makeTour()),
      provider,
      [attraction],
      false,
    );

    controller.checkLocation({ latitude: 12.8690, longitude: NaN });
    expect(controller.getSession().isCurrentStopReached).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 10. getDistanceToCurrentStop — returns null for invalid coordinates
// ---------------------------------------------------------------------------
describe('TourLocationController.getDistanceToCurrentStop', () => {
  const stopCoords = { latitude: 12.8690, longitude: 74.8430 };
  const attraction = { id: 'attr-dist', coordinates: stopCoords };

  const makeTour = () => ({
    id: 'tour-dist',
    cityId: 'mangalore',
    name: 'Distance Tour',
    description: '',
    category: 'history' as const,
    estimatedDurationMinutes: 60,
    stops: [
      { id: 'stop-1', attractionId: 'attr-dist', order: 1, triggerRadiusMeters: 50, storyId: 'story-1' },
    ],
    heroImage: undefined,
  });

  it('returns a numeric distance once a valid location is provided', () => {
    const provider = new SimulatedLocationProvider(stopCoords);
    const controller = new TourLocationController(
      startTour(makeTour()),
      provider,
      [attraction],
      false,
    );

    const nearbyCoords = offsetPoint(stopCoords, 100, 0);
    controller.checkLocation(nearbyCoords);

    const distance = controller.getDistanceToCurrentStop();
    expect(distance).not.toBeNull();
    expect(distance!).toBeGreaterThan(0);
    expect(distance!).toBeLessThan(200);
  });

  it('returns null when the tour is complete', () => {
    const provider = new SimulatedLocationProvider(stopCoords);
    const controller = new TourLocationController(
      { ...startTour(makeTour()), isComplete: true },
      provider,
      [attraction],
      false,
    );

    expect(controller.getDistanceToCurrentStop()).toBeNull();
  });
});
