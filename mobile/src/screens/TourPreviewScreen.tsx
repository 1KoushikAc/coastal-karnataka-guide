// src/screens/TourPreviewScreen.tsx
// =============================================================================
// TourPreviewScreen — Itinerary & Experience Overview
// =============================================================================
// Displays complete tour overview before the traveler begins walking.
// Place-focused typography, rich landmark stop cards, and prominent Start CTA.
// =============================================================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, Spacing, Typography, Radius, Shadow } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { CategoryPill } from '../components/CategoryPill';
import { PlaceImage } from '../components/PlaceImage';
import { EmptyState } from '../components/EmptyState';
import { formatDuration } from '../utils/format';
import { resolveImageSource } from '../utils/images';
import type { RootStackParamList } from '../navigation/types';
import { tours, attractions } from '@data/index';
import { getTourById } from '../engine/planner/registry';

type Props = NativeStackScreenProps<RootStackParamList, 'TourPreview'>;

// ── Stat block ──────────────────────────────────────────────────────────────

function StatBlock({ value, label, icon }: { value: string; label: string; icon: string }): React.JSX.Element {
  return (
    <View style={statStyles.block}>
      <Text style={statStyles.icon}>{icon}</Text>
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
    gap: 2,
  },
  icon: {
    fontSize: 16,
    marginBottom: 2,
  },
  value: {
    ...Typography.subheading,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  label: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
});

// ── Screen Component ────────────────────────────────────────────────────────

