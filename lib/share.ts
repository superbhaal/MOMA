import { Share } from 'react-native';
import type { TFunction } from 'i18next';

/**
 * Share møma with a friend via the native share sheet.
 * Used from Me → Settings → "Share møma with a friend".
 *
 * Two things were wrong here and both reached real friends: the message was
 * hardcoded English, so a French mother sent English to her friend; and the
 * link pointed at moma.app, which is NOT ours — it is parked on Afternic and
 * for sale. Every share sent someone to a domain-parking page.
 */
export async function shareMoma(t: TFunction) {
  try {
    await Share.share({ message: t('misc.shareMessage') });
  } catch {
    // User dismissed or share unavailable — nothing to do.
  }
}
