// src/components/PlaceImage.tsx
// =============================================================================
// PlaceImage — Tour & Attraction Photography Display
// =============================================================================
// Displays hero photography or temporary placeholder visuals.
//
// Architecture:
//   - When `source` is provided, renders the image with an overlay label.
//   - When `source` is absent, falls back to a styled category-colored placeholder.
//   - When `isPlaceholder` is true, displays a subtle, clearly identified
//     "PLACEHOLDER" badge to avoid misrepresenting temporary assets as real photography.
// =============================================================================

import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  type ImageSourcePropType,
  type ViewStyle,
} from 'react-native';
import { CategoryColors, Colors, Typography, Radius, Spacing } from '../theme';

interface Props {
  /** Real image source or bundled asset. If omitted, a styled placeholder is shown. */
  source?: ImageSourcePropType;
  /** Category key — determines fallback placeholder color. */
  category?: string;
  /** Overlay label shown at the bottom of the image/placeholder. */
  label?: string;
  height?: number;
  style?: ViewStyle;
  /** True when the image is a temporary placeholder rather than verified photography. */
  isPlaceholder?: boolean;
}

export function PlaceImage({
  source,
  category = 'default',
  label,
  height = 220,
  style,
  isPlaceholder = false,
}: Props): React.JSX.Element {
  const placeholderColor = CategoryColors[category] ?? CategoryColors['default'];

  if (source) {
    return (
      <View style={[styles.container, { height }, style]}>
        <Image
          source={source}
          style={styles.image}
          resizeMode="cover"
          accessibilityLabel={label ?? 'Tour place image'}
        />

        {/* Clear, subtle badge indicating temporary placeholder asset */}
        {isPlaceholder && (
          <View style={styles.placeholderBadge}>
            <Text style={styles.placeholderBadgeText}>PLACEHOLDER</Text>
          </View>
        )}

        {label ? (
          <View style={styles.labelOverlay}>
            <Text style={styles.labelText} numberOfLines={2}>
              {label}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  // Fallback — styled View with subtle inner texture, no external assets required.
  return (
    <View
      style={[styles.container, { height, backgroundColor: placeholderColor }, style]}
      accessibilityLabel={label ? `Photo placeholder for ${label}` : 'Photo placeholder'}
    >
      <View style={styles.placeholderInner} />

      {isPlaceholder && (
        <View style={styles.placeholderBadge}>
          <Text style={styles.placeholderBadgeText}>PLACEHOLDER</Text>
        </View>
      )}

      {label ? (
        <View style={styles.labelOverlay}>
          <Text style={styles.labelText} numberOfLines={2}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceElevated,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(26, 31, 44, 0.72)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.xs,
    zIndex: 2,
  },
  placeholderBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.8,
  },
  placeholderInner: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    right: '10%',
    bottom: '25%',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 4,
  },
  labelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 31, 44, 0.55)',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  labelText: {
    ...Typography.subheading,
    color: Colors.white,
  },
});