export function TourPreviewScreen({ route, navigation }: Props): React.JSX.Element {
  const { tourId } = route.params;

  const tour = useMemo(
    () => getTourById(tourId) ?? tours.find((t) => t.id === tourId) ?? null,
    [tourId],
  );

  const stopsData = useMemo(() => {
    if (!tour) return [];
    return tour.stops.map((stop) => {
      const attr = attractions.find((a) => a.id === stop.attractionId);
      return {
        stop,
        name: attr?.name ?? stop.attractionId,
        shortDesc: attr?.shortDescription ?? '',
        duration: attr?.estimatedVisitDurationMinutes ?? 30,
        category: attr?.categories[0] ?? tour.category,
        image: attr?.image,
        admission: attr?.admission,
      };
    });
  }, [tour]);

  if (!tour) {
    return (
      <SafeAreaView style={styles.root}>
        <EmptyState icon="❓" title="Tour Not Found" body="This tour itinerary could not be loaded." />
      </SafeAreaView>
    );
  }

  const handleStartTour = () => {
    navigation.navigate('ActiveTour', { tourId: tour.id });
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero image / Editorial banner ─────────────────── */}
        <PlaceImage
          source={resolveImageSource(tour.heroImage?.assetKey)}
          category={tour.category}
          label={tour.name}
          isPlaceholder={tour.heroImage?.isPlaceholder}
          height={230}
        />

        <View style={styles.content}>
          {/* ── Category & Subtitle ─────────────────────────── */}
          <View style={styles.headerMeta}>
            <CategoryPill category={tour.category} />
            <Text style={styles.headerCity}>MANGALORE, KARNATAKA</Text>
          </View>

          <Text style={styles.title}>{tour.name}</Text>

          {/* ── Stats row ───────────────────────────────────── */}
          <View style={styles.statsRow}>
            <StatBlock
              icon="📍"
              value={String(tour.stops.length)}
              label={tour.stops.length === 1 ? 'Stop' : 'Stops'}
            />
            <View style={styles.statDivider} />
            <StatBlock
              icon="⏱"
              value={formatDuration(tour.estimatedDurationMinutes)}
              label="Duration"
            />
            <View style={styles.statDivider} />
            <StatBlock
              icon="👟"
              value="Self-Paced"
              label="Pace"
            />
          </View>

          {/* ── About this tour ─────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>ABOUT THIS ITINERARY</Text>
            <Text style={styles.description}>{tour.description}</Text>
          </View>

          {/* ── Itinerary Timeline with Landmark Cards ───────── */}
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>THE STOPS ({tour.stops.length})</Text>
            <View style={styles.itinerary}>
              {stopsData.map((item, idx) => (
                <View key={item.stop.id} style={styles.stopRow}>
                  {/* Step indicator */}
                  <View style={styles.bubbleCol}>
                    <View style={styles.bubble}>
                      <Text style={styles.bubbleText}>{idx + 1}</Text>
                    </View>
                    {idx < stopsData.length - 1 && <View style={styles.connector} />}
                  </View>

                  {/* Stop detail card */}
                  <View style={styles.stopCard}>
                    <PlaceImage
                      source={resolveImageSource(item.image?.assetKey)}
                      category={item.category}
                      label={item.name}
                      isPlaceholder={item.image?.isPlaceholder}
                      height={96}
                      style={styles.stopCardImage}
                    />

                    <View style={styles.stopCardBody}>
                      <View style={styles.stopCardMeta}>
                        <CategoryPill category={item.category} />
                        <Text style={styles.stopCardDuration}>
                          ⏱ ~{item.duration} min
                        </Text>
                      </View>

                      <Text style={styles.stopName}>{item.name}</Text>

                      {item.shortDesc ? (
                        <Text style={styles.stopDesc} numberOfLines={2}>
                          {item.shortDesc}
                        </Text>
                      ) : null}

                      {item.admission && (
                        <Text style={styles.stopAdmissionText}>
                          {item.admission.isFree ? 'Free public admission' : 'Admission entry'}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ── Travel Guide Tips ───────────────────────────── */}
          <View style={styles.tipsBox}>
            <Text style={styles.tipsHeading}>WALKING NOTES</Text>
            <View style={styles.tipRow}>
              <Text style={styles.tipIcon}>📍</Text>
              <Text style={styles.tipText}>
                GPS auto-detects each stop as you arrive within range.
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Text style={styles.tipIcon}>☀️</Text>
              <Text style={styles.tipText}>
                Best experienced during early morning or late afternoon light.
              </Text>
            </View>
            <View style={styles.tipRow}>
              <Text style={styles.tipIcon}>👟</Text>
              <Text style={styles.tipText}>
                Comfortable walking footwear recommended for temple courtyards.
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* ── Sticky Start Action ─────────────────────────────── */}
      <View style={styles.stickyFooter}>
        <PrimaryButton
          label="Start Walking Tour →"
          onPress={handleStartTour}
          accessibilityLabel={`Start walking tour: ${tour.name}`}
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
  scroll: {
    paddingBottom: Spacing.xl,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  headerCity: {
    ...Typography.overline,
    color: Colors.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    ...Typography.heading,
    fontSize: 26,
    lineHeight: 34,
    color: Colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.divider,
    marginVertical: Spacing.xs,
  },
  section: {
    gap: Spacing.xs,
  },
  sectionEyebrow: {
    ...Typography.overline,
    color: Colors.accent,
    marginBottom: 4,
    letterSpacing: 1.2,
  },
  description: {
    ...Typography.body,
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 25,
  },
  itinerary: {
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bubbleCol: {
    alignItems: 'center',
    marginRight: Spacing.md,
    paddingTop: 4,
  },
  bubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  bubbleText: {
    ...Typography.label,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 6,
    marginBottom: -6,
  },
  stopCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
    marginBottom: Spacing.xs,
  },
  stopCardImage: {
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
  },
  stopCardBody: {
    padding: Spacing.sm + 2,
    gap: 4,
  },
  stopCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  stopCardDuration: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  stopName: {
    ...Typography.subheading,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stopDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  stopAdmissionText: {
    ...Typography.caption,
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tipsBox: {
    backgroundColor: '#FAF5EE',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E8DEC8',
    gap: Spacing.sm,
  },
  tipsHeading: {
    ...Typography.overline,
    color: '#8A6836',
    letterSpacing: 1.2,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tipIcon: {
    fontSize: 15,
    lineHeight: 20,
  },
  tipText: {
    ...Typography.bodySmall,
    color: '#554734',
    flex: 1,
    lineHeight: 20,
    fontSize: 13,
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
