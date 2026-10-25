// src/screens/StopStoryScreen.tsx
// =============================================================================
// StopStoryScreen — Focused Story & On-Site Exploration (M7 Visual Pass)
// =============================================================================
// Designed for a traveler physically standing at a tour landmark.
// Atmosphere: calm, typography-led, editorial travel guide layout.
//
// Key features:
//   - Hero PlaceImage (data-driven with graceful editorial fallback).
//   - Clear landmark hierarchy: stop position badge, categories, prominent place name.
//   - "While You Are Here" observation card encouraging looking around.
//   - Editorial story presentation: rhythmic paragraph spacing, pull quotes, rich line height.
//   - Practical on-site visiting notes.
//   - Clear top and bottom return navigation without mutating tour session state.
// =============================================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, Spacing, Typography, Radius, Shadow } from '../theme';
import { PlaceImage } from '../components/PlaceImage';
import { CategoryPill } from '../components/CategoryPill';
import { resolveImageSource } from '../utils/images';
import { tours, attractions, stories } from '@data/index';
import { getTourById } from '../engine/planner/registry';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'StopStory'>;

// ---------------------------------------------------------------------------
// Content safety helpers (strictly suppress developer/placeholder markers)
// ---------------------------------------------------------------------------

function safeNarrationText(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith('[PLACEHOLDER') || trimmed.startsWith('[placeholder')) {
    return null;
  }
  return trimmed.length > 0 ? trimmed : null;
}

function safeShortDescription(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith('[PLACEHOLDER') || trimmed.startsWith('[placeholder')) {
    return null;
  }
  return trimmed.length > 0 ? trimmed : null;
}

// ---------------------------------------------------------------------------
// Screen Component
// ---------------------------------------------------------------------------

