import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/spacing';
import { scaled } from '@/constants/scale';

/**
 * A small "BETA" marker, shown only when the app is talking to the DEV backend.
 * Spelled without the circumflex: that is the French word, and it was showing
 * unchanged on Spanish and English screens.
 *
 * Deliberately derived from the Supabase URL rather than from a flag someone
 * has to remember to flip. The client asked for a badge on dev that must never
 * reach pre-prod; a constant, or a build profile, would put that guarantee in
 * a human's memory. This puts it in the same place as the thing it describes —
 * if the app is pointed at dev it says so, and if it is pointed anywhere else
 * it cannot say so, because there is no branch to forget.
 *
 * Pre-prod therefore looks exactly like production, which is the point: it is
 * the rehearsal, and a rehearsal with a costume note pinned to it is not one.
 */

const DEV_REF = 'rqesqrlrlxetnvihpoxt';

export function EnvBadge() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  if (!url.includes(DEV_REF)) return null;

  return (
    // pointerEvents none: it floats over every screen and must never eat a tap.
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 2 }]}>
      <View style={styles.pill}>
        <Typography style={styles.text} color={colors.white}>
          {t('misc.betaBadge')}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 10, zIndex: 9999 },
  pill: {
    backgroundColor: 'rgba(17,17,24,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: scaled(9),
    letterSpacing: 1.2,
  },
});
