// mobile/src/engine/safety/trustedContactStorage.ts
// =============================================================================
// Trusted Contact Local Storage
// =============================================================================
// Encapsulates privacy-preserving, local-only storage for a traveler's
// designated trusted contact.
//
// Privacy Guarantees:
//   - Stored strictly on device via AsyncStorage.
//   - Never uploaded to any remote server or logged remotely.
//   - No user account or authentication required.
//   - If missing, the app continues to function smoothly without blocking.
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TrustedContact } from './types';

export const STORAGE_KEY_TRUSTED_CONTACT = '@coastal_karnataka/trusted_contact_v1';

/**
 * Validates whether an input phone number has a realistic format.
 * Accepts local Indian mobile numbers (10 digits), landlines with STD,
 * or international formatted numbers with leading '+'.
 */
export function validatePhoneNumber(phone: string): { valid: boolean; reason?: string } {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { valid: false, reason: 'Phone number cannot be empty.' };
  }

  // Strip spaces, dashes, parentheses
  const cleaned = trimmed.replace(/[\s\-()]/g, '');

  // Must contain only digits or optional leading '+'
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  if (!phoneRegex.test(cleaned)) {
    return {
      valid: false,
      reason: 'Please enter a valid phone number with digits only (7–15 digits, optional + prefix).',
    };
  }

  return { valid: true };
}

/**
 * Validates a candidate trusted contact object.
 */
export function isValidTrustedContact(contact: unknown): contact is TrustedContact {
  if (!contact || typeof contact !== 'object') return false;
  const c = contact as Partial<TrustedContact>;
  if (typeof c.name !== 'string' || c.name.trim().length === 0) return false;
  if (typeof c.phoneNumber !== 'string' || !validatePhoneNumber(c.phoneNumber).valid) return false;
  return true;
}

/**
 * Loads the saved trusted contact from AsyncStorage.
 * Returns null if no contact is saved or if stored data is corrupted.
 */
export async function loadTrustedContact(): Promise<TrustedContact | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_TRUSTED_CONTACT);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (isValidTrustedContact(parsed)) {
      return {
        name: parsed.name.trim(),
        phoneNumber: parsed.phoneNumber.trim(),
        relationship: parsed.relationship?.trim(),
      };
    }
    console.warn('[TrustedContactStorage] Discarding invalid stored contact data');
    return null;
  } catch (err) {
    console.warn('[TrustedContactStorage] Error reading contact from storage:', err);
    return null;
  }
}

/**
 * Persists a trusted contact into AsyncStorage.
 */
export async function saveTrustedContact(contact: TrustedContact): Promise<void> {
  const validation = validatePhoneNumber(contact.phoneNumber);
  if (!validation.valid) {
    throw new Error(validation.reason || 'Invalid phone number');
  }

  const sanitized: TrustedContact = {
    name: contact.name.trim(),
    phoneNumber: contact.phoneNumber.trim(),
    relationship: contact.relationship?.trim() || undefined,
  };

  if (!sanitized.name) {
    throw new Error('Contact name is required');
  }

  await AsyncStorage.setItem(
    STORAGE_KEY_TRUSTED_CONTACT,
    JSON.stringify(sanitized),
  );
}

/**
 * Removes the saved trusted contact from AsyncStorage.
 */
export async function clearTrustedContact(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY_TRUSTED_CONTACT);
}
