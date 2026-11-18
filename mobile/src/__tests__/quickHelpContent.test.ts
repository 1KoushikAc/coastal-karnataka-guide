// mobile/src/__tests__/quickHelpContent.test.ts
// =============================================================================
// Quick Help Content, Verified Emergency Contacts & Safety Disclaimers Tests
// =============================================================================
// Verifies:
//   1. Polite-response content: non-confrontational phrases, local phonetics,
//      and clear reminder that travelers owe no one an explanation.
//   2. Public place safety guidance: practical directions to staffed places,
//      realistic safety disclaimer (no claim of zero risk).
//   3. Verified emergency contacts: official authority sources (MHA, KSP,
//      Health Dept Karnataka), correct numbers (112, 108, 1091, 0824-2220800),
//      and rejection of unverified numbers.
//   4. Clear disclaimers: immediate danger notice & explicit statement that app
//      does not auto-dispatch responders.
// =============================================================================

import {
  POLITE_RESPONSES,
  SAFETY_BOUNDARY_REMINDER,
  USEFUL_TULU_EXPRESSIONS,
} from '../engine/safety/politeResponses';
import {
  SAFER_PLACE_GUIDELINES,
  SAFETY_GENERAL_DISCLAIMER,
} from '../engine/safety/saferPlaces';
import {
  VERIFIED_EMERGENCY_CONTACTS,
  EMERGENCY_IMMEDIATE_DANGER_NOTICE,
  EMERGENCY_NO_AUTODISPATCH_DISCLAIMER,
  isVerifiedEmergencyNumber,
  formatEmergencyNumber,
} from '../engine/safety/emergencyContacts';

