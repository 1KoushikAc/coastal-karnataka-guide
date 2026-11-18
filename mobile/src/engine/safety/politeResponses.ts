// mobile/src/engine/safety/politeResponses.ts
// =============================================================================
// Quick Help Phrases in Tulu (English / Roman Letters)
// =============================================================================
// Offers short, calm, localized Tulu phrases written in English/Roman script
// for solo travelers and people exploring with friends to decline unwanted
// conversations, set boundaries, or seek immediate help across Coastal Karnataka.
//
// Core Safety Reminder:
//   The traveler NEVER owes anyone an explanation, debate, or time.
//   If feeling uncomfortable or threatened, prioritize moving immediately
//   to a safe, populated place over continuing a polite conversation.
// =============================================================================

import type { PoliteResponseItem, UsefulTuluExpression } from './types';

export const SAFETY_BOUNDARY_REMINDER =
  'You do not owe anyone an explanation, debate, or your time. If you feel threatened or uncomfortable, prioritize getting to safety rather than continuing a polite conversation—disengage immediately and move toward a busy, staffed place.';

export const POLITE_RESPONSES: PoliteResponseItem[] = [
  {
    id: 'tulu-1',
    english: 'Please leave me alone.',
    phrase: 'Please leave me alone.',
    tulu: 'Enan ennatige budle',
    context: 'Firm, calm request to be left alone when approached repeatedly.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-2',
    english: "I'm feeling uncomfortable. Please help me.",
    phrase: "I'm feeling uncomfortable. Please help me.",
    tulu: 'Enk dadana sari aavondijji, enk help bodu.',
    context: 'Call for assistance when a situation feels wrong or distressing.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-3',
    english: "Please don't disturb me.",
    phrase: "Please don't disturb me.",
    tulu: 'Enk upadra korodchi.',
    context: 'Direct request to avoid interruption or disturbance while traveling.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-4',
    english: "I'm not interested. Please stop.",
    phrase: "I'm not interested. Please stop.",
    tulu: 'Enk manasijji nett, untale',
    respectDistinction: {
      withRespect: 'Untale',
      withoutRespect: 'Untala',
    },
    context: 'Firm decline for unwanted sales, tours, or persistence. Untale is respectful.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-5',
    english: 'Please maintain some distance from me.',
    phrase: 'Please maintain some distance from me.',
    tulu: 'Enad dh onthe doora ippule, enk sari aavondijji.',
    context: 'Setting a clear physical boundary when someone is standing too close.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-6',
    english: "Please don't touch me.",
    phrase: "Please don't touch me.",
    tulu: 'Dayadeed enan muttodchi.',
    context: 'Immediate, unambiguous physical boundary setting.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-7',
    english: "Please don't follow me.",
    phrase: "Please don't follow me.",
    tulu: 'Dayadeedh enna beriya barodchi.',
    context: 'Direct boundary when someone is trailing or following your steps.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-8',
    english: 'Please stop bothering me.',
    phrase: 'Please stop bothering me.',
    tulu: 'Dayadeed enk upadra mnpodchi',
    context: 'Unambiguous statement to disengage from persistent unwanted attention.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-9',
    english: "I'm scared. Please stay with me.",
    phrase: "I'm scared. Please stay with me.",
    tulu: 'Enk podige aavondundu, enna ottugu untule',
    respectDistinction: {
      withRespect: 'Untule',
      withoutRespect: 'Untu',
    },
    context: 'Seeking immediate reassurance or presence in a crowded area. Untule is respectful.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-10',
    english: "I'm being harassed. Please help me find a safe place.",
    phrase: "I'm being harassed. Please help me find a safe place.",
    tulu: 'Enk kaata koronduller, enk onji safe place nadre help malpule.',
    context: 'Urgent appeal to staff or bystanders to reach a secure, staffed location.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-11',
    english: 'Can you please call someone I trust?',
    phrase: 'Can you please call someone I trust?',
    tulu: 'Enna friend g call malth korpara.',
    context: 'Asking a counter staff member or receptionist to help contact your companion.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-12',
    english: "Please don't leave me alone.",
    phrase: "Please don't leave me alone.",
    tulu: 'Enan oriyane bud dh podchi anna',
    genderAlternatives: {
      male: 'Enan oriyane bud dh podchi anna',
      female: 'Enan orthine bud dh podchi akka',
    },
    context: 'Asking someone nearby to stay with you. Gender-specific forms address a male (anna) or female (akka).',
    intendedFor: 'all',
  },
  {
    id: 'tulu-13',
    english: 'Please speak to me respectfully.',
    phrase: 'Please speak to me respectfully.',
    tulu: 'Maryadi kordhu paterle',
    context: 'Asserting dignity and requesting polite tone of address.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-14',
    english: "I'm uncomfortable with the way you're behaving. Please stop.",
    phrase: "I'm uncomfortable with the way you're behaving. Please stop.",
    tulu: 'Eerna behavior enk sari aavondijji, erna behavior n untaale',
    context: 'Calling out inappropriate behavior firmly and calmly.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-15',
    english: 'Please respect my personal space.',
    phrase: 'Please respect my personal space.',
    tulu: 'Enna personal matter avv, yaan toovonve sir/maam.',
    context: 'Maintaining privacy and declining unsolicited involvement.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-16',
    english: "Please don't speak to me like that.",
    phrase: "Please don't speak to me like that.",
    tulu: 'Enada ancha paterodchi.',
    context: 'Declining rude, aggressive, or overly familiar speech.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-17',
    english: "Please don't threaten me.",
    phrase: "Please don't threaten me.",
    tulu: 'Enk podige kattavodchi.',
    context: 'Direct statement when intimidation or pressure is felt.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-18',
    english: 'Please call the police. I need help.',
    phrase: 'Please call the police. I need help.',
    tulu: 'Police g call malpule, enk help bodu.',
    context: 'Urgent instruction to shop staff, hotel desk, or bystanders to summon police.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-19',
    english: "I'm in danger. Please don't leave me.",
    phrase: "I'm in danger. Please don't leave me.",
    tulu: 'Yaan banga d ulle, dayadeedh bud dh podchi.',
    context: 'Critical appeal when in imminent danger, asking someone not to leave you isolated.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-20',
    english: 'Please help me get to a safe place.',
    phrase: 'Please help me get to a safe place.',
    tulu: 'Enk safe place g poreg help mnpule.',
    context: 'Requesting guidance to move toward a populated, brightly lit facility.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-21',
    english: 'Please stay here with me until I feel safe.',
    phrase: 'Please stay here with me until I feel safe.',
    tulu: 'Enk safe feel aana muta enna ottug untule',
    context: 'Asking a companion, guard, or staff member to remain until calm is restored.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-22',
    english: "Please don't force me to do anything.",
    phrase: "Please don't force me to do anything.",
    tulu: 'Enk ottaya malpodchi unden pura malpare',
    context: 'Refusing coercion or pressure to go anywhere or do anything against your will.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-23',
    english: 'Please give me some time. I need to think.',
    phrase: 'Please give me some time. I need to think.',
    tulu: 'Enk onthe time bodu, ennare',
    context: 'Creating space to pause, assess surroundings, and make decisions without rush.',
    intendedFor: 'all',
  },
  {
    id: 'tulu-24',
    english: "Please don't shout at me.",
    phrase: "Please don't shout at me.",
    tulu: 'Enna mitt kalkodchi.',
    context: 'Addressing raised voices calmly and de-escalating confrontations.',
    intendedFor: 'all',
  },
];

export const USEFUL_TULU_EXPRESSIONS: UsefulTuluExpression[] = [
  {
    id: 'tulu-expr-1',
    tulu: 'Solmelu',
    english: 'Thank you.',
    context: 'Everyday expression of gratitude and appreciation across Coastal Karnataka.',
  },
  {
    id: 'tulu-expr-2',
    tulu: 'Udal dinji solmelu',
    english: 'Heartfelt thank you.',
    context: 'Deeper, warmer expression of heartfelt thanks.',
  },
];

export const TULU_EXPRESSIONS = USEFUL_TULU_EXPRESSIONS;
