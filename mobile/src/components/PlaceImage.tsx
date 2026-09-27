// src/components/PlaceImage.tsx
// Placeholder image component for tour/attraction photography.
//
// Architecture:
//   - When `source` is provided, renders a real Image (react-native Image).
//   - When `source` is absent, renders a styled placeholder View.
//
// The placeholder uses a category-keyed color from the design system,
// so each theme has a visually distinct but harmonious appearance.
// Drop in real photography simply by passing a `source` prop:
//
//   <PlaceImage source={require('../assets/tours/heritage-walk.jpg')} ... />
//
// No downloads, no external URLs — only local assets when added.

import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  type ImageSourcePropType,
  type ViewStyle,
} from 'react-native';
import { CategoryColors, Colors, Typography } from '../theme';

interface Props {
  /** Real image source. If omitted, a styled placeholder is shown. */
  source?: ImageSourcePropType;
  /** Category key — determines placeholder color. */
  category?: string;
  /** Overlay label shown at the bottom of the image/placeholder. */
  label?: string;
  height?: number;
  style?: ViewStyle;
}

export function PlaceImage({
  source,
  category = 'default',
  label,
  height = 220,
  style,
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

  // Placeholder — styled View, no external images.
  return (
    <View
      style={[styles.container, { height, backgroundColor: placeholderColor }, style]}
      accessibilityLabel={label ? `Photo placeholder for ${label}` : 'Photo placeholder'}
    >
      {/* Subtle inner texture: a slightly lighter tint block */}
      <View style={styles.placeholderInner} />

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
