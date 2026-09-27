// src/screens/ChooseInterestScreen.tsx
// Lets the traveler choose a theme for their exploration.
// Categories derived from M1 tour data. Uses InterestItem component.

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, Spacing, Typography } from '../theme';
import { InterestItem } from '../components/InterestItem';
import type { RootStackParamList } from '../navigation/types';
import type { Category } from '@shared-types/index';
import { tours } from '@data/index';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseInterest'>;

// Travel-flavoured metadata per category.
// Only categories present in live tour data will appear on screen.
const CATEGORY_META: Record<Category, { icon: string; label: string; tagline: string }> = {
  history: {
    icon: '🏛',
    label: 'History',
    tagline: 'Ancient temples, colonial forts, layered civilisations',
  },
  religious: {
    icon: '🪔',
    label: 'Religious Sites',
    tagline: 'Temples, churches, and sacred spaces of Mangalore',
  },
  nature: {
    icon: '🌿',
    label: 'Nature',
    tagline: 'Beaches, rivers, and the coastal landscape',
  },
  food: {
    icon: '🍛',
    label: 'Food & Flavour',
    tagline: 'The distinct cuisine of the Tulu coast',
  },
  architecture: {
    icon: '🕌',
    label: 'Architecture',
    tagline: 'Craftsmanship across centuries and cultures',
  },
  coastal: {
    icon: '⛵',
    label: 'Coastal',
    tagline: 'The sea, the harbour, and the fishing coast',
  },
  culture: {
    icon: '🎭',
    label: 'Culture',
    tagline: 'Art, tradition, and the living heritage of Tulu Nadu',
  },
};

export function ChooseInterestScreen({ navigation }: Props): React.JSX.Element {
  const categories = useMemo<Category[]>(() => {
    const seen = new Set<Category>();
    tours.forEach((t) => seen.add(t.category));
    return Array.from(seen);
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen header */}
        <View style={styles.pageHeader}>
          <Text style={styles.heading}>What draws you?</Text>
          <Text style={styles.subheading}>
            Pick a theme to discover matching tours.
          </Text>
        </View>

        {/* Interest list */}
        <View style={styles.list}>
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <InterestItem
                key={cat}
                icon={meta.icon}
                label={meta.label}
                tagline={meta.tagline}
                onPress={() => navigation.navigate('ChooseTour', { category: cat })}
              />
            );
          })}
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  pageHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heading: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subheading: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
});
