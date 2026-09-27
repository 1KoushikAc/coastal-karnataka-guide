// src/screens/TourPreviewScreen.tsx
// Full tour detail before the traveler begins.
// Uses PlaceImage, SectionHeader, CategoryPill, PrimaryButton.
// No GPS, maps, or audio — navigation logic unchanged.

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, Spacing, Typography, Radius } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { CategoryPill } from '../components/CategoryPill';
import { SectionHeader } from '../components/SectionHeader';
import { PlaceImage } from '../components/PlaceImage';
import { EmptyState } from '../components/EmptyState';
import { formatDuration } from '../utils/format';
import type { RootStackParamList } from '../navigation/types';
import { tours, attractions } from '@data/index';

type Props = NativeStackScreenProps<RootStackParamList, 'TourPreview'>;

// ── Stat block (local — specific to this screen) ──────────────────────────

function StatBlock({ value, label }: { value: string; label: string }): React.JSX.Element {
  return (
    <View style={statStyles.block}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  block: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  value: {
    ...Typography.subheading,
    color: Colors.primary,
  },
  label: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

// ── Screen ─────────────────────────────────────────────────────────────────

export function TourPreviewScreen({ route }: Props): React.JSX.Element {
  const { tourId } = route.params;

  const tour = useMemo(() => tours.find((t) => t.id === tourId), [tourId]);

  const stopNames = useMemo(() => {
    if (!tour) return [];
    return tour.stops.map((stop) => {
      const attr = attractions.find((a) => a.id === stop.attractionId);
      return attr?.name ?? stop.attractionId;
    });
  }, [tour]);

  if (!tour) {
    return (
      <SafeAreaView style={styles.root}>
        <EmptyState icon="❓" title="Tour not found" body="This tour could not be loaded." />
      </SafeAreaView>
    );
  }

  const handleStartTour = () => {
    Alert.alert(
      'Coming Soon',
      'The guided tour experience with location-based stories will be available in a future update.',
      [{ text: 'Got it' }],
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[]}>

        {/* ── Hero image ──────────────────────────────────────── */}
        <PlaceImage
          category={tour.category}
          label={tour.name}
          height={220}
        />

        <View style={styles.content}>
          {/* ── Category + title ────────────────────────────── */}
          <CategoryPill category={tour.category} />
          <Text style={styles.title}>{tour.name}</Text>

          {/* ── Stats row ───────────────────────────────────── */}
          <View style={styles.statsRow}>
            <StatBlock
              value={String(tour.stops.length)}
              label={tour.stops.length === 1 ? 'Stop' : 'Stops'}
            />
            <View style={styles.statDivider} />
            <StatBlock
              value={formatDuration(tour.estimatedDurationMinutes)}
              label="Duration"
            />
          </View>

          {/* ── About ───────────────────────────────────────── */}
          <SectionHeader title="About this tour" spaceAbove={false} />
          <Text style={styles.description}>{tour.description}</Text>

          {/* ── Experience ──────────────────────────────────── */}
          <SectionHeader title="What you'll experience" />
          <Text style={styles.bodyText}>
            This tour takes you through {tour.stops.length}{' '}
            {tour.stops.length === 1 ? 'location' : 'locations'} in Mangalore.
            At each stop, the story behind the place unfolds — its history, the people
            who shaped it, and what it means to the city today.
          </Text>
          <Text style={[styles.bodyText, styles.bodySpaced]}>
            The route is self-guided. Walk at your own pace.
          </Text>

          {/* ── Itinerary ───────────────────────────────────── */}
          <SectionHeader title="Itinerary" />
          <View style={styles.itinerary}>
            {stopNames.map((name, idx) => (
              <View key={idx} style={styles.stopRow}>
                {/* Number bubble */}
                <View style={styles.bubble}>
                  <Text style={styles.bubbleText}>{idx + 1}</Text>
                </View>
                {/* Connector line (all but last) */}
                {idx < stopNames.length - 1 && (
                  <View style={styles.connector} />
                )}
                {/* Stop name */}
                <Text style={styles.stopName}>{name}</Text>
              </View>
            ))}
          </View>

          {/* ── Good to know ────────────────────────────────── */}
          <SectionHeader title="Good to know" />
          <View style={styles.tipBox}>
            {[
              { icon: '🗺️', text: 'Self-guided · Walk at your own pace' },
              { icon: '🕐', text: 'Best in the morning or late afternoon' },
              { icon: '👟', text: 'Comfortable walking shoes recommended' },
            ].map(({ icon, text }) => (
              <View key={text} style={styles.tipRow}>
                <Text style={styles.tipIcon}>{icon}</Text>
                <Text style={styles.tipText}>{text}</Text>
              </View>
            ))}
          </View>

          {/* Bottom padding so content clears the sticky footer */}
          <View style={styles.footerSpacer} />
        </View>
      </ScrollView>

      {/* ── Sticky Start button ─────────────────────────────── */}
      <View style={styles.stickyFooter}>
        <PrimaryButton
          label="Start Tour"
          onPress={handleStartTour}
          accessibilityLabel={`Start ${tour.name}`}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.xs,
  },
  description: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  bodyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  bodySpaced: {
    marginTop: Spacing.sm,
  },
  // ── Itinerary ──
  itinerary: {
    marginTop: Spacing.xs,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 52,
    position: 'relative',
  },
  bubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    zIndex: 1,
  },
  bubbleText: {
    ...Typography.label,
    color: Colors.white,
  },
  connector: {
    position: 'absolute',
    left: 13,
    top: 30,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.divider,
  },
  stopName: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    paddingLeft: Spacing.md,
    paddingTop: 4,
    paddingBottom: Spacing.md,
  },
  // ── Tips ──
  tipBox: {
    backgroundColor: Colors.accentLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tipIcon: {
    fontSize: 16,
    lineHeight: 22,
  },
  tipText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  // ── Footer ──
  footerSpacer: {
    height: Spacing.xl,
  },
  stickyFooter: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
});
