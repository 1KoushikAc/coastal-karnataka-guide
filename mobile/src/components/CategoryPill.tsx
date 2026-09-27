// src/components/CategoryPill.tsx
// Small pill badge showing a category label.
// Used on TourItem cards and TourPreviewScreen.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme';
import type { Category } from '@shared-types/index';

export const CATEGORY_LABELS: Record<Category, string> = {
  history:      'History',
  religious:    'Religious',
  nature:       'Nature',
  food:         'Food & Flavour',
  architecture: 'Architecture',
  coastal:      'Coastal',
  culture:      'Culture',
};

interface Props {
  category: Category;
}

export function CategoryPill({ category }: Props): React.JSX.Element {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{CATEGORY_LABELS[category]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: Colors.accentLight,
    borderRadius: Radius.full,
    paddingVertical: Spacing.xxs + 2,
    paddingHorizontal: Spacing.sm + 2,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.label,
    color: Colors.accent,
  },
});
