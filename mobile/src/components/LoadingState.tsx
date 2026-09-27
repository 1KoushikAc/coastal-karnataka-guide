// src/components/LoadingState.tsx
// Shown while async data is being fetched.
// Currently the app uses static M1 data, so this is reserved for future
// milestones that add network calls. Included here for API completeness.

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';

interface Props {
  message?: string;
}

export function LoadingState({
  message = 'Loading…',
}: Props): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
