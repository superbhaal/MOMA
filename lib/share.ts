import { Share } from 'react-native';

/**
 * Share møma with a friend via the native share sheet.
 * Used from Me → Settings → "Share møma with a friend".
 */
export async function shareMoma() {
  try {
    await Share.share({
      message:
        "everyone says 'it takes a village.' here's yours — join me on møma, " +
        'small local groups for new moms. https://moma.app',
    });
  } catch {
    // User dismissed or share unavailable — nothing to do.
  }
}
