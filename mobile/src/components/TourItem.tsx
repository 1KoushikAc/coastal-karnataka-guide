// src/components/TourItem.tsx
// A card representing a single tour in the Choose Tour screen.
// Extracted from ChooseTourScreen for reuse and visual consistency.

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors, Radius, Spacing, Typography, CategoryColors } from '../theme';
import { CategoryPill } from './CategoryPill';
import { formatDuration } from '../utils/format';
import type { Tour } from '@shared-types/index';

interface Props {
  tour: Tour;
  onPress: () => void;
}

export function TourItem({ tour, onPress }: Props): React.JSX.Element {
  const accentColor = CategoryColors[tour.category] ?? CategoryColors['default'];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${tour.name}`}
    >
      {/* Top accent bar — category colour gives visual identity */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.body}>
        {/* Category pill */}
        <CategoryPill category={tour.category} />

        {/* Tour name */}
        <Text style={styles.name}>{tour.name}</Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={3}>
          {tour.description}
        </Text>

        {/* Meta row */}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>{tour.stops.length}</Text>
            <Text style={styles.metaKey}>
              {tour.stops.length === 1 ? 'stop' : 'stops'}
            </Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaValue}>
              {formatDuration(tour.estimatedDurationMinutes)}
            </Text>
            <Text style={styles.metaKey}>estimated</Text>
          </View>
        </View>

        <Text style={styles.cta}>View tour details →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  body: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  name: {
    ...Typography.subheading,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metaValue: {
    ...Typography.subheading,
    color: Colors.primary,
  },
  metaKey: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
  },
  cta: {
    ...Typography.label,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
});
