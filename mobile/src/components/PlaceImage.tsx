// src/components/PlaceImage.tsx
// =============================================================================
// PlaceImage — Tour & Attraction Photography & Editorial Fallback Display
// =============================================================================
// Displays verified photography when available, or an intentional, polished
// editorial destination banner when imagery is still pending verification.
//
// Architecture:
//   - If verified photography is available (!isPlaceholder && source && !hasError),
//     renders the real <Image> with graceful error capture.
//   - If imagery is pending, missing, or fails to load, renders an intentional,
//     dignified editorial destination card inspired by Coastal Karnataka's
//     rich heritage colors.
//   - Adaptive layout: scales gracefully between compact list thumbnails (height < 120)
//     and expansive hero banners (height >= 120).
//   - Never exposes internal placeholder filenames or developer notes to the user.
// =============================================================================

import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  type ImageSourcePropType,
  type ViewStyle,
} from 'react-native';
import { CategoryColors, Colors, Typography, Radius, Spacing } from '../theme';

export interface PlaceImageProps {
  /** Real image source or bundled asset. */
  source?: ImageSourcePropType;
  /** Category key — determines fallback editorial color. */
  category?: string;
  /** Destination or landmark name shown in the overlay. */
  label?: string;
  /** Height in pixels (default: 220). */
  height?: number;
  /** Optional container style overrides. */
  style?: ViewStyle;
  /** True when the asset is an unverified placeholder rather than verified licensed photography. */
  isPlaceholder?: boolean;
  /** Optional testID for automated verification. */
  testID?: string;
}

export const CATEGORY_EDITORIAL_TAGS: Record<string, string> = {
  history:      'HISTORIC LANDMARK',
  religious:    'SACRED HERITAGE',
  nature:       'COASTAL NATURE',
  food:         'CULINARY HERITAGE',
  architecture: 'ARCHITECTURAL SITE',
  coastal:      'COASTAL DESTINATION',
  culture:      'LIVING CULTURE',
  default:      'DESTINATION',
};

export function PlaceImage({
  source,
  category = 'default',
  label,
  height = 220,
  style,
  isPlaceholder = false,
  testID = 'place-image',
}: PlaceImageProps): React.JSX.Element {
  const [hasError, setHasError] = useState(false);

  const editorialColor = CategoryColors[category] ?? CategoryColors['default'];
  const editorialTag = CATEGORY_EDITORIAL_TAGS[category] ?? CATEGORY_EDITORIAL_TAGS['default'];
  const isCompact = height < 120;

  // If real verified photography is available and has not failed, render the real Image
  if (source && !isPlaceholder && !hasError) {
    return (
      <View
        testID={testID}
        style={[styles.container, { height }, style]}
        accessibilityRole="image"
        accessibilityLabel={label ? `${editorialTag}: ${label}` : 'Tour place image'}
      >
        <Image
          source={source}
          style={styles.image}
          resizeMode="cover"
          onError={() => setHasError(true)}
          accessibilityLabel={label ?? 'Tour place image'}
        />
        {label ? (
          <View style={styles.labelOverlay}>
            <View style={styles.categoryPillSmall}>
              <Text style={styles.categoryPillSmallText}>{editorialTag}</Text>
            </View>
            <Text style={styles.labelText} numberOfLines={isCompact ? 1 : 2}>
              {label}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  // Intentional Editorial Fallback — clean, atmospheric, dignified travel-guide visual
  return (
    <View
      testID={testID}
      style={[
        styles.container,
        { height, backgroundColor: editorialColor },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={label ? `${editorialTag}: ${label}` : 'Destination banner'}
    >
      {/* Decorative architectural framing elements (rendered on medium/large sizes) */}
      {!isCompact && (
        <>
          <View style={styles.decorOuterRing} />
          <View style={styles.decorInnerRing} />
        </>
      )}

      <View style={[styles.editorialContent, isCompact && styles.editorialContentCompact]}>
        <View style={[styles.categoryPillSmall, isCompact && styles.categoryPillCompact]}>
          <Text style={[styles.categoryPillSmallText, isCompact && styles.categoryPillTextCompact]}>
            {editorialTag}
          </Text>
        </View>

        {label ? (
          <Text
            style={[styles.editorialTitle, isCompact && styles.editorialTitleCompact]}
            numberOfLines={isCompact ? 1 : 2}
          >
            {label}
          </Text>
        ) : null}

        {!isCompact && <View style={styles.coastalAccentLine} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'flex-end',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  decorOuterRing: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  decorInnerRing: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  editorialContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.xl,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
  },
  editorialContentCompact: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
  },
  categoryPillSmall: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    marginBottom: Spacing.xs,
  },
  categoryPillCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
  },
  categoryPillSmallText: {
    ...Typography.overline,
    fontSize: 9,
    letterSpacing: 1.2,
    color: Colors.white,
    fontWeight: '700',
  },
  categoryPillTextCompact: {
    fontSize: 8,
    letterSpacing: 0.8,
  },
  editorialTitle: {
    ...Typography.subheading,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: Colors.white,
  },
  editorialTitleCompact: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  coastalAccentLine: {
    width: 36,
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 2,
    marginTop: Spacing.xs + 2,
  },
  labelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  labelText: {
    ...Typography.subheading,
    color: Colors.white,
    fontWeight: '700',
  },
});