describe('Quick Help Content, Safety & Verified Emergency Contacts', () => {
  // ---------------------------------------------------------------------------
  // 1. Tulu Quick Help Phrases & Boundary Setting
  // ---------------------------------------------------------------------------
  describe('Tulu Quick Help Phrases Content', () => {
    test('contains all 24 required Quick Help phrases', () => {
      expect(POLITE_RESPONSES).toHaveLength(24);
    });

    test('verifies all 24 exact English meanings and exact Tulu translations', () => {
      const expectedPhrases: Array<{ english: string; tulu: string }> = [
        {
          english: 'Please leave me alone.',
          tulu: 'Enan ennatige budle',
        },
        {
          english: "I'm feeling uncomfortable. Please help me.",
          tulu: 'Enk dadana sari aavondijji, enk help bodu.',
        },
        {
          english: "Please don't disturb me.",
          tulu: 'Enk upadra korodchi.',
        },
        {
          english: "I'm not interested. Please stop.",
          tulu: 'Enk manasijji nett, untale',
        },
        {
          english: 'Please maintain some distance from me.',
          tulu: 'Enad dh onthe doora ippule, enk sari aavondijji.',
        },
        {
          english: "Please don't touch me.",
          tulu: 'Dayadeed enan muttodchi.',
        },
        {
          english: "Please don't follow me.",
          tulu: 'Dayadeedh enna beriya barodchi.',
        },
        {
          english: 'Please stop bothering me.',
          tulu: 'Dayadeed enk upadra mnpodchi',
        },
        {
          english: "I'm scared. Please stay with me.",
          tulu: 'Enk podige aavondundu, enna ottugu untule',
        },
        {
          english: "I'm being harassed. Please help me find a safe place.",
          tulu: 'Enk kaata koronduller, enk onji safe place nadre help malpule.',
        },
        {
          english: 'Can you please call someone I trust?',
          tulu: 'Enna friend g call malth korpara.',
        },
        {
          english: "Please don't leave me alone.",
          tulu: 'Enan oriyane bud dh podchi anna',
        },
        {
          english: 'Please speak to me respectfully.',
          tulu: 'Maryadi kordhu paterle',
        },
        {
          english: "I'm uncomfortable with the way you're behaving. Please stop.",
          tulu: 'Eerna behavior enk sari aavondijji, erna behavior n untaale',
        },
        {
          english: 'Please respect my personal space.',
          tulu: 'Enna personal matter avv, yaan toovonve sir/maam.',
        },
        {
          english: "Please don't speak to me like that.",
          tulu: 'Enada ancha paterodchi.',
        },
        {
          english: "Please don't threaten me.",
          tulu: 'Enk podige kattavodchi.',
        },
        {
          english: 'Please call the police. I need help.',
          tulu: 'Police g call malpule, enk help bodu.',
        },
        {
          english: "I'm in danger. Please don't leave me.",
          tulu: 'Yaan banga d ulle, dayadeedh bud dh podchi.',
        },
        {
          english: 'Please help me get to a safe place.',
          tulu: 'Enk safe place g poreg help mnpule.',
        },
        {
          english: 'Please stay here with me until I feel safe.',
          tulu: 'Enk safe feel aana muta enna ottug untule',
        },
        {
          english: "Please don't force me to do anything.",
          tulu: 'Enk ottaya malpodchi unden pura malpare',
        },
        {
          english: 'Please give me some time. I need to think.',
          tulu: 'Enk onthe time bodu, ennare',
        },
        {
          english: "Please don't shout at me.",
          tulu: 'Enna mitt kalkodchi.',
        },
      ];

      expectedPhrases.forEach((expected, idx) => {
        const item = POLITE_RESPONSES[idx];
        expect(item).toBeDefined();
        expect(item.english).toBe(expected.english);
        expect(item.phrase).toBe(expected.english);
        expect(item.tulu).toBe(expected.tulu);
      });
    });

    test('preserves respectful and non-respectful distinctions for phrase 4 and phrase 9', () => {
      // Phrase 4: "I'm not interested. Please stop."
      const phrase4 = POLITE_RESPONSES.find((p) => p.english === "I'm not interested. Please stop.")!;
      expect(phrase4).toBeDefined();
      expect(phrase4.tulu).toBe('Enk manasijji nett, untale');
      expect(phrase4.respectDistinction).toBeDefined();
      expect(phrase4.respectDistinction?.withRespect).toBe('Untale');
      expect(phrase4.respectDistinction?.withoutRespect).toBe('Untala');

      // Phrase 9: "I'm scared. Please stay with me."
      const phrase9 = POLITE_RESPONSES.find((p) => p.english === "I'm scared. Please stay with me.")!;
      expect(phrase9).toBeDefined();
      expect(phrase9.tulu).toBe('Enk podige aavondundu, enna ottugu untule');
      expect(phrase9.respectDistinction).toBeDefined();
      expect(phrase9.respectDistinction?.withRespect).toBe('Untule');
      expect(phrase9.respectDistinction?.withoutRespect).toBe('Untu');
    });

    test('preserves both gender-specific alternatives for phrase 12 with clear labels and sentence capitalization', () => {
      const phrase12 = POLITE_RESPONSES.find((p) => p.english === "Please don't leave me alone.")!;
      expect(phrase12).toBeDefined();
      expect(phrase12.tulu).toBe('Enan oriyane bud dh podchi anna');
      expect(phrase12.genderAlternatives).toBeDefined();
      expect(phrase12.genderAlternatives?.male).toBe('Enan oriyane bud dh podchi anna');
      expect(phrase12.genderAlternatives?.female).toBe('Enan orthine bud dh podchi akka');
    });

    test('verifies consistent sentence-style capitalization across all 24 Tulu phrases and variants', () => {
      // 1. Every complete Tulu phrase must start with an uppercase letter
      for (const item of POLITE_RESPONSES) {
        const firstChar = item.tulu.charAt(0);
        expect(firstChar).toBe(firstChar.toUpperCase());
        expect(firstChar).not.toBe(firstChar.toLowerCase());

        // Check gender alternatives if present
        if (item.genderAlternatives) {
          const maleFirst = item.genderAlternatives.male.charAt(0);
          const femaleFirst = item.genderAlternatives.female.charAt(0);
          expect(maleFirst).toBe(maleFirst.toUpperCase());
          expect(femaleFirst).toBe(femaleFirst.toUpperCase());
        }

        // Check respectful distinction standalone labels if present
        if (item.respectDistinction) {
          const withFirst = item.respectDistinction.withRespect.charAt(0);
          const withoutFirst = item.respectDistinction.withoutRespect.charAt(0);
          expect(withFirst).toBe(withFirst.toUpperCase());
          expect(withoutFirst).toBe(withoutFirst.toUpperCase());
        }
      }

      // 2. Both cultural thank-you expressions must start with an uppercase letter
      for (const expr of USEFUL_TULU_EXPRESSIONS) {
        const firstChar = expr.tulu.charAt(0);
        expect(firstChar).toBe(firstChar.toUpperCase());
      }

      // 3. Specific audited phrases must strictly match sentence-case (no Title Case or random internal capitals)
      expect(POLITE_RESPONSES[0].tulu).toBe('Enan ennatige budle');
      expect(POLITE_RESPONSES[3].tulu).toBe('Enk manasijji nett, untale');
      expect(POLITE_RESPONSES[5].tulu).toBe('Dayadeed enan muttodchi.');
      expect(POLITE_RESPONSES[7].tulu).toBe('Dayadeed enk upadra mnpodchi');
      expect(POLITE_RESPONSES[9].tulu).toBe('Enk kaata koronduller, enk onji safe place nadre help malpule.');
      expect(POLITE_RESPONSES[11].tulu).toBe('Enan oriyane bud dh podchi anna');
      expect(POLITE_RESPONSES[12].tulu).toBe('Maryadi kordhu paterle');
    });

    test('verifies that all 24 owner-provided Tulu translations are 100% preserved (wording, spelling, order)', () => {
      // Historical owner-provided phrases (original verbatim words)
      const originalOwnerPhrases = [
        'Enan Ennatige Budle',
        'Enk dadana sari aavondijji, enk help bodu.',
        'Enk upadra korodchi.',
        'Enk manasijji nett, Untale',
        'Enad dh onthe doora ippule, enk sari aavondijji.',
        'Dayadeed Enan muttodchi.',
        'Dayadeedh enna beriya barodchi.',
        'dayadeed Enk upadra mnpodchi',
        'Enk podige aavondundu, enna ottugu untule',
        'Enk kaata koronduller, Enk onji safe place nadre help malpule.',
        'Enna friend g call malth korpara.',
        'Enan Oriyane bud dh podchi anna',
        'maryadi kordhu paterle',
        'Eerna behavior enk sari aavondijji, erna behavior n untaale',
        'Enna personal matter avv, yaan toovonve sir/maam.',
        'Enada ancha paterodchi.',
        'Enk podige kattavodchi.',
        'Police g call malpule, enk help bodu.',
        'Yaan banga d ulle, dayadeedh bud dh podchi.',
        'Enk safe place g poreg help mnpule.',
        'Enk safe feel aana muta enna ottug untule',
        'Enk ottaya malpodchi unden pura malpare',
        'Enk onthe time bodu, ennare',
        'Enna mitt kalkodchi.',
      ];

      expect(POLITE_RESPONSES).toHaveLength(originalOwnerPhrases.length);

      originalOwnerPhrases.forEach((orig, idx) => {
        const current = POLITE_RESPONSES[idx].tulu;
        // Verify case-insensitive identity — every single character, spelling, space, punctuation identical
        expect(current.toLowerCase()).toBe(orig.toLowerCase());
        // Verify word count identical
        expect(current.split(/\s+/).length).toBe(orig.split(/\s+/).length);
      });
    });

    test('verifies useful cultural Tulu expressions (thank-you expressions)', () => {
      expect(USEFUL_TULU_EXPRESSIONS).toHaveLength(2);

      const solmelu = USEFUL_TULU_EXPRESSIONS.find((e) => e.tulu === 'Solmelu');
      expect(solmelu).toBeDefined();
      expect(solmelu?.english).toBe('Thank you.');

      const udalDinji = USEFUL_TULU_EXPRESSIONS.find((e) => e.tulu === 'Udal dinji solmelu');
      expect(udalDinji).toBeDefined();
      expect(udalDinji?.english).toBe('Heartfelt thank you.');
    });

    test('confirms no Kannada translations remain in Quick Help phrase content', () => {
      for (const item of POLITE_RESPONSES) {
        expect((item as any).kannadaPhonetic).toBeUndefined();
        expect((item as any).kannada).toBeUndefined();
      }
    });

    test('includes prominent safety reminder that traveler owes no explanation', () => {
      expect(SAFETY_BOUNDARY_REMINDER).toContain('You do not owe anyone an explanation');
      expect(SAFETY_BOUNDARY_REMINDER).toContain('prioritize');
      expect(SAFETY_BOUNDARY_REMINDER).toContain('safe');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Safer Public Places Guidance
  // ---------------------------------------------------------------------------
  describe('Safer Public Places Guidance', () => {
    test('provides realistic categories of staffed, populated places', () => {
      const categories = SAFER_PLACE_GUIDELINES.map((g) => g.category);
      expect(categories).toContain('shops_cafes');
      expect(categories).toContain('official_staff');
      expect(categories).toContain('well_lit_streets');
      expect(categories).toContain('transit_hubs');

      for (const g of SAFER_PLACE_GUIDELINES) {
        expect(g.title.length).toBeGreaterThan(5);
        expect(g.guidance.length).toBeGreaterThan(20);
        expect(g.examples.length).toBeGreaterThan(0);
      }
    });

    test('includes general safety disclaimer without claiming zero danger', () => {
      // Rule: Do not claim that Mangaluru has zero danger or guarantee personal safety.
      expect(SAFETY_GENERAL_DISCLAIMER).toContain('no destination has zero risk');
      expect(SAFETY_GENERAL_DISCLAIMER).toContain('cannot be guaranteed');
      expect(SAFETY_GENERAL_DISCLAIMER).toContain('trust your instincts');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Verified Emergency Helplines & Authoritative Sources
  // ---------------------------------------------------------------------------
  describe('Verified Emergency Helplines', () => {
    test('contains verified national and Karnataka state emergency contacts', () => {
      const numbers = VERIFIED_EMERGENCY_CONTACTS.map((c) => c.number);

      // 112 (National ERSS)
      expect(numbers).toContain('112');
      // 108 (Arogya Kavacha Ambulance)
      expect(numbers).toContain('108');
      // 1091 (Women Helpline)
      expect(numbers).toContain('1091');
      // 08242220800 (Mangaluru City Police Control Room)
      expect(numbers).toContain('08242220800');
    });

    test('every emergency contact cites an authoritative official source', () => {
      for (const c of VERIFIED_EMERGENCY_CONTACTS) {
        expect(c.authoritySource).toBeTruthy();
        expect(c.authoritySource.length).toBeGreaterThan(15);
      }

      const erss = VERIFIED_EMERGENCY_CONTACTS.find((c) => c.number === '112')!;
      expect(erss.authoritySource).toContain('Ministry of Home Affairs');

      const ambulance = VERIFIED_EMERGENCY_CONTACTS.find((c) => c.number === '108')!;
      expect(ambulance.authoritySource).toContain('Government of Karnataka');

      const police = VERIFIED_EMERGENCY_CONTACTS.find((c) => c.number === '08242220800')!;
      expect(police.authoritySource).toContain('Mangaluru City Police');
    });

    test('isVerifiedEmergencyNumber distinguishes verified numbers from arbitrary ones', () => {
      expect(isVerifiedEmergencyNumber('112')).toBe(true);
      expect(isVerifiedEmergencyNumber('108')).toBe(true);
      expect(isVerifiedEmergencyNumber('1091')).toBe(true);
      expect(isVerifiedEmergencyNumber('0824-2220800')).toBe(true);
      expect(isVerifiedEmergencyNumber('08242220800')).toBe(true);
      expect(isVerifiedEmergencyNumber('(0824) 2220800')).toBe(true);
      expect(isVerifiedEmergencyNumber('(0824) 222-0800')).toBe(true);

      // Unverified or invented numbers
      expect(isVerifiedEmergencyNumber('9999999999')).toBe(false);
      expect(isVerifiedEmergencyNumber('12345')).toBe(false);
      expect(isVerifiedEmergencyNumber('911')).toBe(false);
    });

    test('formats emergency phone numbers cleanly', () => {
      expect(formatEmergencyNumber('112')).toBe('112');
      expect(formatEmergencyNumber('08242220800')).toBe('0824-2220800');
      expect(formatEmergencyNumber('0824-2220800')).toBe('0824-2220800');
      expect(formatEmergencyNumber('(0824) 2220800')).toBe('0824-2220800');
    });

    test('includes prominent immediate danger instructions', () => {
      expect(EMERGENCY_IMMEDIATE_DANGER_NOTICE).toContain('call 112 directly');
      expect(EMERGENCY_IMMEDIATE_DANGER_NOTICE).toContain('cannot automatically dispatch');
    });

    test('explicitly disclaims automated emergency dispatch and background tracking', () => {
      expect(EMERGENCY_NO_AUTODISPATCH_DISCLAIMER).toContain('informational travel guide');
      expect(EMERGENCY_NO_AUTODISPATCH_DISCLAIMER).toContain('does not monitor emergencies');
      expect(EMERGENCY_NO_AUTODISPATCH_DISCLAIMER).toContain('dispatch police or medical assistance automatically');
    });
  });
});
