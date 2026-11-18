// mobile/src/engine/safety/emergencyContacts.ts
// =============================================================================
// Verified Emergency Contacts & Authoritative Sources
// =============================================================================
// Verified, region-appropriate emergency contact numbers for Mangaluru & Karnataka.
//
// Rules:
//   - All numbers must be verified against official government or police sources.
//   - If contact data cannot be verified, do NOT invent it.
//   - Clear indication that immediate danger requires calling local emergency services.
//   - No false claims of automated emergency dispatch.
//   - Calling requires explicit user interaction and confirmation.
// =============================================================================

import type { EmergencyContact } from './types';

export const EMERGENCY_IMMEDIATE_DANGER_NOTICE =
  'If you or anyone around you is in immediate danger, call 112 directly. This app cannot automatically dispatch emergency responders or detect emergencies.';

export const EMERGENCY_NO_AUTODISPATCH_DISCLAIMER =
  'This application is an informational travel guide. It does not monitor emergencies, track background location for emergency services, or dispatch police or medical assistance automatically.';

export const VERIFIED_EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'erss-112',
    name: 'National Emergency Support (ERSS)',
    number: '112',
    category: 'national',
    description: 'All-in-one emergency helpline for Police, Fire & Rescue, and Medical emergencies in Karnataka and nationwide.',
    authoritySource: 'Ministry of Home Affairs (MHA), Government of India / Karnataka State Police (ERSS 112)',
    isNational: true,
    priorityOrder: 1,
  },
  {
    id: 'ambulance-108',
    name: 'Arogya Kavacha Medical Ambulance',
    number: '108',
    category: 'medical',
    description: 'Toll-free 24/7 emergency medical transportation and paramedic support across Karnataka.',
    authoritySource: 'Department of Health & Family Welfare, Government of Karnataka (GVK EMRI)',
    isNational: false,
    priorityOrder: 2,
  },
  {
    id: 'women-1091',
    name: 'Women Helpline',
    number: '1091',
    category: 'helpline',
    description: '24/7 dedicated helpline for women in distress requiring immediate police support or safety counseling.',
    authoritySource: 'Karnataka State Police / Ministry of Women & Child Development',
    isNational: true,
    priorityOrder: 3,
  },
  {
    id: 'police-mangaluru-control',
    name: 'Mangaluru City Police Control Room',
    number: '08242220800',
    category: 'police',
    description: 'Direct 24/7 landline to the Mangaluru City Police Commissionerate control room for local police coordination.',
    authoritySource: 'Mangaluru City Police Commissionerate, Dakshina Kannada District',
    isNational: false,
    priorityOrder: 4,
  },
];

/**
 * Validates whether an emergency number is known and verified in the catalog.
 * Robust against formatting differences (parentheses, spaces, hyphens).
 */
export function isVerifiedEmergencyNumber(number: string): boolean {
  const digitsOnly = number.replace(/\D/g, '');
  return VERIFIED_EMERGENCY_CONTACTS.some(
    (c) => c.number.replace(/\D/g, '') === digitsOnly,
  );
}

/**
 * Formats an emergency phone number for display readability.
 */
export function formatEmergencyNumber(number: string): string {
  const digitsOnly = number.replace(/\D/g, '');
  if (digitsOnly === '08242220800') {
    return '0824-2220800';
  }
  return number.trim();
}
