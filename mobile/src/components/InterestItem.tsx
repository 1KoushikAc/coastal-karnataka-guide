// src/components/InterestItem.tsx
// =============================================================================
// InterestItem — Theme / Category Card for Interest Selection
// =============================================================================
// Distinctive, touch-friendly card representing a travel interest.
// Styled with subtle coastal warmth, generous touch targets, and clear hierarchy.
// =============================================================================

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors, Radius, Spacing, Typography, Shadow } from '../theme';

interface Props {
  icon: string;
  label: string;
  tagline: string;
  onPress: () => void;
  tourCount?: number;
  isUpcoming?: boolean;
}

export function InterestItem({
  icon,
  label,
  tagline,
  onPress,
  tourCount,
  isUpcoming = false,
}: Props): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.card, isUpcoming && styles.cardUpcoming]}
      onPress={onPress}
      activeOpacity={isUpcoming ? 1 : 0.76}
      disabled={isUpcoming}
      accessibilityRole="button"
      accessibilityLabel={`Explore ${label} tours`}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          <Text style={styles.label}>{label}</Text>
          {tourCount !== undefined && tourCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {tourCount} {tourCount === 1 ? 'Tour' : 'Tours'}
              </Text>
            </View>
          )}
          {isUpcoming && (
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingBadgeText}>In Guide Prep</Text>
            </View>
          )}
        </View>

        <Text style={styles.tagline} numberOfLines={2}>
          {tagline}
        </Text>
      </View>

      {!isUpcoming && <Text style={styles.arrow}>→</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 82,
    ...Shadow.sm,
  },
  cardUpcoming: {
    backgroundColor: '#F9F7F3',
    borderColor: '#ECE7DE',
    opacity: 0.85,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  icon: {
    fontSize: 24,
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: Spacing.xs,
  },
  label: {
    ...Typography.subheading,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  countBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
  },
  upcomingBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  upcomingBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  tagline: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  arrow: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
});
