// src/screens/ChooseTourScreen.tsx
// =============================================================================
// ChooseTourScreen — Select a Walking Itinerary
// =============================================================================
// Displays available tours for the chosen interest.
// Uses rich TourItem cards with place-focused hierarchy and custom guide option.
// =============================================================================

import React, { useMemo } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, Spacing, Typography, Radius } from '../theme';
import { TourItem } from '../components/TourItem';
import { EmptyState } from '../components/EmptyState';
import type { RootStackParamList } from '../navigation/types';
import type { Tour } from '@shared-types/index';
import { tours } from '@data/index';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseTour'>;

const CATEGORY_TITLES: Record<string, string> = {
  history: 'History & Heritage Walks',
  religious: 'Sacred Spaces of Mangalore',
  coastal: 'Coastal & River Shore Routes',
  food: 'Culinary Walking Trails',
  architecture: 'Architecture & Craft Walks',
  nature: 'Nature & Coastal Groves',
  culture: 'Living Culture & Traditions',
};

export function ChooseTourScreen({ route, navigation }: Props): React.JSX.Element {
  const { category } = route.params;

  const filteredTours = useMemo<Tour[]>(
    () => tours.filter((t) => t.category === category),
    [category],
  );

  const categoryTitle = CATEGORY_TITLES[category] ?? 'Tours in Mangalore';

  if (filteredTours.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <EmptyState
          icon="🗺️"
          title="No Tours Available"
          body="Curators are currently designing itineraries for this theme in Mangalore."
        />
        <View style={styles.emptyActionWrap}>
          <TouchableOpacity
            style={styles.customGuideLink}
            onPress={() => navigation.navigate('TripBuilder')}
            accessibilityRole="button"
            accessibilityLabel="Create a custom tour in the trip builder"
          >
            <Text style={styles.customGuideLinkText}>
              Create a custom itinerary for this theme →
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={filteredTours}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>CURATED ITINERARIES</Text>
            <Text style={styles.title}>{categoryTitle}</Text>
            <Text style={styles.subtitle}>
              Walk through historic courtyards, view centuries-old architecture, and hear the stories of each stop.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TourItem
            tour={item}
            onPress={() => navigation.navigate('TourPreview', { tourId: item.id })}
          />
        )}
        ListFooterComponent={
          <View style={styles.footerWrap}>
            <View style={styles.footerCard}>
              <Text style={styles.footerTitle}>Want a customized schedule?</Text>
              <Text style={styles.footerDesc}>
                Set your exact time budget, select preferred stops, and generate a personal route.
              </Text>
              <TouchableOpacity
                style={styles.footerBtn}
                onPress={() => navigation.navigate('TripBuilder')}
                accessibilityRole="button"
                accessibilityLabel="Open Trip Builder"
              >
                <Text style={styles.footerBtnText}>Build My Own Guide →</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.md,
  },
  eyebrow: {
    ...Typography.overline,
    color: Colors.accent,
    marginBottom: 4,
  },
  title: {
    ...Typography.heading,
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  emptyActionWrap: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  customGuideLink: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  customGuideLinkText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '700',
  },
  footerWrap: {
    marginTop: Spacing.md,
  },
  footerCard: {
    backgroundColor: '#F2F7FC',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#D4E6F8',
    gap: Spacing.xs,
  },
  footerTitle: {
    ...Typography.subheading,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  footerDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.xs,
    marginTop: 4,
  },
  footerBtnText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
});
