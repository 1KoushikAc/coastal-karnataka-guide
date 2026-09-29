// src/screens/WelcomeScreen.tsx
// The first screen a traveler sees.
// Identity: welcoming, calm, place-focused — not an AI chatbot.
// Design: typography-led, strong vertical rhythm, brand blue.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, Spacing, Typography } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props): React.JSX.Element {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* ── Region eyebrow ───────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>COASTAL KARNATAKA</Text>
        <Text style={styles.title}>Your guide to{'\n'}Mangalore's stories</Text>
      </View>

      {/* ── Description ──────────────────────────────────────── */}
      <View style={styles.body}>
        <View style={styles.rule} />
        <Text style={styles.description}>
          Walk through temples, coastal forts, and chapels.
          Each place carries a story that has lasted centuries.
        </Text>
        <Text style={styles.descriptionAlt}>
          Choose a theme. Pick a tour. Let the city speak.
        </Text>
      </View>

      {/* ── Call to action ───────────────────────────────────── */}
      <View style={styles.footer}>
        <PrimaryButton
          label="Begin Exploring"
          variant="inverted"
          onPress={() => navigation.navigate('ChooseInterest')}
          accessibilityLabel="Begin exploring tours in Mangalore"
        />
        <Text style={styles.hint}>No sign-in required · Works offline</Text>
        {__DEV__ && (
          <TouchableOpacity
            style={styles.devDiagnosticLink}
            onPress={() => navigation.navigate('DevLocationDiagnostic')}
            accessibilityRole="button"
            accessibilityLabel="Open Developer GPS Diagnostic"
          >
            <Text style={styles.devDiagnosticText}>🛠 GPS Diagnostic (M6.1 Dev)</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  header: {
    flex: 2,
    justifyContent: 'flex-end',
    paddingBottom: Spacing.xl,
  },
  eyebrow: {
    ...Typography.overline,
    color: Colors.accentLight,
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.display,
    color: Colors.white,
  },
  body: {
    flex: 2,
    justifyContent: 'center',
  },
  rule: {
    height: 1,
    backgroundColor: Colors.primaryLight,
    opacity: 0.4,
    marginBottom: Spacing.lg,
  },
  description: {
    ...Typography.body,
    color: '#C8DCF0',
    lineHeight: 26,
    marginBottom: Spacing.md,
  },
  descriptionAlt: {
    ...Typography.body,
    color: '#A8C4DC',
    lineHeight: 26,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  hint: {
    ...Typography.caption,
    color: '#7A9EC0',
    textAlign: 'center',
  },
  devDiagnosticLink: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    marginTop: Spacing.xs,
  },
  devDiagnosticText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 0.3,
  },
});

