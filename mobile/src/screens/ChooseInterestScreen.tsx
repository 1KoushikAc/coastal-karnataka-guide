// src/screens/ChooseInterestScreen.tsx
// =============================================================================
// ChooseInterestScreen — Destination & Walking Theme Discovery Hub
// =============================================================================
// Lets travelers explore Mangalore through both thematic curated walks and
// an image-led showcase of all verified local landmarks.
// =============================================================================

import React, { useMemo } from 'react';
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
import { InterestItem } from '../components/InterestItem';
import { PlaceImage } from '../components/PlaceImage';
import { CategoryPill } from '../components/CategoryPill';
import { resolveImageSource } from '../utils/images';
import type { RootStackParamList } from '../navigation/types';
import type { Category, Attraction } from '@shared-types/index';
import { tours, attractions } from '@data/index';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseInterest'>;

interface CategoryMeta {
  icon: string;
  label: string;
  tagline: string;
}

const ALL_CATEGORY_META: Record<Category, CategoryMeta> = {
  history: {
    icon: '🏛',
    label: 'History & Heritage',
    tagline: 'Ancient temples, coastal lookouts, and layered civilisations',
  },
  religious: {
    icon: '🪔',
    label: 'Sacred Spaces',
    tagline: 'Centuries-old temples, chapels, and quiet sanctums',
  },
  coastal: {
    icon: '⛵',
    label: 'The Coastal Shore',
    tagline: 'River mouths, Arabian Sea shores, and maritime routes',
  },
  food: {
    icon: '🍛',
    label: 'Flavours of the Coast',
    tagline: 'Traditional fish markets, ghee roasts, and local bakeries',
  },
  architecture: {
    icon: '🕌',
    label: 'Architecture & Craft',
    tagline: 'Laterite stone carvings and European Renaissance frescoes',
  },
  nature: {
    icon: '🌿',
    label: 'Nature & Groves',
    tagline: 'Sacred groves, hillside springs, and coconut shores',
  },
  culture: {
    icon: '🎭',
    label: 'Living Culture',
    tagline: 'Folk traditions, Yakshagana roots, and artisan communities',
  },
};

