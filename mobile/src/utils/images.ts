// src/utils/images.ts
// =============================================================================
// Image Asset Registry & Resolver
// =============================================================================
// Maps abstract M1 assetKey strings to bundled image assets.
//
// Architecture:
//   - Decouples React screen components from file paths and require() calls.
//   - When production photography arrives, drop the files into assets/ and
//     update this registry. No screen code or M1 data needs to change.
//   - Falls back gracefully to undefined if an assetKey is missing,
//     allowing PlaceImage to render its category-colored placeholder view.
// =============================================================================

import type { ImageSourcePropType } from 'react-native';

/**
 * Central registry of known image assets.
 * Keys match Attraction.image.assetKey and Tour.heroImage.assetKey in M1 data.
 */
export const IMAGE_REGISTRY: Record<string, ImageSourcePropType> = {
  // Tour hero images
  'placeholder-mangalore-heritage-walk': require('../../assets/placeholders/placeholder-mangalore-heritage-walk.png'),

  // Attraction place images
  'placeholder-kadri-manjunatha-temple': require('../../assets/placeholders/placeholder-kadri-manjunatha-temple.png'),
  'placeholder-st-aloysius-chapel': require('../../assets/placeholders/placeholder-st-aloysius-chapel.png'),
  'placeholder-sultan-battery': require('../../assets/placeholders/placeholder-sultan-battery.png'),
  'placeholder-mangaladevi-temple': require('../../assets/placeholders/placeholder-mangaladevi-temple.png'),
  'placeholder-tannirbhavi-beach': require('../../assets/placeholders/placeholder-tannirbhavi-beach.png'),
};

/**
 * Resolves an assetKey to an ImageSourcePropType for use in <Image> or <PlaceImage>.
 *
 * @param assetKey Key string from M1 Attraction or Tour data.
 * @returns ImageSourcePropType if registered, or undefined if unmapped.
 */
export function resolveImageSource(assetKey?: string): ImageSourcePropType | undefined {
  if (!assetKey) return undefined;
  return IMAGE_REGISTRY[assetKey];
}
