// mobile/src/screens/TripBuilderScreen.tsx
// =============================================================================
// TripBuilderScreen — Personalized Route Preferences (M8)
// =============================================================================
// Allows the traveler to configure:
//   - Destination (Mangalore)
//   - Available time (1–2 hrs, 3–4 hrs, half day, full day)
//   - Budget tier (free, moderate, any)
//   - Interests (multi-select categories)
//   - Skipped places (explicit exclusion of landmarks)
//
// Privacy & Design rules:
//   - No inference of religion, beliefs, gender, or sensitive demographics.
//   - Clear traveler agency: traveler explicitly decides what to visit or skip.
//   - Deterministic trip generation using existing M1 structured data.
// =============================================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, Spacing, Typography, Radius, Shadow } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { destinations, attractions, stories } from '@data/index';
import type { Category, Attraction } from '@shared-types/index';
import type { TimeOption, BudgetTier, TravelerPreferences, TravelerType } from '../engine/planner/types';
import { TIME_CONSTRAINTS, BUDGET_CONFIGS, TRAVELER_TYPE_CONFIGS } from '../engine/planner/types';
import { saveStoredTravelerType, loadStoredTravelerType } from '../engine/planner/storage';
import { planPersonalizedTour } from '../engine/planner/tripPlanner';
import { savePersonalizedPlan } from '../engine/planner/registry';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TripBuilder'>;

const AVAILABLE_CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'history', label: 'History', icon: '🏛' },
  { id: 'religious', label: 'Sacred Spaces', icon: '🪔' },
  { id: 'coastal', label: 'Coastal Shore', icon: '⛵' },
  { id: 'architecture', label: 'Architecture', icon: '🕌' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'culture', label: 'Culture & Heritage', icon: '🎭' },
];

