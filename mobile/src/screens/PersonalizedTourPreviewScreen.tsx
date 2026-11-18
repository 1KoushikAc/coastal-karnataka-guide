// mobile/src/screens/PersonalizedTourPreviewScreen.tsx
// =============================================================================
// PersonalizedTourPreviewScreen — Preview Generated Custom Itinerary (M8)
// =============================================================================
// Displays the deterministic route generated from traveler preferences:
//   - Total duration breakdown (visit time + transit between stops)
//   - Transparent match reasons
//   - Clear notes on skipped attractions
//   - Option to launch the tour into the existing GPS engine (ActiveTourScreen)
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
import { SecondaryButton } from '../components/SecondaryButton';
import { CategoryPill } from '../components/CategoryPill';
import { PlaceImage } from '../components/PlaceImage';
import { EmptyState } from '../components/EmptyState';
import { getPersonalizedPlan } from '../engine/planner/registry';
import { resolveImageSource } from '../utils/images';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalizedTourPreview'>;

export function PersonalizedTourPreviewScreen({ route, navigation }: Props): React.JSX.Element {
  const { planId } = route.params;

  const plan = useMemo(() => getPersonalizedPlan(planId), [planId]);

  if (!plan || !plan.generatedTour) {
    return (
      <SafeAreaView style={styles.root}>
        <EmptyState
          icon="🗺️"
          title="Plan Not Found"
          body="The generated itinerary could not be loaded. Please return to the planner."
        />
        <View style={styles.actionPadding}>
          <PrimaryButton label="Return to Planner" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const { destination, plannedStops, totalDurationMinutes, totalVisitMinutes, totalTransitMinutes, summary } = plan;

  const handleStartTour = () => {
    if (plan.generatedTour) {
      navigation.navigate('ActiveTour', { tourId: plan.generatedTour.id });
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero Image / Editorial Banner ─────────────────── */}
        <PlaceImage
          source={resolveImageSource(destination.heroImage?.assetKey)}
          category={plan.generatedTour.category}
          label={`Personalized ${destination.name} Tour`}
          isPlaceholder={destination.heroImage?.isPlaceholder}
          height={210}
        />

        <View style={styles.content}>

          {/* ── Header Titles ───────────────────────────────── */}
          <View style={styles.eyebrowRow}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>CUSTOM ITINERARY</Text>
            </View>
            {plan.preferences.travelerType && (
              <View style={styles.travelerTypeBadge}>
                <Text style={styles.travelerTypeBadgeText}>
                  {plan.preferences.travelerType === 'solo' ? '🧭 SOLO' : '👥 WITH FRIENDS'}
                </Text>
              </View>
            )}
            <Text style={styles.destRegion}>{destination.name}, {destination.country}</Text>
          </View>

          <Text style={styles.title}>Your Personalized Tour</Text>
          <Text style={styles.summaryText}>{summary}</Text>

          {/* ── Metric Highlights Bar ───────────────────────── */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{plannedStops.length}</Text>
              <Text style={styles.statLabel}>{plannedStops.length === 1 ? 'Stop' : 'Stops'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statValue}>~{totalVisitMinutes}m</Text>
              <Text style={styles.statLabel}>Visit Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statValue}>~{totalTransitMinutes}m</Text>
              <Text style={styles.statLabel}>Transit</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statValue}>~{totalDurationMinutes}m</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
          </View>

          {/* ── Preference Transparencies ────────────────────── */}
          {plan.skippedAttractionIds.length > 0 && (
            <View style={styles.infoNote}>
              <Text style={styles.infoNoteIcon}>ℹ</Text>
              <Text style={styles.infoNoteText}>
                {plan.skippedAttractionIds.length}{' '}
                {plan.skippedAttractionIds.length === 1 ? 'landmark was' : 'landmarks were'}{' '}
                excluded per your skip preferences.
              </Text>
            </View>
          )}

          {plan.excludedByTimeIds.length > 0 && (
            <View style={styles.timeNote}>
              <Text style={styles.timeNoteIcon}>⏱</Text>
              <Text style={styles.timeNoteText}>
                Shortened to fit your available time. {plan.excludedByTimeIds.length}{' '}
                {plan.excludedByTimeIds.length === 1
                  ? 'place could not fit into this walk and was saved for a future visit.'
                  : 'places could not fit into this walk and were saved for a future visit.'}
              </Text>
            </View>
          )}

          {/* ── Ordered Stops Itinerary ─────────────────────── */}
          <View style={styles.itinerarySection}>
            <Text style={styles.sectionHeading}>PLANNED ROUTE SEQUENCE</Text>

            {plannedStops.map((stop, idx) => (
              <View key={stop.attraction.id} style={styles.stopBlock}>

                {/* Transit indicator between stops */}
                {idx > 0 && (
                  <View style={styles.transitRow}>
                    <View style={styles.transitLine} />
                    <View style={styles.transitBadge}>
                      <Text style={styles.transitBadgeText}>
                        👟 ~{stop.transitMinutesFromPrevious} min transit ({Math.round(stop.distanceMetersFromPrevious)}m)
                      </Text>
                    </View>
                    <View style={styles.transitLine} />
                  </View>
                )}

                {/* Stop Card */}
                <View style={styles.stopCard}>
                  <View style={styles.stopCardHeader}>
                    <View style={styles.stopNumberBubble}>
                      <Text style={styles.stopNumberText}>{stop.order}</Text>
                    </View>
                    <View style={styles.stopTitleCol}>
                      <Text style={styles.stopName}>{stop.attraction.name}</Text>
                      <View style={styles.stopPillRow}>
                        <CategoryPill category={stop.attraction.categories[0]} />
                        <Text style={styles.stopDurationText}>~{stop.visitDurationMinutes} min visit</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.stopDesc}>{stop.attraction.shortDescription}</Text>

                  {/* Match Reason */}
                  <View style={styles.matchReasonRow}>
                    <Text style={styles.matchReasonIcon}>✓</Text>
                    <Text style={styles.matchReasonText}>{stop.matchReasons.join(' · ')}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* ── Action Section ──────────────────────────────── */}
          <View style={styles.actions}>
            <PrimaryButton
              label="Start Walking This Tour →"
              onPress={handleStartTour}
              accessibilityLabel="Start walking this personalized tour"
            />
            <SecondaryButton
              label="← Adjust Preferences"
              onPress={() => navigation.goBack()}
              style={styles.secondarySpacing}
            />
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
  scroll: {
    paddingBottom: Spacing.xxl,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  planBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  planBadgeText: {
    ...Typography.overline,
    color: Colors.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  travelerTypeBadge: {
    backgroundColor: '#EAF2FB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: '#C7DDF6',
  },
  travelerTypeBadgeText: {
    ...Typography.overline,
    color: Colors.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  destRegion: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    ...Typography.heading,
    fontSize: 26,
    color: Colors.textPrimary,
  },
  summaryText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 23,
    fontSize: 15,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    ...Shadow.sm,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...Typography.subheading,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.divider,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5EE',
    padding: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#EFE1C4',
    gap: Spacing.sm,
  },
  infoNoteIcon: {
    fontSize: 14,
    color: '#8C6826',
  },
  infoNoteText: {
    ...Typography.caption,
    color: '#654B1A',
    fontSize: 12,
    flex: 1,
  },
  timeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F6F6',
    padding: Spacing.sm + 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#C7E2E2',
    gap: Spacing.sm,
  },
  timeNoteIcon: {
    fontSize: 14,
    color: '#1D5A5A',
  },
  timeNoteText: {
    ...Typography.caption,
    color: '#1D5A5A',
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  itinerarySection: {
    gap: Spacing.md,
  },
  sectionHeading: {
    ...Typography.overline,
    color: Colors.primary,
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '700',
  },
  stopBlock: {
    gap: Spacing.xs,
  },
  transitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  transitLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  transitBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  transitBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  stopCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  stopCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stopNumberBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  stopTitleCol: {
    flex: 1,
    gap: 2,
  },
  stopName: {
    ...Typography.subheading,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stopPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stopDurationText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
  },
  stopDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  matchReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
  },
  matchReasonIcon: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '700',
  },
  matchReasonText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  secondarySpacing: {
    marginTop: Spacing.xs,
  },
  actionPadding: {
    padding: Spacing.lg,
  },
});
