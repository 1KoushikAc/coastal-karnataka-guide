// src/components/InterestItem.tsx
// A single row in the Choose Interest screen.
// Extracted from ChooseInterestScreen to be reusable and testable.

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface Props {
  icon: string;
  label: string;
  tagline: string;
  onPress: () => void;
}

export function InterestItem({
  icon,
  label,
  tagline,
  onPress,
}: Props): React.JSX.Element {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.72}
      accessibilityRole="button"
      accessibilityLabel={`Explore ${label} tours`}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.tagline} numberOfLines={1}>
          {tagline}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 72,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  text: {
    flex: 1,
  },
  label: {
    ...Typography.subheading,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  tagline: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  arrow: {
    fontSize: 22,
    color: Colors.textTertiary,
    marginLeft: Spacing.sm,
  },
});
