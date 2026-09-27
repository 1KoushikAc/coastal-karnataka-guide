// src/screens/ChooseTourScreen.tsx
// Shows tours matching the chosen interest category.
// Uses TourItem and EmptyState components. Navigation logic unchanged.

import React, { useMemo } from 'react';
import {
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, Spacing } from '../theme';
import { TourItem } from '../components/TourItem';
import { EmptyState } from '../components/EmptyState';
import type { RootStackParamList } from '../navigation/types';
import type { Tour } from '@shared-types/index';
import { tours } from '@data/index';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseTour'>;

export function ChooseTourScreen({ route, navigation }: Props): React.JSX.Element {
  const { category } = route.params;

  const filteredTours = useMemo<Tour[]>(
    () => tours.filter((t) => t.category === category),
    [category],
  );

  if (filteredTours.length === 0) {
    return (
      <SafeAreaView style={styles.root}>
        <EmptyState
          icon="🗺️"
          title="No tours yet"
          body="We're working on tours for this theme. Check back soon."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={filteredTours}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TourItem
            tour={item}
            onPress={() => navigation.navigate('TourPreview', { tourId: item.id })}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
});
