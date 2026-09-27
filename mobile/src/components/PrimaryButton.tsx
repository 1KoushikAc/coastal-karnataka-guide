// src/components/PrimaryButton.tsx
// Reusable primary action button.
// Variants:
//   'default'  — primary bg, white text   (ocean → white)
//   'inverted' — white bg, primary text   (white → ocean)

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme';

export type ButtonVariant = 'default' | 'inverted';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'default',
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
}: Props): React.JSX.Element {
  const isInverted = variant === 'inverted';
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isInverted ? styles.inverted : styles.default,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color={isInverted ? Colors.primary : Colors.white} />
      ) : (
        <Text style={[styles.label, isInverted ? styles.labelInverted : styles.labelDefault]}>
          {label}
        </Text>
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
  },
  default: {
    backgroundColor: Colors.primary,
  },
  inverted: {
    backgroundColor: Colors.white,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...Typography.button,
  },
  labelDefault: {
    color: Colors.white,
  },
  labelInverted: {
    color: Colors.primary,
  },
});
