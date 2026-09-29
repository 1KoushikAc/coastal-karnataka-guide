// src/screens/DevLocationDiagnosticScreen.tsx
// =============================================================================
// DEV ONLY — DeviceLocationProvider Diagnostic Screen (M6.1)
// =============================================================================
// A minimal developer-only screen that:
//   - Instantiates DeviceLocationProvider directly
//   - Shows permission status, GPS coordinates, and update count
//   - Verifies that start/stop/subscribe lifecycle works on a real device
//
// This screen is NOT part of the traveler experience.
// It must ONLY be reachable from the developer navigation path.
// Remove or guard with __DEV__ before any production release.
//
// Device verification checklist (cannot be unit-tested):
//   ☐ Permission dialog appears on first press of "Start GPS"
//   ☐ Permission can be granted
//   ☐ Real coordinates are displayed and match known location
//   ☐ Update counter increments as the device moves
//   ☐ "Stop GPS" calls remove() and halts updates
//   ☐ "Permission Denied" state is clearly shown when denied
// =============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { DeviceLocationProvider, type DeviceLocationStatus } from '../engine/location/DeviceLocationProvider';
import type { GeoPoint } from '../engine/distance';
import type { LocationProvider } from '../engine/location/types';
import { Colors, Spacing, Typography, Radius } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DevLocationDiagnosticScreen(): React.JSX.Element {
  const providerRef = useRef<DeviceLocationProvider | null>(null);

  const [status, setStatus] = useState<DeviceLocationStatus>('idle');
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [log, setLog] = useState<string[]>(['[DEV] GPS Diagnostic ready.']);

  const appendLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog((prev) => [`[${timestamp}] ${msg}`, ...prev].slice(0, 30));
  }, []);

  useEffect(() => {
    // Create provider once; reuse across start/stop cycles
    providerRef.current = new DeviceLocationProvider({ latitude: 0, longitude: 0 });
    appendLog('DeviceLocationProvider instantiated.');
    return () => {
      providerRef.current?.stop();
    };
  }, [appendLog]);

  const handleStart = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) return;

    appendLog('start() called — requesting permission…');
    setStatus('starting');

    // Subscribe before starting so we don't miss the first update
    provider.subscribe((loc: GeoPoint) => {
      setLocation(loc);
      setUpdateCount((c) => c + 1);
    });

    provider.start();

    // Poll status briefly after async start completes
    setTimeout(() => {
      if (providerRef.current) {
        setStatus(providerRef.current.status);
        appendLog(`Status: ${providerRef.current.status} | Permission: ${providerRef.current.permissionStatus}`);
      }
    }, 2000);
  }, [appendLog]);

  const handleStop = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) return;
    provider.stop();
    setStatus(provider.status);
    appendLog('stop() called — GPS subscription removed.');
  }, [appendLog]);

  const statusColor = (s: DeviceLocationStatus): string => {
    if (s === 'active') return Colors.accent;
    if (s === 'permission-denied' || s === 'unavailable') return '#C0392B';
    return Colors.textSecondary;
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.devHeader}>
          <Text style={styles.devTitle}>🛠 GPS DIAGNOSTIC</Text>
          <Text style={styles.devBadge}>DEV ONLY — M6.1</Text>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.label}>PROVIDER STATUS</Text>
          <Text style={[styles.statusValue, { color: statusColor(status) }]}>
            {status.toUpperCase()}
          </Text>
        </View>

        {/* Coordinates */}
        <View style={styles.section}>
          <Text style={styles.label}>CURRENT COORDINATES</Text>
          {location ? (
            <>
              <Text style={styles.coordText}>
                Lat: {location.latitude.toFixed(6)}°
              </Text>
              <Text style={styles.coordText}>
                Lng: {location.longitude.toFixed(6)}°
              </Text>
              <Text style={styles.coordText}>
                Updates received: {updateCount}
              </Text>
            </>
          ) : (
            <Text style={styles.dimText}>No fix yet — press Start GPS</Text>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <PrimaryButton
            label="Start GPS"
            onPress={handleStart}
            accessibilityLabel="Start GPS location provider"
          />
          <SecondaryButton
            label="Stop GPS"
            onPress={handleStop}
            style={styles.stopBtn}
            accessibilityLabel="Stop GPS location provider"
          />
        </View>

        {/* Log */}
        <View style={styles.section}>
          <Text style={styles.label}>EVENT LOG</Text>
          {log.map((entry, idx) => (
            <Text key={idx} style={styles.logLine}>{entry}</Text>
          ))}
        </View>

        {/* Device verification checklist */}
        <View style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>Device Verification Checklist</Text>
          {[
            'Permission dialog appears on first "Start GPS"',
            'Permission can be granted',
            'Real coordinates displayed and match known location',
            'Update counter increments as device moves',
            '"Stop GPS" halts updates (counter freezes)',
            '"Permission Denied" state shown if denied',
          ].map((item) => (
            <Text key={item} style={styles.checklistItem}>☐ {item}</Text>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  devHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3EFE6',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#D8CFBF',
    borderStyle: 'dashed',
  },
  devTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B5B45',
    letterSpacing: 0.5,
  },
  devBadge: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#E2DAC8',
    color: '#4A3B25',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  section: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  statusValue: {
    ...Typography.subheading,
    fontFamily: 'monospace',
  },
  coordText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  dimText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  controls: {
    gap: Spacing.sm,
  },
  stopBtn: {
    marginTop: Spacing.xs,
  },
  logLine: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  checklistCard: {
    backgroundColor: '#EAF3EC',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#B8D4BC',
    gap: Spacing.xs,
  },
  checklistTitle: {
    ...Typography.label,
    color: '#2D6A3A',
    marginBottom: Spacing.xs,
  },
  checklistItem: {
    fontSize: 12,
    color: '#3A5C3E',
    lineHeight: 20,
  },
});
