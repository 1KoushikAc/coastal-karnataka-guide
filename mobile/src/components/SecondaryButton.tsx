// src/components/SecondaryButton.tsx
// Outlined / ghost action button. Lower visual weight than PrimaryButton.
// Use for secondary actions alongside a primary CTA.

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function SecondaryButton({
  label,
  onPress,
  loading = false,
  accessibilityLabel,
  style,
}: Props): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {loading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.transparent,
  },
  label: {
    ...Typography.button,
    color: Colors.primary,
  },
});
