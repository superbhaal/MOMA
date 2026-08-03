import { Dimensions, PixelRatio } from 'react-native';

/**
 * The v11 mockups were drawn on a 390pt-wide frame (iPhone 14/15/16 base).
 * Everything sized against that frame renders proportionally smaller on a Pro
 * Max, which is why the type read as shrunken there. `scaled()` restores the
 * proportion by widening with the screen.
 *
 * Only ever scales up, and never past 1.18 — a 6.9" phone should feel roomier
 * than a 6.1", not merely zoomed. Foldables and tablets stop at the cap.
 */
const BASE_WIDTH = 390;
const MAX_FACTOR = 1.18;

const { width, height } = Dimensions.get('window');
// Portrait-locked app, but read the short edge anyway so a landscape launch
// doesn't blow every size up.
const shortEdge = Math.min(width, height);

export const scaleFactor = Math.min(Math.max(shortEdge / BASE_WIDTH, 1), MAX_FACTOR);

/** Size from the mockup → size for this screen, snapped to the pixel grid. */
export function scaled(size: number): number {
  return PixelRatio.roundToNearestPixel(size * scaleFactor);
}
