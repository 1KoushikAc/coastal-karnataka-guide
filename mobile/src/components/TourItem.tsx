// src/components/TourItem.tsx
// =============================================================================
// TourItem — Destination Walking Tour Card
// =============================================================================
// Displays a curated tour with place imagery, key itinerary stats,
// and clear visual hierarchy for the traveler.
// =============================================================================

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../theme';
import { CategoryPill } from './CategoryPill';
import { PlaceImage } from './PlaceImage';
import { resolveImageSource } from '../utils/images';
import { formatDuration } from '../utils/format';
import type { Tour } from '@shared-types/index';

interface Props {
  tour: Tour;
  onPress: () => void;
}

export function TourItem({ tour, onPress }: Props): React.JSX.Element {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${tour.name}`}
    >
      {/* Tour hero visual banner */}
      <PlaceImage
        source={resolveImageSource(tour.heroImage?.assetKey)}
        category={tour.category}
        label={tour.name}
        isPlaceholder={tour.heroImage?.isPlaceholder}
        height={140}
      />

      <View style={styles.body}>
        {/* Category & Walking indicator */}
        <View style={styles.tagRow}>
          <CategoryPill category={tour.category} />
          <View style={styles.walkingBadge}>
            <Text style={styles.walkingBadgeText}>WALKING TOUR</Text>
          </View>
        </View>

        {/* Tour name */}
        <Text style={styles.name}>{tour.name}</Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {tour.description}
        </Text>

        {/* Itinerary Stats Chips */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={styles.statText}>
              {tour.stops.length} {tour.stops.length === 1 ? 'Stop' : 'Stops'}
            </Text>
          </View>

          <View style={styles.statChip}>
            <Text style={styles.statIcon}>⏱</Text>
            <Text style={styles.statText}>
              {formatDuration(tour.estimatedDurationMinutes)}
            </Text>
          </View>

          <View style={styles.statChip}>
            <Text style={styles.statIcon}>👟</Text>
            <Text style={styles.statText}>Self-Guided</Text>
          </View>
        </View>

        {/* Footer CTA */}
        <View style={styles.cardFooter}>
          <Text style={styles.ctaText}>View Tour Itinerary</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </View>
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
    ...Shadow.md,
  },
  body: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  walkingBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  walkingBadgeText: {
    ...Typography.overline,
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  name: {
    ...Typography.heading,
    fontSize: 20,
    lineHeight: 26,
    color: Colors.textPrimary,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    fontSize: 13,
  },
  statText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  ctaText: {
    ...Typography.button,
    fontSize: 14,
    color: Colors.primary,
  },
  ctaArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
});
