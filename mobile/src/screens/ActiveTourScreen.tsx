// src/screens/ActiveTourScreen.tsx
// =============================================================================
// ActiveTourScreen — Guided Active Tour Experience (M7 Visual Pass)
// =============================================================================
// The primary walking tour screen. Displays the current stop, distance/proximity,
// narration story upon arrival, and tour progress.
//
// UX Principles:
//   - Calm, spacious, place-focused — not a dashboard.
//   - Current place and story are the visual heroes.
//   - Progress and distance are clear but subtle.
//   - No chatbot aesthetics, no generic AI styling.
//   - Dedicated Dev Simulator controls tucked in a collapsible drawer for on-device testing.
// =============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, Spacing, Typography, Radius, Shadow } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { CategoryPill } from '../components/CategoryPill';
import { PlaceImage } from '../components/PlaceImage';
import { EmptyState } from '../components/EmptyState';
import { useActiveTour } from '../hooks/useActiveTour';
import { resolveImageSource } from '../utils/images';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveTour'>;

export function ActiveTourScreen({ route, navigation }: Props): React.JSX.Element {
  const { tourId } = route.params;
  const {
    tour,
    session,
    currentStop,
    currentAttraction,
    currentStory,
    distanceMeters,
    simulatedLocation,
    isReached,
    isComplete,
    stopNumber,
    totalStops,
    hasViewedArrivalContent,
    markArrivalContentViewed,
    moveToNextStop,
    resetTour,
    devControls,
    isPermissionDenied,
    isLocationUnavailable,
    isLowAccuracy,
    proximityState,
    retryPermission,
    setMode,
    isSimulated,
    locationStatus,
  } = useActiveTour(tourId);

  // Dev controls collapsed state — defaults to collapsed so it doesn't clutter physical device view
  const [devExpanded, setDevExpanded] = useState<boolean>(false);

  // If tour could not be loaded
  if (!tour) {
    return (
      <SafeAreaView style={styles.root}>
        <EmptyState
          icon="🗺️"
          title="Tour Not Found"
          body="The requested tour could not be loaded."
        />
        <View style={styles.actionPadding}>
          <PrimaryButton label="Back to Tours" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // State: Tour Completed
  // ---------------------------------------------------------------------------
  if (isComplete) {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.completeScroll} showsVerticalScrollIndicator={false}>
          {/* Milestone Hero */}
          <View style={styles.completeHero}>
            <View style={styles.completeBadge}>
              <Text style={styles.completeBadgeIcon}>🏆</Text>
            </View>
            <Text style={styles.overline}>WALK COMPLETED</Text>
            <Text style={styles.completeTitle}>{tour.name}</Text>
            <Text style={styles.completeBody}>
              You have completed all {totalStops} stops along this coastal journey.
              Mangalore's living history and sacred heritage walk with you.
            </Text>
          </View>

          {/* Stops summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryHeading}>Places Explored ({totalStops})</Text>
              <Text style={styles.summarySub}>Mangalore Heritage Route</Text>
            </View>

            {tour.stops.map((stop, idx) => (
              <View key={stop.id} style={styles.summaryRow}>
                <View style={styles.checkIconWrap}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
                <View style={styles.summaryTextCol}>
                  <Text style={styles.summaryStopNumber}>STOP {idx + 1}</Text>
                  <Text style={styles.summaryText}>
                    {stop.id.replace('stop-', '').replace(/-/g, ' ')}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.completeActions}>
            <PrimaryButton
              label="Explore Other Tours →"
              onPress={() => navigation.navigate('ChooseInterest')}
            />
            <SecondaryButton
              label="Restart This Tour"
              onPress={resetTour}
              style={styles.secondarySpacing}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isFinalStop = stopNumber === totalStops;

  // ---------------------------------------------------------------------------
  // Derived display flags for the arrival experience (M6.4 / M6.5)
  // ---------------------------------------------------------------------------
  const showArrivalCard = isReached && !hasViewedArrivalContent;
  const showContentView = isReached && hasViewedArrivalContent;

  const arrivalCtaLabel = currentStory ? 'Explore This Place →' : 'Learn About This Place →';

  const handleExploreThisPlace = () => {
    markArrivalContentViewed();
    if (tour && session) {
      navigation.navigate('StopStory', {
        tourId: tour.id,
        stopIndex: session.currentStopIndex,
      });
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Place Hero Image ─────────────────────────────────── */}
        <PlaceImage
          source={resolveImageSource(currentAttraction?.image?.assetKey)}
          category={currentAttraction?.categories[0] ?? tour.category}
          label={currentAttraction?.name ?? 'Current Stop'}
          isPlaceholder={currentAttraction?.image?.isPlaceholder}
          height={220}
        />

        <View style={styles.content}>

          {/* ── Progress & Category Row ─────────────────────────── */}
          <View style={styles.headerRow}>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>
                STOP {stopNumber} OF {totalStops}
              </Text>
            </View>
            <CategoryPill category={tour.category} />
          </View>

          {/* ── Stop Name & Title ────────────────────────────────── */}
          <Text style={styles.attractionName}>
            {currentAttraction?.name ?? 'Loading place…'}
          </Text>

          {/* ── Status Banner (Permission Denied vs Arrived vs Unavailable vs En Route) ── */}
          {isPermissionDenied ? (
            <View style={styles.permissionBanner}>
              <Text style={styles.permissionIcon}>📍</Text>
              <View style={styles.permissionTextCol}>
                <Text style={styles.permissionTitle}>Location Access Needed</Text>
                <Text style={styles.permissionSubtitle}>
                  Coastal Karnataka Guide uses your device GPS to detect when you reach historic sites and unlock their stories.
                </Text>
                <PrimaryButton
                  label="Enable Location"
                  onPress={retryPermission}
                  style={styles.permissionBtn}
                  accessibilityLabel="Enable location permission"
                />
                {__DEV__ && (
                  <SecondaryButton
                    label="Switch to Simulator (Dev)"
                    onPress={() => setMode('simulated')}
                    style={styles.permissionDevBtn}
                    accessibilityLabel="Switch to simulated location"
                  />
                )}
              </View>
            </View>
          ) : showArrivalCard ? (
            // ── M6.4 / M7: Elevated Destination Arrival Moment ───────────
            <View style={styles.arrivalCard} accessibilityLiveRegion="polite">
              <View style={styles.arrivalCardHeader}>
                <View style={styles.arrivalBadgeIcon}>
                  <Text style={styles.arrivalCheckmark}>✓</Text>
                </View>
                <View style={styles.arrivalCardTitles}>
                  <Text style={styles.arrivalOverline}>DESTINATION REACHED</Text>
                  <Text style={styles.arrivalAttractionName} numberOfLines={2}>
                    {currentAttraction?.name ?? currentStop?.attractionId ?? 'This Stop'}
                  </Text>
                </View>
              </View>

              <Text style={styles.arrivalDescription}>
                You have arrived within the landmark grounds. Stand near the courtyard and take in the surroundings before opening the story.
              </Text>

              <PrimaryButton
                label={arrivalCtaLabel}
                onPress={handleExploreThisPlace}
                style={styles.arrivalCtaBtn}
                accessibilityLabel={
                  currentStory
                    ? `Explore ${currentAttraction?.name ?? 'this place'} — read the story`
                    : `Learn about ${currentAttraction?.name ?? 'this place'}`
                }
              />
            </View>
          ) : isReached ? (
            // ── Phase 2: Compact arrived badge after story opened ────────
            <View style={styles.arrivedBanner}>
              <View style={styles.arrivedIconBadge}>
                <Text style={styles.arrivedIcon}>✓</Text>
              </View>
              <View style={styles.arrivedTextCol}>
                <Text style={styles.arrivedTitle}>At Destination</Text>
                <Text style={styles.arrivedSubtitle}>
                  {currentAttraction?.name ?? 'This stop'} · Story explored
                </Text>
              </View>
            </View>
          ) : isLocationUnavailable ? (
            <View style={styles.unavailableBanner}>
              <Text style={styles.unavailableIcon}>📡</Text>
              <View style={styles.unavailableTextCol}>
                <Text style={styles.unavailableTitle}>Acquiring GPS Fix…</Text>
                <Text style={styles.unavailableSubtitle}>
                  Connecting to satellites. Your tour state is saved and will resume tracking once a signal fix is acquired.
                </Text>
                <SecondaryButton
                  label="Retry GPS"
                  onPress={retryPermission}
                  style={styles.unavailableBtn}
                  accessibilityLabel="Retry GPS location"
                />
              </View>
            </View>
          ) : proximityState === 'nearby' ? (
            // ── Nearby: Traveler is close — warm, encouraging prompt ─────────
            <View style={styles.nearbyCard} accessibilityLiveRegion="polite">
              <View style={styles.enRouteLeft}>
                <View style={[styles.enRouteIconWrap, styles.nearbyIconWrap]}>
                  <Text style={styles.enRouteIcon}>📍</Text>
                </View>
                <View style={styles.enRouteTextCol}>
                  <Text style={styles.nearbyDistance}>
                    {distanceMeters !== null
                      ? `${Math.round(distanceMeters)} m away`
                      : 'Almost there…'}
                  </Text>
                  <Text style={styles.nearbyHint}>
                    {isLowAccuracy
                      ? 'GPS signal low · Keep walking toward the landmark'
                      : 'You\'re close — keep going to unlock the story'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            // ── Far: Calm, place-focused walking indicator ────────────────────
            <View style={styles.enRouteCard}>
              <View style={styles.enRouteLeft}>
                <View style={styles.enRouteIconWrap}>
                  <Text style={styles.enRouteIcon}>👟</Text>
                </View>
                <View style={styles.enRouteTextCol}>
                  <Text style={styles.enRouteDistance}>
                    {distanceMeters !== null
                      ? `${Math.round(distanceMeters)} m to destination`
                      : 'Locating position…'}
                  </Text>
                  <Text style={styles.enRouteHint}>
                    {isLowAccuracy
                      ? 'GPS accuracy is low · Move toward open sky'
                      : 'Walk toward this landmark to unlock its story'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Place Content / Story Teaser ─────────────────────── */}
          {showContentView && currentStory ? (
            <View style={styles.storySection}>
              <View style={styles.storyHeader}>
                <Text style={styles.storyEyebrow}>CURRENT STORY</Text>
                <TouchableOpacity
                  onPress={handleExploreThisPlace}
                  accessibilityRole="button"
                  accessibilityLabel="Re-open full story screen"
                >
                  <Text style={styles.storyReopenLink}>Read Full Screen →</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.storyTitle}>{currentStory.title}</Text>
              <Text style={styles.storyBody}>
                {currentStory.narrationText}
              </Text>
            </View>
          ) : showContentView && !currentStory ? (
            <View style={styles.aboutSection}>
              <Text style={styles.sectionLabel}>ABOUT THIS PLACE</Text>
              <Text style={styles.aboutText}>
                {currentAttraction?.shortDescription ??
                  'Walk toward the landmark to hear its history and narration.'}
              </Text>
              {currentAttraction && (
                <Text style={styles.visitDurationHint}>
                  Estimated visit: ~{currentAttraction.estimatedVisitDurationMinutes} min
                </Text>
              )}
            </View>
          ) : !isReached ? (
            <View style={styles.aboutSection}>
              <Text style={styles.sectionLabel}>ABOUT THIS LANDMARK</Text>
              <Text style={styles.aboutText}>
                {currentAttraction?.shortDescription ??
                  'Walk toward the landmark to hear its history and narration.'}
              </Text>
              <Text style={styles.walkEncouragement}>
                As you reach this site, its centuries-old story will unlock automatically.
              </Text>
            </View>
          ) : null}

          {/* ── Primary Action (When Arrived & Content Viewed) ────── */}
          {showContentView && (
            <View style={styles.actionSection}>
              <PrimaryButton
                label={isFinalStop ? 'Complete Tour ✓' : 'Continue to Next Stop →'}
                onPress={moveToNextStop}
                accessibilityLabel={
                  isFinalStop ? 'Finish and complete tour' : 'Advance to next tour stop'
                }
              />
            </View>
          )}

          {/* ── Developer Simulator Controls (Collapsible, Dev Only) ─ */}
          {__DEV__ && (
            <View style={styles.devCard}>
              <TouchableOpacity
                style={styles.devHeader}
                onPress={() => setDevExpanded(!devExpanded)}
                accessibilityRole="button"
                accessibilityLabel="Toggle Dev Simulator Controls"
              >
                <View style={styles.devHeaderLeft}>
                  <Text style={styles.devTitle}>🛠 DEV SIMULATOR</Text>
                  <Text style={styles.devModeTag}>{isSimulated ? 'SIMULATOR' : 'REAL GPS'}</Text>
                </View>
                <Text style={styles.devToggleArrow}>{devExpanded ? '▲ Hide' : '▼ Expand'}</Text>
              </TouchableOpacity>

              {devExpanded && (
                <View style={styles.devBody}>
                  <Text style={styles.devCoords}>
                    Coords: {simulatedLocation
                      ? `${simulatedLocation.latitude.toFixed(4)}°N, ${simulatedLocation.longitude.toFixed(4)}°E`
                      : 'Acquiring GPS…'}
                  </Text>
                  <Text style={styles.devStatus}>
                    Proximity: {proximityState} · {distanceMeters !== null ? `${Math.round(distanceMeters)}m` : '—'}
                  </Text>

                  {isSimulated ? (
                    <>
                      <View style={styles.devButtons}>
                        <SecondaryButton
                          label="Step 40% Closer"
                          onPress={devControls.stepTowardCurrentStop}
                          style={styles.devBtn}
                        />
                        <SecondaryButton
                          label="Arrive at Stop"
                          onPress={devControls.arriveAtCurrentStop}
                          style={styles.devBtn}
                        />
                      </View>

                      <View style={styles.devButtons}>
                        <SecondaryButton
                          label="Reset Tour & Sim"
                          onPress={devControls.resetSimulator}
                          style={styles.devBtn}
                        />
                        <SecondaryButton
                          label="Use Real GPS"
                          onPress={() => setMode('device')}
                          style={styles.devBtn}
                        />
                      </View>
                    </>
                  ) : (
                    <View style={styles.devButtons}>
                      <SecondaryButton
                        label="Switch to Simulator"
                        onPress={() => setMode('simulated')}
                        style={styles.devBtn}
                      />
                      <SecondaryButton
                        label="Restart GPS"
                        onPress={retryPermission}
                        style={styles.devBtn}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  progressBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressText: {
    ...Typography.overline,
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  attractionName: {
    ...Typography.heading,
    fontSize: 24,
    lineHeight: 32,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },

  // ── Proximity & Permission Status Banners ────────────────────────────
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FDF2F0',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E8A399',
    marginBottom: Spacing.lg,
  },
  permissionIcon: {
    fontSize: 22,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  permissionTextCol: {
    flex: 1,
    gap: Spacing.xs,
  },
  permissionTitle: {
    ...Typography.subheading,
    color: '#8A2518',
    fontWeight: '700',
  },
  permissionSubtitle: {
    ...Typography.bodySmall,
    color: '#6E3A33',
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  permissionBtn: {
    minHeight: 40,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary,
  },
  permissionDevBtn: {
    minHeight: 36,
    paddingVertical: 4,
    marginTop: Spacing.xs,
    borderColor: '#8A2518',
  },

  // ── Elevated Arrival Card (Phase 1) ──────────────────────────────────
  arrivalCard: {
    backgroundColor: Colors.accentLight,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  arrivalCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  arrivalBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  arrivalCheckmark: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  arrivalCardTitles: {
    flex: 1,
  },
  arrivalOverline: {
    ...Typography.overline,
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  arrivalAttractionName: {
    ...Typography.subheading,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  arrivalDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  arrivalCtaBtn: {
    marginTop: Spacing.xs,
  },

  // ── Compact Arrived Banner (Phase 2) ─────────────────────────────────
  arrivedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
    marginBottom: Spacing.lg,
  },
  arrivedIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  arrivedIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  arrivedTextCol: {
    flex: 1,
  },
  arrivedTitle: {
    ...Typography.subheading,
    fontSize: 15,
    color: Colors.accent,
    fontWeight: '700',
  },
  arrivedSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // ── Unavailable Status Banner ────────────────────────────────────────
  unavailableBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F6E05E',
    marginBottom: Spacing.lg,
  },
  unavailableIcon: {
    fontSize: 22,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  unavailableTextCol: {
    flex: 1,
    gap: Spacing.xs,
  },
  unavailableTitle: {
    ...Typography.subheading,
    color: '#744210',
    fontWeight: '700',
  },
  unavailableSubtitle: {
    ...Typography.bodySmall,
    color: '#975A16',
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  unavailableBtn: {
    minHeight: 38,
    paddingVertical: Spacing.xs,
    borderColor: '#B7791F',
  },

  // ── En Route Walking Card ────────────────────────────────────────────
  enRouteCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  enRouteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  enRouteIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  enRouteIcon: {
    fontSize: 20,
  },
  enRouteTextCol: {
    flex: 1,
  },
  enRouteDistance: {
    ...Typography.subheading,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  enRouteHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },

  // ── Nearby Card (proximity = 'nearby') ───────────────────────────────
  nearbyCard: {
    backgroundColor: '#FFFBEB',      // warm amber tint — "almost there"
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: '#F6CF44',          // golden ring: distinct from far/arrived
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  nearbyIconWrap: {
    backgroundColor: '#FEF3C7',      // amber-tinted icon background
  },
  nearbyDistance: {
    ...Typography.subheading,
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',                // deep amber text for high readability
  },
  nearbyHint: {
    ...Typography.caption,
    color: '#78350F',
    marginTop: 2,
    lineHeight: 16,
  },

  // ── Story & Place Sections ───────────────────────────────────────────
  aboutSection: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.overline,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
    letterSpacing: 1.2,
  },
  aboutText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  walkEncouragement: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  visitDurationHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },

  storySection: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  storyEyebrow: {
    ...Typography.overline,
    color: Colors.accent,
    letterSpacing: 1.2,
  },
  storyReopenLink: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
  },
  storyTitle: {
    ...Typography.subheading,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  storyBody: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 24,
  },

  actionSection: {
    marginBottom: Spacing.lg,
  },
  actionPadding: {
    padding: Spacing.lg,
  },

  // ── Dev Controls Card (Collapsible) ──────────────────────────────────
  devCard: {
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: '#F3EFE6',
    borderWidth: 1,
    borderColor: '#D8CFBF',
    overflow: 'hidden',
  },
  devHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  devHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  devTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B5B45',
    letterSpacing: 0.5,
  },
  devModeTag: {
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: '#E2DAC8',
    color: '#4A3B25',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  devToggleArrow: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7A6B56',
  },
  devBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2DAC8',
    paddingTop: Spacing.sm,
  },
  devCoords: {
    fontSize: 12,
    color: '#554734',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  devStatus: {
    fontSize: 12,
    color: '#7A6B56',
    marginBottom: Spacing.sm,
  },
  devButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  devBtn: {
    flex: 1,
    minHeight: 38,
    paddingVertical: Spacing.xs,
    borderColor: '#9E8D77',
  },

  // ── Completion View ──────────────────────────────────────────────────
  completeScroll: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  completeHero: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  completeBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  completeBadgeIcon: {
    fontSize: 32,
  },
  overline: {
    ...Typography.overline,
    color: Colors.accent,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  completeTitle: {
    ...Typography.heading,
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  completeBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '90%',
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  summaryHeader: {
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    paddingBottom: Spacing.xs,
  },
  summaryHeading: {
    ...Typography.subheading,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  summarySub: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  checkIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkIcon: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryTextCol: {
    flex: 1,
  },
  summaryStopNumber: {
    ...Typography.overline,
    fontSize: 9,
    color: Colors.textTertiary,
  },
  summaryText: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  completeActions: {
    gap: Spacing.sm,
  },
  secondarySpacing: {
    marginTop: Spacing.xs,
  },
});
