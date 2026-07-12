import { StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';

/**
 * Italic "Auto-saved · close anytime…" footer hint with a small leading dot.
 * Rendered at the very bottom of every quiz screen, overlaid over the Continue
 * button's lower padding — mirrors .ob-save-hint in the standalone.
 */
export function OnboardingSaveHint() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.dot} />
      <Typography style={styles.text}>
        Auto-saved · close anytime, you&rsquo;ll pick up where you left off
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
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  text: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.4,
  },
});