export function TripBuilderScreen({ route, navigation }: Props): React.JSX.Element {
  const destinationId = route.params?.destinationId;

  // Resolve target destination from route params or fallback to first registered destination
  const destination = useMemo(() => {
    if (destinationId) {
      const found = destinations.find((d) => d.id === destinationId);
      if (found) return found;
    }
    return (
      destinations[0] ?? {
        id: 'mangalore',
        name: 'Mangalore',
        state: 'Karnataka',
        country: 'India',
        description: 'A historic coastal port city known for temples, watchtowers, and Arabian Sea beaches.',
        coordinates: { latitude: 12.8698, longitude: 74.843 },
        attractionIds: [],
        tourIds: [],
      }
    );
  }, [destinationId]);

  // Available attractions in the destination
  const destinationAttractions = useMemo<Attraction[]>(() => {
    return attractions.filter((a) => a.cityId === destination.id);
  }, [destination.id]);

  // Form State
  const [selectedTime, setSelectedTime] = useState<TimeOption>('3-4_hours');
  const [selectedBudget, setSelectedBudget] = useState<BudgetTier>('any');
  const [selectedTravelerType, setSelectedTravelerType] = useState<TravelerType | undefined>(undefined);
  const [selectedInterests, setSelectedInterests] = useState<Category[]>(['history']);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

  // Load persisted default traveler type if available
  React.useEffect(() => {
    let isMounted = true;
    loadStoredTravelerType().then((stored) => {
      if (isMounted && stored) {
        setSelectedTravelerType(stored);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Toggle interest
  const toggleInterest = (cat: Category) => {
    setSelectedInterests((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  // Toggle skip landmark
  const toggleSkip = (attrId: string) => {
    setSkippedIds((prev) => {
      const next = new Set(prev);
      if (next.has(attrId)) {
        next.delete(attrId);
      } else {
        next.add(attrId);
      }
      return next;
    });
  };

  // Handle Generate
  const handleGenerate = () => {
    const preferences: TravelerPreferences = {
      destinationId: destination.id,
      availableTime: selectedTime,
      budget: selectedBudget,
      selectedInterests,
      skippedAttractions: Array.from(skippedIds),
      travelerType: selectedTravelerType,
    };

    // Store traveler type preference for future trip building
    saveStoredTravelerType(selectedTravelerType);

    const plan = planPersonalizedTour(preferences, destination, attractions, stories);

    if (!plan.success || plan.plannedStops.length === 0) {
      Alert.alert(
        'Unable to Build Itinerary',
        plan.summary || 'Please adjust your time or reduce skipped places to create a viable route.',
        [{ text: 'OK' }],
      );
      return;
    }

    const planId = savePersonalizedPlan(plan);
    navigation.navigate('PersonalizedTourPreview', { planId });
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Destination Header ────────────────────────────── */}
        <View style={styles.destinationCard}>
          <View style={styles.destinationBadge}>
            <Text style={styles.destinationBadgeText}>CURRENT DESTINATION</Text>
          </View>
          <Text style={styles.destinationName}>{destination.name}</Text>
          <Text style={styles.destinationRegion}>{destination.state}, {destination.country}</Text>
          <Text style={styles.destinationDesc}>{destination.description}</Text>
        </View>

        {/* ── Section: Available Time ───────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. AVAILABLE TIME</Text>
          <Text style={styles.sectionSubtitle}>
            How much time do you want to spend walking and exploring?
          </Text>

          <View style={styles.optionsCol}>
            {(Object.keys(TIME_CONSTRAINTS) as TimeOption[]).map((key) => {
              const config = TIME_CONSTRAINTS[key];
              const isSelected = selectedTime === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => setSelectedTime(key)}
                  activeOpacity={0.78}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.radioDot}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {config.label}
                    </Text>
                    <Text style={styles.optionDesc}>{config.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Section: Budget ───────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. ADMISSION BUDGET</Text>
          <Text style={styles.sectionSubtitle}>
            Do you prefer only free monuments or are you open to paid sites?
          </Text>

          <View style={styles.optionsCol}>
            {(Object.keys(BUDGET_CONFIGS) as BudgetTier[]).map((key) => {
              const config = BUDGET_CONFIGS[key];
              const isSelected = selectedBudget === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => setSelectedBudget(key)}
                  activeOpacity={0.78}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.radioDot}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionTextCol}>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {config.label}
                    </Text>
                    <Text style={styles.optionDesc}>{config.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Section: Traveler Type (Optional) ─────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>3. HOW ARE YOU TRAVELING? (OPTIONAL)</Text>
            {selectedTravelerType !== undefined && (
              <TouchableOpacity
                onPress={() => setSelectedTravelerType(undefined)}
                accessibilityRole="button"
                accessibilityLabel="Clear traveler type selection"
              >
                <Text style={styles.clearOptionText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.sectionSubtitle}>
            Choose whether you are exploring solo or with friends. This is optional and helps us provide relevant travel context.
          </Text>

          <View style={styles.optionsCol}>
            {(['solo', 'friends'] as TravelerType[]).map((key) => {
              const config = TRAVELER_TYPE_CONFIGS[key];
              const isSelected = selectedTravelerType === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => setSelectedTravelerType(isSelected ? undefined : key)}
                  activeOpacity={0.78}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${config.label}: ${config.description}`}
                >
                  <View style={styles.radioDot}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.travelerTypeIcon}>{config.icon}</Text>
                  <View style={styles.optionTextCol}>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {config.label}
                    </Text>
                    <Text style={styles.optionDesc}>{config.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Section: Interests ────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. YOUR INTERESTS</Text>
          <Text style={styles.sectionSubtitle}>
            Select themes you enjoy. Leave unselected for general regional highlights.
          </Text>

          <View style={styles.chipsRow}>
            {AVAILABLE_CATEGORIES.map(({ id, label, icon }) => {
              const isSelected = selectedInterests.includes(id);
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleInterest(id)}
                  activeOpacity={0.75}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  <Text style={styles.chipIcon}>{icon}</Text>
                  <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Section: Skip Places ──────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.skipHeader}>
            <Text style={styles.sectionTitle}>5. PLACES TO SKIP</Text>
            {skippedIds.size > 0 && (
              <Text style={styles.skipCountBadge}>
                {skippedIds.size} {skippedIds.size === 1 ? 'place' : 'places'} excluded
              </Text>
            )}
          </View>
          <Text style={styles.sectionSubtitle}>
            Explicitly remove landmarks you have already visited or do not wish to see. Skipped places are never included.
          </Text>

          <View style={styles.skipList}>
            {destinationAttractions.map((attr) => {
              const isSkipped = skippedIds.has(attr.id);
              return (
                <View key={attr.id} style={[styles.skipItem, isSkipped && styles.skipItemExcluded]}>
                  <View style={styles.skipTextCol}>
                    <Text style={[styles.skipItemName, isSkipped && styles.skipItemNameExcluded]}>
                      {attr.name}
                    </Text>
                    <Text style={styles.skipItemMeta}>
                      {attr.categories.join(' · ')} · ~{attr.estimatedVisitDurationMinutes} min
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.skipBtn, isSkipped ? styles.skipBtnExcluded : styles.skipBtnIncluded]}
                    onPress={() => toggleSkip(attr.id)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={isSkipped ? `Include ${attr.name}` : `Skip ${attr.name}`}
                  >
                    <Text style={[styles.skipBtnText, isSkipped ? styles.skipBtnTextExcluded : styles.skipBtnTextIncluded]}>
                      {isSkipped ? '+ Include' : '✕ Skip'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>

      {/* ── Sticky Generate Action ──────────────────────────── */}
      <View style={styles.footer}>
        <PrimaryButton
          label="Generate Personalized Tour →"
          onPress={handleGenerate}
          accessibilityLabel="Generate personalized tour based on selected preferences"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  destinationCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  destinationBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  destinationBadgeText: {
    ...Typography.overline,
    color: Colors.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  destinationName: {
    ...Typography.heading,
    fontSize: 26,
    color: Colors.textPrimary,
  },
  destinationRegion: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  destinationDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    gap: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearOptionText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  sectionTitle: {
    ...Typography.overline,
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  travelerTypeIcon: {
    fontSize: 20,
    marginRight: Spacing.sm + 2,
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 19,
  },
  optionsCol: {
    gap: Spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F2F7FC',
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  optionTextCol: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    ...Typography.subheading,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  optionDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipLabel: {
    ...Typography.button,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  chipLabelSelected: {
    color: Colors.accent,
  },
  skipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipCountBadge: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.error,
    fontWeight: '600',
  },
  skipList: {
    gap: Spacing.sm,
  },
  skipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skipItemExcluded: {
    backgroundColor: '#F8F6F4',
    borderColor: '#E6E0D8',
    opacity: 0.65,
  },
  skipTextCol: {
    flex: 1,
    gap: 2,
    marginRight: Spacing.sm,
  },
  skipItemName: {
    ...Typography.subheading,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  skipItemNameExcluded: {
    textDecorationLine: 'line-through',
    color: Colors.textTertiary,
  },
  skipItemMeta: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  skipBtnIncluded: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.border,
  },
  skipBtnExcluded: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  skipBtnText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  skipBtnTextIncluded: {
    color: Colors.textSecondary,
  },
  skipBtnTextExcluded: {
    color: Colors.primary,
  },
  footer: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
});
