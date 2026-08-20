import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { scaled } from '@/constants/scale';

/**
 * Italic "Auto-saved · close anytime…" footer hint with a small leading dot.
 * Rendered at the very bottom of every quiz screen, overlaid over the Continue
 * button's lower padding — mirrors .ob-save-hint in the standalone.
 */
export function OnboardingSaveHint() {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.dot} />
      <Typography style={styles.text}>
        {t('ob.autoSaved')}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lineStrong,
  },
  text: {
    fontSize: scaled(10.5),
    color: colors.muted,
    letterSpacing: 0.4,
  },
});