export function StopStoryScreen({ route, navigation }: Props): React.JSX.Element {
  const { tourId, stopIndex } = route.params;

  // Resolve tour and stop from M1 data or custom registry
  const tour = useMemo(() => getTourById(tourId) ?? tours.find((t) => t.id === tourId) ?? null, [tourId]);
  const stop = useMemo(() => tour?.stops[stopIndex] ?? null, [tour, stopIndex]);
  const attraction = useMemo(
    () => (stop ? attractions.find((a) => a.id === stop.attractionId) ?? null : null),
    [stop],
  );
  const story = useMemo(
    () => (stop ? stories.find((s) => s.id === stop.storyId) ?? null : null),
    [stop],
  );

  const narrationText = story?.narrationText ? safeNarrationText(story.narrationText) : null;
  const shortDescription = attraction?.shortDescription
    ? safeShortDescription(attraction.shortDescription)
    : null;

  // Split narration text into structured paragraphs for comfortable reading
  const paragraphs = useMemo(() => {
    if (!narrationText) return [];
    return narrationText
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [narrationText]);

  const stopLabel =
    tour && stop ? `Stop ${stop.order} of ${tour.stops.length}` : null;

  const handleBack = () => {
    navigation.goBack();
  };

  // Missing data guard
  if (!attraction) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.errorContainer}>
          <TouchableOpacity
            style={styles.backButtonTop}
            onPress={handleBack}
            accessibilityLabel="Back to tour"
            accessibilityRole="button"
          >
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backLabel}>Back to Tour</Text>
          </TouchableOpacity>
          <View style={styles.errorBody}>
            <Text style={styles.errorIcon}>🗺️</Text>
            <Text style={styles.errorTitle}>Place Not Found</Text>
            <Text style={styles.errorText}>
              This stop's information could not be loaded. Return to the tour to continue.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Top Navigation Bar ──────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButtonTop}
          onPress={handleBack}
          accessibilityLabel="Back to active tour"
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Return to Walk</Text>
        </TouchableOpacity>
        {stopLabel && <Text style={styles.topBarStopBadge}>{stopLabel.toUpperCase()}</Text>}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Hero Place Photography / Editorial Banner ─────── */}
        <PlaceImage
          source={resolveImageSource(attraction.image?.assetKey)}
          category={attraction.categories[0]}
          label={attraction.name}
          isPlaceholder={attraction.image?.isPlaceholder}
          height={240}
        />

        <View style={styles.content}>

          {/* ── Category Chips ───────────────────────────────── */}
          <View style={styles.categoryRow}>
            {attraction.categories.map((cat) => (
              <CategoryPill key={cat} category={cat} />
            ))}
          </View>

          {/* ── Landmark Title ───────────────────────────────── */}
          <Text style={styles.attractionName}>{attraction.name}</Text>

          {/* ── Short Introduction ───────────────────────────── */}
          {shortDescription && (
            <Text style={styles.introText}>{shortDescription}</Text>
          )}

          {/* ── On-Site Observation Prompt ────────────────────── */}
          <View style={styles.observationCard}>
            <View style={styles.observationIconWrap}>
              <Text style={styles.observationIcon}>👁</Text>
            </View>
            <View style={styles.observationTextCol}>
              <Text style={styles.observationHeading}>WHILE YOU ARE HERE</Text>
              <Text style={styles.observationBody}>
                Look around the physical site. Notice the stone craftsmanship, the courtyard layout, and how the space feels before reading its history below.
              </Text>
            </View>
          </View>

          {/* ── Story Section ─────────────────────────────────── */}
          {story && (
            <View style={styles.storySection}>
              <View style={styles.storyEyebrowRow}>
                <Text style={styles.storyEyebrow}>THE STORY OF THIS PLACE</Text>
                <View style={styles.eyebrowAccentLine} />
              </View>

              <Text style={styles.storyTitle}>{story.title}</Text>

              {paragraphs.length > 0 ? (
                paragraphs.map((p, idx) => (
                  <Text
                    key={idx}
                    style={[
                      styles.storyParagraph,
                      idx === 0 && styles.firstParagraph,
                    ]}
                  >
                    {p}
                  </Text>
                ))
              ) : (
                <View style={styles.storyFallback}>
                  {shortDescription ? (
                    <Text style={styles.storyParagraph}>{shortDescription}</Text>
                  ) : (
                    <Text style={styles.storyFallbackText}>
                      The story of this landmark is being prepared. Take your time to explore the grounds.
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* ── Visiting & Context Notes ──────────────────────── */}
          <View style={styles.visitingCard}>
            <Text style={styles.visitingEyebrow}>VISITING NOTES</Text>

            <View style={styles.visitingRow}>
              <Text style={styles.visitingIcon}>⏱</Text>
              <Text style={styles.visitingText}>
                Estimated visit: ~{attraction.estimatedVisitDurationMinutes} minutes
              </Text>
            </View>

            <View style={styles.visitingRow}>
              <Text style={styles.visitingIcon}>📍</Text>
              <Text style={styles.visitingText}>
                Part of the {tour?.name ?? 'Mangalore Heritage Walk'}
              </Text>
            </View>
          </View>

          {/* ── Bottom Return Button ──────────────────────────── */}
          <View style={styles.returnSection}>
            <TouchableOpacity
              style={styles.returnButton}
              onPress={handleBack}
              accessibilityLabel="Return to active tour walk"
              accessibilityRole="button"
              activeOpacity={0.82}
            >
              <Text style={styles.returnButtonText}>← Return to Tour Walk</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  backButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: Spacing.xs,
  },
  backArrow: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '700',
  },
  backLabel: {
    ...Typography.button,
    fontSize: 14,
    color: Colors.primary,
  },
  topBarStopBadge: {
    ...Typography.overline,
    fontSize: 10,
    color: Colors.textTertiary,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  scroll: {
    paddingBottom: Spacing.xxl,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  attractionName: {
    ...Typography.heading,
    fontSize: 26,
    lineHeight: 34,
    color: Colors.textPrimary,
  },
  introText: {
    ...Typography.editorialLead,
    color: Colors.textSecondary,
    fontSize: 16,
    lineHeight: 25,
  },
  observationCard: {
    flexDirection: 'row',
    backgroundColor: '#FDF9F0',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFE1C4',
    gap: Spacing.md,
  },
  observationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF0DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  observationIcon: {
    fontSize: 18,
  },
  observationTextCol: {
    flex: 1,
    gap: 3,
  },
  observationHeading: {
    ...Typography.overline,
    color: '#8C6826',
    letterSpacing: 1.2,
    fontSize: 10,
    fontWeight: '700',
  },
  observationBody: {
    ...Typography.bodySmall,
    color: '#554228',
    lineHeight: 20,
    fontSize: 13,
  },
  storySection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  storyEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  storyEyebrow: {
    ...Typography.overline,
    color: Colors.accent,
    letterSpacing: 1.4,
    fontSize: 10,
    fontWeight: '700',
  },
  eyebrowAccentLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.divider,
  },
  storyTitle: {
    ...Typography.editorialHeading,
    fontSize: 21,
    lineHeight: 28,
    color: Colors.textPrimary,
  },
  storyParagraph: {
    ...Typography.editorialBody,
    color: '#2A3342',
    lineHeight: 27,
    fontSize: 15,
  },
  firstParagraph: {
    color: Colors.textPrimary,
    fontWeight: '400',
  },
  storyFallback: {
    paddingVertical: Spacing.sm,
  },
  storyFallbackText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  visitingCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  visitingEyebrow: {
    ...Typography.overline,
    color: Colors.textTertiary,
    letterSpacing: 1.2,
    fontSize: 10,
    fontWeight: '700',
  },
  visitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  visitingIcon: {
    fontSize: 14,
  },
  visitingText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  returnSection: {
    marginTop: Spacing.xs,
  },
  returnButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...Shadow.sm,
  },
  returnButtonText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  errorBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  errorIcon: {
    fontSize: 40,
  },
  errorTitle: {
    ...Typography.subheading,
    color: Colors.textPrimary,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