export function ChooseInterestScreen({ navigation }: Props): React.JSX.Element {
  // Discover categories that currently have tours
  const activeCategories = useMemo<Category[]>(() => {
    const set = new Set<Category>();
    tours.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, []);

  // Compute tour count per category
  const tourCounts = useMemo<Record<Category, number>>(() => {
    const counts = {} as Record<Category, number>;
    tours.forEach((t) => {
      counts[t.category] = (counts[t.category] ?? 0) + 1;
    });
    return counts;
  }, []);

  // Upcoming categories in development
  const upcomingCategories = useMemo<Category[]>(() => {
    const all = Object.keys(ALL_CATEGORY_META) as Category[];
    return all.filter((c) => !activeCategories.includes(c));
  }, [activeCategories]);

  // Mangalore curated tour stops map
  const curatedTour = tours.find((t) => t.id === 'mangalore-heritage-walk');
  const curatedStopAttractionIds = useMemo(() => {
    return new Set(curatedTour?.stops.map((s) => s.attractionId) ?? []);
  }, [curatedTour]);

  const handleLandmarkAction = (attr: Attraction) => {
    if (curatedStopAttractionIds.has(attr.id) && curatedTour) {
      navigation.navigate('TourPreview', { tourId: curatedTour.id });
    } else {
      navigation.navigate('TripBuilder', { destinationId: attr.cityId });
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>DESTINATION DISCOVERY</Text>
          <Text style={styles.heading}>Explore Mangalore</Text>
          <Text style={styles.subheading}>
            Browse curated walking themes or explore the five verified landmarks of the coastal city.
          </Text>
        </View>

        {/* ── 1. Curated Themes ─────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CURATED WALKING THEMES</Text>
          <View style={styles.list}>
            {activeCategories.map((cat) => {
              const meta = ALL_CATEGORY_META[cat];
              return (
                <InterestItem
                  key={cat}
                  icon={meta.icon}
                  label={meta.label}
                  tagline={meta.tagline}
                  tourCount={tourCounts[cat] ?? 0}
                  onPress={() => navigation.navigate('ChooseTour', { category: cat })}
                />
              );
            })}
          </View>
        </View>

        {/* ── 2. Build Your Own Guide Callout ───────────────── */}
        <View style={styles.customGuideCard}>
          <View style={styles.customGuideIconWrap}>
            <Text style={styles.customGuideIcon}>🧭</Text>
          </View>
          <View style={styles.customGuideTextCol}>
            <Text style={styles.customGuideTitle}>Build Your Own Itinerary</Text>
            <Text style={styles.customGuideDesc}>
              Tailor a personal walking route to your schedule, admission budget, and favorite themes.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.customGuideBtn}
            onPress={() => navigation.navigate('TripBuilder')}
            accessibilityRole="button"
            accessibilityLabel="Open Trip Builder to create a personalized tour"
            activeOpacity={0.8}
          >
            <Text style={styles.customGuideBtnText}>Build Tour →</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. Featured Mangalore Landmarks (Image-Led) ──── */}
        <View style={styles.section}>
          <View style={styles.landmarksHeader}>
            <Text style={styles.sectionTitle}>MANGALORE LANDMARKS ({attractions.length})</Text>
            <Text style={styles.landmarksHint}>Verified heritage places</Text>
          </View>

          <View style={styles.landmarksList}>
            {attractions.map((attr) => {
              const primaryCategory = attr.categories[0] ?? 'history';
              const isIncludedInCurated = curatedStopAttractionIds.has(attr.id);

              return (
                <View key={attr.id} style={styles.landmarkCard}>
                  {/* Visual banner */}
                  <PlaceImage
                    source={resolveImageSource(attr.image?.assetKey)}
                    category={primaryCategory}
                    label={attr.name}
                    isPlaceholder={attr.image?.isPlaceholder}
                    height={130}
                    style={styles.landmarkImage}
                  />

                  {/* Body Content */}
                  <View style={styles.landmarkBody}>
                    <View style={styles.landmarkMetaRow}>
                      <CategoryPill category={primaryCategory} />
                      <View style={styles.admissionBadge}>
                        <Text style={styles.admissionText}>
                          {attr.admission?.isFree ? 'Free Admission' : 'Admission site'}
                        </Text>
                      </View>
                      <Text style={styles.durationChip}>
                        ⏱ ~{attr.estimatedVisitDurationMinutes}m
                      </Text>
                    </View>

                    <Text style={styles.landmarkName}>{attr.name}</Text>

                    <Text style={styles.landmarkDesc} numberOfLines={2}>
                      {attr.shortDescription}
                    </Text>

                    {/* Action link */}
                    <TouchableOpacity
                      style={styles.landmarkAction}
                      onPress={() => handleLandmarkAction(attr)}
                      accessibilityRole="button"
                      accessibilityLabel={`Explore ${attr.name}`}
                    >
                      <Text style={styles.landmarkActionText}>
                        {isIncludedInCurated
                          ? 'Included in Mangalore Heritage Walk →'
                          : 'Include in Custom Guide →'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── 4. Upcoming Themes ────────────────────────────── */}
        {upcomingCategories.length > 0 && (
          <View style={styles.sectionUpcoming}>
            <View style={styles.upcomingHeader}>
              <Text style={styles.sectionTitle}>IN THE GUIDE ARCHIVES</Text>
              <Text style={styles.upcomingHint}>Upcoming themed walks</Text>
            </View>
            <View style={styles.list}>
              {upcomingCategories.slice(0, 3).map((cat) => {
                const meta = ALL_CATEGORY_META[cat];
                return (
                  <InterestItem
                    key={cat}
                    icon={meta.icon}
                    label={meta.label}
                    tagline={meta.tagline}
                    isUpcoming
                    onPress={() => {}}
                  />
                );
              })}
            </View>
          </View>
        )}
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  pageHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    ...Typography.overline,
    color: Colors.accent,
    marginBottom: 4,
  },
  heading: {
    ...Typography.heading,
    fontSize: 28,
    lineHeight: 36,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subheading: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 23,
    fontSize: 15,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.overline,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    letterSpacing: 1.2,
  },
  list: {
    gap: Spacing.sm,
  },
  customGuideCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: '#F0F6FC',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#CDE1F5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.sm,
  },
  customGuideIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: '#E1EDF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customGuideIcon: {
    fontSize: 22,
  },
  customGuideTextCol: {
    flex: 1,
    gap: 2,
  },
  customGuideTitle: {
    ...Typography.subheading,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  customGuideDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  customGuideBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.sm,
    minHeight: 38,
    justifyContent: 'center',
  },
  customGuideBtnText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  landmarksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  landmarksHint: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  landmarksList: {
    gap: Spacing.md,
  },
  landmarkCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  landmarkImage: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  landmarkBody: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  landmarkMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
    marginBottom: 2,
  },
  admissionBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  admissionText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  durationChip: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textTertiary,
    marginLeft: 'auto',
  },
  landmarkName: {
    ...Typography.subheading,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  landmarkDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontSize: 13,
  },
  landmarkAction: {
    paddingTop: Spacing.xs,
    marginTop: 2,
  },
  landmarkActionText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionUpcoming: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  upcomingHint: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textTertiary,
  },
});
