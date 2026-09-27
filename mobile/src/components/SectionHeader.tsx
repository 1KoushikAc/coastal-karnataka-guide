// src/components/SectionHeader.tsx
// Section label used to introduce content groups in a screen.
// Renders an overline-style label, optionally with a subtitle.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  /** Additional top margin — set false when the header immediately follows another element. */
  spaceAbove?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  spaceAbove = true,
}: Props): React.JSX.Element {
  return (
    <View style={[styles.container, spaceAbove && styles.spaceAbove]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xs,
  },
  spaceAbove: {
    marginTop: Spacing.lg,
  },
  title: {
    ...Typography.overline,
    color: Colors.textTertiary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});
