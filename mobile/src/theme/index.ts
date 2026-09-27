// src/theme/index.ts
// =============================================================================
// Coastal Karnataka Guide — Design Tokens
// =============================================================================
// Visual identity: inspired by Coastal Karnataka — the deep ocean, laterite
// cliffs, monsoon greens, temple gold, and aged-paper warmth of the region.
// Contemporary and subtle, not literally decorative.
//
// Naming convention:
//   Semantic names (primary, background, textPrimary …) are the primary API.
//   Legacy names (ocean, inkDark …) are kept for backward compatibility.
// =============================================================================

// ---------------------------------------------------------------------------
// Color System
// ---------------------------------------------------------------------------

export const Colors = {
  // --- Primary — Coastal deep ocean blue -----------------------------------
  // Coastal Karnataka's sea in the deep-water hours: rich, trustworthy, calm.
  primary:       '#1A5C99',
  primaryDark:   '#0F3D6B',   // pressed states, deep headers
  primaryLight:  '#E6F0FA',   // tinted backgrounds, selection highlight

  // --- Secondary — Laterite terracotta --------------------------------------
  // The characteristic red-orange laterite stone of coastal Karnataka.
  // Warmth and heritage without being literal.
  secondary:     '#A0522D',
  secondaryDark: '#7A3A1C',
  secondaryLight:'#FFF0E8',

  // --- Background & Surface -------------------------------------------------
  // Warm off-white — like the pages of a well-used travel journal.
  background:       '#FAF8F3',
  surface:          '#FFFFFF',
  surfaceElevated:  '#F5F1EB',  // slightly tinted card background

  // --- Text -----------------------------------------------------------------
  textPrimary:   '#1A1F2C',   // near-black, slightly warm undertone
  textSecondary: '#4A5568',   // mid — readable, comfortable
  textTertiary:  '#8A9BB0',   // meta, labels, captions

  // --- Accent — Monsoon forest green ----------------------------------------
  // The deep green of the Western Ghats in monsoon; coastal mangroves.
  accent:        '#2D7A55',
  accentLight:   '#E6F5EE',

  // --- Status ---------------------------------------------------------------
  success:       '#2D7A55',
  successLight:  '#E6F5EE',
  error:         '#C0392B',
  errorLight:    '#FDECEA',
  warning:       '#B7791F',
  warningLight:  '#FEFCE8',

  // --- Borders & Dividers ---------------------------------------------------
  border:        '#E2DDD4',   // warm grey — aged paper edge
  borderStrong:  '#C8BEB4',
  divider:       '#EDE9E2',

  // --- Utilities ------------------------------------------------------------
  white:         '#FFFFFF',
  black:         '#000000',
  transparent:   'transparent',
  overlay:       'rgba(26, 31, 44, 0.45)',  // image overlays, modals

  // --- Legacy aliases (backward compat with M3 code) ------------------------
  ocean:         '#1A5C99',
  oceanDeep:     '#0F3D6B',
  sand:          '#F5EFE0',
  sandLight:     '#FAF8F3',
  seafoam:       '#E6F5EE',
  coral:         '#A0522D',
  inkDark:       '#1A1F2C',
  inkMid:        '#4A5568',
  inkLight:      '#8A9BB0',
} as const;

// ---------------------------------------------------------------------------
// Placeholder palette for PlaceImage (category-keyed)
// Warm, harmonious tones — each evokes a different facet of the region.
// ---------------------------------------------------------------------------

export const CategoryColors: Record<string, string> = {
  history:      '#8B7355',   // weathered laterite stone
  religious:    '#B8860B',   // temple gold, incense warmth
  nature:       '#3D6B4F',   // monsoon forest
  food:         '#B5631A',   // spice, turmeric
  architecture: '#6B6B8A',   // cool stone, shadows
  coastal:      '#2B6B8A',   // deep sea
  culture:      '#7A4F6D',   // silk, festival
  default:      '#9A8070',   // laterite clay
};

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const Typography = {
  // === Semantic scale ===
  // display — hero titles, welcome screen
  display: {
    fontSize: 38,
    fontWeight: '700' as const,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  // heading — screen titles, tour names
  heading: {
    fontSize: 26,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  // subheading — section names, card titles
  subheading: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  // body — main readable content
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 25,
  },
  // bodySmall — secondary content, taglines
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  // caption — meta, timestamps, minor info
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 17,
  },
  // button — CTA labels
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  // label — form labels, pill text, tags
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  // overline — section eyebrows, CAPS labels
  overline: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },

  // === Legacy aliases (backward compat) ===
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
} as const;

// ---------------------------------------------------------------------------
// Spacing Scale
// ---------------------------------------------------------------------------

export const Spacing = {
  xxs: 2,
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  xxxl: 64,
} as const;

// ---------------------------------------------------------------------------
// Border Radius Scale
// ---------------------------------------------------------------------------

export const Radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
} as const;

// ---------------------------------------------------------------------------
// Shadow Presets (iOS shadow + Android elevation pairs)
// Use sparingly — prefer borders for definition.
// ---------------------------------------------------------------------------

export const Shadow = {
  none: {},
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;
