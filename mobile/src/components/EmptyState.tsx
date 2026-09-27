// src/components/EmptyState.tsx
// Shown when a list or section has no content.
// Consistent empty-state treatment across the app.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';

interface Props {
  icon?: string;   // emoji icon
  title: string;
  body?: string;
}

export function EmptyState({
  icon = '🗺️',
  title,
  body,
}: Props): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 44,
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.subheading,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
