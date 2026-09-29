// src/screens/ActiveTourScreen.tsx
// =============================================================================
// ActiveTourScreen — Guided Active Tour Experience
// =============================================================================
// The primary walking tour screen. Displays the current stop, distance/proximity,
// narration story upon arrival, and tour progress.
//
// UX Principles:
//   - Calm, spacious, place-focused — not a dashboard.
//   - Current place and story are the visual heroes.
//   - Progress and distance are clear but secondary.
//   - No chatbot aesthetics, no generic AI styling.
//   - Dedicated, clearly labeled DEV SIMULATOR section for development testing.
// =============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
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
    currentStop,
    currentAttraction,
    currentStory,
    distanceMeters,
    simulatedLocation,
    isReached,
    isComplete,
    stopNumber,
    totalStops,
    moveToNextStop,
    resetTour,
    devControls,
    isPermissionDenied,
    isLocationUnavailable,
    isLowAccuracy,
    retryPermission,
    setMode,
    isSimulated,
    locationStatus,
  } = useActiveTour(tourId);

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
        <ScrollView contentContainerStyle={styles.completeScroll}>
          <View style={styles.completeHero}>
            <Text style={styles.completeIcon}>🎉</Text>
            <Text style={styles.overline}>TOUR COMPLETE</Text>
            <Text style={styles.completeTitle}>{tour.name}</Text>
            <Text style={styles.completeBody}>
              You have completed all {totalStops} stops along this journey.
              Mangalore's rich heritage and living stories walk with you.
            </Text>
          </View>

          {/* Stops summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryHeading}>Places Explored</Text>
            {tour.stops.map((stop, idx) => (
              <View key={stop.id} style={styles.summaryRow}>
                <Text style={styles.checkIcon}>✓</Text>
                <Text style={styles.summaryText}>
                  Stop {idx + 1}: {stop.id.replace('stop-', '').replace(/-/g, ' ')}
                </Text>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.completeActions}>
            <PrimaryButton
              label="Explore Other Tours"
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

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Place Hero Image ─────────────────────────────────── */}
        <PlaceImage
          source={resolveImageSource(currentAttraction?.image?.assetKey)}
          category={currentAttraction?.categories[0] ?? tour.category}
          label={currentAttraction?.name ?? 'Current Stop'}
          height={210}
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
                  Coastal Karnataka Guide uses your location to discover landmarks and share their stories as you walk. Please allow location access to continue.
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
          ) : isReached ? (
            <View style={styles.arrivedBanner}>
              <Text style={styles.arrivedIcon}>✓</Text>
              <View style={styles.arrivedTextCol}>
                <Text style={styles.arrivedTitle}>You have arrived</Text>
                <Text style={styles.arrivedSubtitle}>
                  The story of this place is waiting below.
                </Text>
              </View>
            </View>
          ) : isLocationUnavailable ? (
            <View style={styles.unavailableBanner}>
              <Text style={styles.unavailableIcon}>📡</Text>
              <View style={styles.unavailableTextCol}>
                <Text style={styles.unavailableTitle}>GPS Signal Temporarily Unavailable</Text>
                <Text style={styles.unavailableSubtitle}>
                  Waiting for location fix. Your tour progress is saved and will resume automatically once signal returns.
                </Text>
                <SecondaryButton
                  label="Retry GPS"
                  onPress={retryPermission}
                  style={styles.unavailableBtn}
                  accessibilityLabel="Retry GPS location"
                />
                {__DEV__ && (
                  <SecondaryButton
                    label="Switch to Simulator (Dev)"
                    onPress={() => setMode('simulated')}
                    style={styles.unavailableDevBtn}
                    accessibilityLabel="Switch to simulated location"
                  />
                )}
              </View>
            </View>
          ) : (
            <View style={styles.enRouteBanner}>
              <Text style={styles.enRouteIcon}>📍</Text>
              <View style={styles.enRouteTextCol}>
                <Text style={styles.enRouteDistance}>
                  {distanceMeters !== null ? `About ${Math.round(distanceMeters)} m away` : 'Locating…'}
                </Text>
                <Text style={styles.enRouteHint}>
                  {isLowAccuracy
                    ? 'GPS accuracy is low. Move towards open sky for better tracking.'
                    : 'Walk toward this landmark to discover its story.'}
                </Text>
              </View>
            </View>
          )}

          {/* ── Story / Place Content ────────────────────────────── */}
          {isReached && currentStory ? (
            <View style={styles.storySection}>
              <Text style={styles.storyEyebrow}>THE STORY</Text>
              <Text style={styles.storyTitle}>{currentStory.title}</Text>
              <Text style={styles.storyBody}>{currentStory.narrationText}</Text>
            </View>
          ) : (
            <View style={styles.aboutSection}>
              <Text style={styles.sectionLabel}>ABOUT THIS PLACE</Text>
              <Text style={styles.aboutText}>
                {currentAttraction?.shortDescription ??
                  'Walk toward the landmark to hear its history and narration.'}
              </Text>
              <Text style={styles.walkEncouragement}>
                As you get closer, the local story of this landmark will unfold.
              </Text>
            </View>
          )}

          {/* ── Primary Action (When Arrived) ─────────────────────── */}
          {isReached && (
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

          {/* ── Developer Simulator Controls (Clearly Marked, Dev Only) ── */}
          {__DEV__ && (
            <View style={styles.devCard}>
              <View style={styles.devHeader}>
                <Text style={styles.devTitle}>
                  🛠 {isSimulated ? 'SIMULATED LOCATION' : 'REAL GPS'} CONTROLS
                </Text>
                <Text style={styles.devBadge}>DEV ONLY</Text>
              </View>

              <Text style={styles.devCoords}>
                Mode: {isSimulated ? 'Simulated' : `Real GPS (${locationStatus.toUpperCase()})`}
              </Text>
              <Text style={styles.devCoords}>
                Coordinates:{' '}
                {simulatedLocation
                  ? `${simulatedLocation.latitude.toFixed(4)}°N, ${simulatedLocation.longitude.toFixed(4)}°E${
                      simulatedLocation.accuracy != null
                        ? ` (±${Math.round(simulatedLocation.accuracy)}m${isLowAccuracy ? ', low conf' : ''})`
                        : ''
                    }`
                  : 'Acquiring GPS…'}
              </Text>
              <Text style={styles.devStatus}>
                Status: {isReached ? 'Inside trigger radius (arrived)' : 'En route (outside radius)'} ·{' '}
                {distanceMeters !== null ? `${Math.round(distanceMeters)}m to target` : ''}
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
                    label="Switch to Simulator (Dev)"
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
    color: Colors.textSecondary,
  },
  attractionName: {
    ...Typography.heading,
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
    fontSize: 24,
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

  // ── Unavailable Status Banner ─────────────────────────────────────────
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
    fontSize: 24,
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
  unavailableDevBtn: {
    minHeight: 36,
    paddingVertical: 4,
    marginTop: Spacing.xs,
    borderColor: '#744210',
  },

  enRouteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  enRouteIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  enRouteTextCol: {
    flex: 1,
  },
  enRouteDistance: {
    ...Typography.subheading,
    color: Colors.primary,
  },
  enRouteHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },

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
  arrivedIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.accent,
    marginRight: Spacing.sm,
  },
  arrivedTextCol: {
    flex: 1,
  },
  arrivedTitle: {
    ...Typography.subheading,
    color: Colors.accent,
    fontWeight: '700',
  },
  arrivedSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // ── Story & Place Sections ──────────────────────────────────────────
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

  storySection: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  storyEyebrow: {
    ...Typography.overline,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  storyTitle: {
    ...Typography.subheading,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  storyBody: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 26,
  },

  actionSection: {
    marginBottom: Spacing.xl,
  },
  actionPadding: {
    padding: Spacing.lg,
  },

  // ── Dev Controls Card ────────────────────────────────────────────────
  devCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: '#F3EFE6',
    borderWidth: 1,
    borderColor: '#D8CFBF',
    borderStyle: 'dashed',
  },
  devHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  devTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B5B45',
    letterSpacing: 0.5,
  },
  devBadge: {
    fontSize: 9,
    fontWeight: '700',
    backgroundColor: '#E2DAC8',
    color: '#4A3B25',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
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
    minHeight: 40,
    paddingVertical: Spacing.xs,
    borderColor: '#9E8D77',
  },
  devResetBtn: {
    minHeight: 40,
    paddingVertical: Spacing.xs,
    borderColor: '#9E8D77',
  },

  // ── Completion View ──────────────────────────────────────────────────
  completeScroll: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  completeHero: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  completeIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  overline: {
    ...Typography.overline,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  completeTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  completeBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  summaryHeading: {
    ...Typography.subheading,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  checkIcon: {
    color: Colors.accent,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  summaryText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  completeActions: {
    gap: Spacing.md,
  },
  secondarySpacing: {
    marginTop: Spacing.xs,
  },
});
