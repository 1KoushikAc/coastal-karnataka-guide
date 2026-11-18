// src/screens/WelcomeScreen.tsx
// =============================================================================
// WelcomeScreen — The Traveler's Gateway to Coastal Karnataka (M7 Redesign)
// =============================================================================
// First impression: atmospheric, calm, place-focused.
// Inspired by Coastal Karnataka's deep ocean, laterite stone, and living heritage.
// Provides an image-led destination discovery presentation with clear distinction
// between curated walking tours and the custom guide builder.
// =============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, Spacing, Typography, Radius, Shadow } from '../theme';
import { PlaceImage } from '../components/PlaceImage';
import { destinations, tours, attractions } from '@data/index';
import { resolveImageSource } from '../utils/images';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props): React.JSX.Element {
  // Active destination is loaded dynamically from data model; Mangalore is the initial destination
  const activeDestination = destinations[0];
  const destinationName = activeDestination?.name ?? 'Mangalore';
  const destinationTagline =
    activeDestination?.tagline ??
    'Self-guided journeys through ancient temples, coastal lookouts, and centuries of living stories.';
  const regionLabel = activeDestination
    ? `${activeDestination.state}, ${activeDestination.country}`
    : 'Coastal Karnataka';

  // Primary curated tour
  const curatedTour = tours.find((t) => t.id === 'mangalore-heritage-walk') ?? tours[0];
  const attractionCount = attractions.length;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Decorative ambient backdrop rings */}
      <View style={styles.ambientRingOuter} />
      <View style={styles.ambientRingInner} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top branding section ──────────────────────────────── */}
        <View style={styles.topSection}>
          <View style={styles.topBarRow}>
            <View style={styles.regionBadge}>
              <Text style={styles.regionDot}>●</Text>
              <Text style={styles.regionText}>{regionLabel.toUpperCase()}</Text>
            </View>

            <TouchableOpacity
              style={styles.quickHelpPill}
              onPress={() => navigation.navigate('QuickHelp', { source: 'welcome' })}
              accessibilityRole="button"
              accessibilityLabel="Open Quick Help"
              activeOpacity={0.8}
            >
              <Text style={styles.quickHelpPillIcon}>🛡️</Text>
              <Text style={styles.quickHelpPillText}>Quick Help</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>
            {destinationName}{'\n'}Heritage Walks
          </Text>

          <Text style={styles.subtitle}>
            {destinationTagline}
          </Text>
        </View>

        {/* ── Destination Showcase Card (Image-led) ─────────────── */}
        <View style={styles.showcaseCard}>
          <PlaceImage
            source={resolveImageSource(activeDestination?.heroImage?.assetKey)}
            category="coastal"
            label={`${destinationName} · ${regionLabel}`}
            isPlaceholder={activeDestination?.heroImage?.isPlaceholder}
            height={150}
            style={styles.showcaseImage}
          />
          <View style={styles.showcaseMetaBar}>
            <View style={styles.showcaseStat}>
              <Text style={styles.showcaseStatValue}>{attractionCount}</Text>
              <Text style={styles.showcaseStatLabel}>Landmarks</Text>
            </View>
            <View style={styles.showcaseDivider} />
            <View style={styles.showcaseStat}>
              <Text style={styles.showcaseStatValue}>GPS</Text>
              <Text style={styles.showcaseStatLabel}>Proximity</Text>
            </View>
            <View style={styles.showcaseDivider} />
            <View style={styles.showcaseStat}>
              <Text style={styles.showcaseStatValue}>100%</Text>
              <Text style={styles.showcaseStatLabel}>Verified</Text>
            </View>
          </View>
        </View>

        {/* ── Clear Discovery Paths (Curated vs Custom) ─────────── */}
        <View style={styles.discoverySection}>
          <Text style={styles.discoveryEyebrow}>HOW WOULD YOU LIKE TO EXPLORE?</Text>

          {/* Option 1: Curated Tour Card */}
          <TouchableOpacity
            style={styles.pathCard}
            onPress={() => navigation.navigate('ChooseInterest')}
            accessibilityRole="button"
            accessibilityLabel="Explore curated walking tours"
            activeOpacity={0.88}
          >
            <View style={styles.pathHeader}>
              <View style={styles.pathBadgeCurated}>
                <Text style={styles.pathBadgeCuratedText}>RECOMMENDED</Text>
              </View>
              <Text style={styles.pathStats}>
                {curatedTour ? `${curatedTour.stops.length} Stops · ~2h` : 'Curated'}
              </Text>
            </View>

            <Text style={styles.pathTitle}>
              {curatedTour ? curatedTour.name : 'Curated Heritage Walks'}
            </Text>
            <Text style={styles.pathDesc}>
              Follow an expertly designed walking route through Mangalore’s oldest temples, chapels, and coastal monuments.
            </Text>

            <View style={styles.pathActionRow}>
              <Text style={styles.pathActionText}>Explore Curated Walks</Text>
              <Text style={styles.pathActionArrow}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Option 2: Build My Own Guide Card */}
          <TouchableOpacity
            style={[styles.pathCard, styles.pathCardCustom]}
            onPress={() => navigation.navigate('TripBuilder', { destinationId: activeDestination?.id })}
            accessibilityRole="button"
            accessibilityLabel="Build your own personalized travel guide"
            activeOpacity={0.88}
          >
            <View style={styles.pathHeader}>
              <View style={styles.pathBadgeCustom}>
                <Text style={styles.pathBadgeCustomText}>CUSTOM PLANNER</Text>
              </View>
              <Text style={styles.pathStats}>Tailored</Text>
            </View>

            <Text style={styles.pathTitle}>Build My Own Guide</Text>
            <Text style={styles.pathDesc}>
              Select your available time, admission preferences, and interests to generate a personalized route.
            </Text>

            <View style={styles.pathActionRow}>
              <Text style={[styles.pathActionText, styles.pathActionTextCustom]}>
                Start Guide Builder
              </Text>
              <Text style={[styles.pathActionArrow, styles.pathActionTextCustom]}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Middle Experience Highlights ─────────────────────── */}
        <View style={styles.featureSection}>
          <View style={styles.featureRow}>
            <View style={styles.featureIconWrap}>
              <Text style={styles.featureIcon}>📍</Text>
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Proximity-Triggered Stories</Text>
              <Text style={styles.featureDesc}>
                Stories and history unlock naturally as your phone reaches each historic landmark.
              </Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIconWrap}>
              <Text style={styles.featureIcon}>👟</Text>
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Walk at Your Own Pace</Text>
              <Text style={styles.featureDesc}>
                No bus schedules or hurried guides. Pause, explore courtyards, and take in the sea breeze.
              </Text>
            </View>
          </View>
        </View>

        {/* ── Bottom Section ───────────────────────────────────── */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.quickHelpBottomCard}
            onPress={() => navigation.navigate('QuickHelp', { source: 'welcome' })}
            accessibilityRole="button"
            accessibilityLabel="Open Quick Help: polite responses, safer places, trusted contact and emergency help"
            activeOpacity={0.85}
          >
            <View style={styles.quickHelpBottomIconWrap}>
              <Text style={styles.quickHelpBottomIcon}>🛡️</Text>
            </View>
            <View style={styles.quickHelpBottomTextCol}>
              <Text style={styles.quickHelpBottomTitle}>Need a little help?</Text>
              <Text style={styles.quickHelpBottomSub}>
                Polite responses, safe public places, trusted contact & verified emergency numbers.
              </Text>
            </View>
            <Text style={styles.quickHelpBottomArrow}>→</Text>
          </TouchableOpacity>

          <Text style={styles.comfortHint}>
            {destinationName} walking companion · Offline-ready local persistence · No account required
          </Text>

          {__DEV__ && (
            <TouchableOpacity
              style={styles.devDiagnosticLink}
              onPress={() => navigation.navigate('DevLocationDiagnostic')}
              accessibilityRole="button"
              accessibilityLabel="Open Developer GPS Diagnostic"
            >
              <Text style={styles.devDiagnosticText}>🛠 GPS Diagnostic (Dev)</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D2D4F',
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  ambientRingOuter: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  ambientRingInner: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  topSection: {
    paddingTop: Spacing.xs,
  },
  topBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickHelpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  quickHelpPillIcon: {
    fontSize: 11,
  },
  quickHelpPillText: {
    ...Typography.caption,
    color: '#D4E6F8',
    fontSize: 11,
    fontWeight: '700',
  },
  regionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  regionDot: {
    fontSize: 8,
    color: Colors.accentLight,
  },
  regionText: {
    ...Typography.overline,
    color: '#D4E6F8',
    letterSpacing: 1.5,
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    ...Typography.display,
    fontSize: 32,
    lineHeight: 40,
    color: Colors.white,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: '#C4D9EC',
  },
  showcaseCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    ...Shadow.md,
  },
  showcaseImage: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  showcaseMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm + 2,
    backgroundColor: 'rgba(11, 35, 62, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  showcaseStat: {
    alignItems: 'center',
    flex: 1,
  },
  showcaseStatValue: {
    ...Typography.subheading,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  showcaseStatLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: '#A0BED9',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  showcaseDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  discoverySection: {
    gap: Spacing.md,
  },
  discoveryEyebrow: {
    ...Typography.overline,
    color: '#A0BED9',
    letterSpacing: 1.2,
    fontSize: 10,
  },
  pathCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md + 2,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  pathCardCustom: {
    backgroundColor: '#F5F9FD',
    borderColor: '#C8DEF4',
  },
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  pathBadgeCurated: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pathBadgeCuratedText: {
    ...Typography.overline,
    fontSize: 9,
    color: Colors.accent,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  pathBadgeCustom: {
    backgroundColor: '#E4EFFB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pathBadgeCustomText: {
    ...Typography.overline,
    fontSize: 9,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  pathStats: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  pathTitle: {
    ...Typography.subheading,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pathDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontSize: 13,
  },
  pathActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs + 2,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  pathActionText: {
    ...Typography.button,
    fontSize: 14,
    color: Colors.primary,
  },
  pathActionTextCustom: {
    color: Colors.primaryDark,
  },
  pathActionArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  featureSection: {
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  featureIcon: {
    fontSize: 18,
  },
  featureTextCol: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    ...Typography.subheading,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  featureDesc: {
    ...Typography.caption,
    fontSize: 12,
    lineHeight: 17,
    color: '#A0BED9',
  },
  bottomSection: {
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  quickHelpBottomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    marginBottom: Spacing.xs,
  },
  quickHelpBottomIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickHelpBottomIcon: {
    fontSize: 18,
  },
  quickHelpBottomTextCol: {
    flex: 1,
    gap: 2,
  },
  quickHelpBottomTitle: {
    ...Typography.subheading,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  quickHelpBottomSub: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 16,
    color: '#A0BED9',
  },
  quickHelpBottomArrow: {
    fontSize: 18,
    color: '#D4E6F8',
    fontWeight: '700',
  },
  comfortHint: {
    ...Typography.caption,
    color: '#7F9EB8',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 16,
  },
  devDiagnosticLink: {
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.xs,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderStyle: 'dashed',
    marginTop: Spacing.xs,
  },
  devDiagnosticText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D4E6F8',
    letterSpacing: 0.3,
  },
});
