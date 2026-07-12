import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

const RING_RADIUS = 18;

/**
 * Pale-cobalt card shown on Home while the user is in the matching queue.
 * Matches `.group-waiting-card` + `.gw-orbit` from design/moma standalone.
 */
export function WaitingForMatchCard() {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const dots = [
    { color: colors.fuchsia, angle: 0 },
    { color: colors.pool, angle: 90 },
    { color: colors.soleil, angle: 180 },
    { color: colors.lime, angle: 270 },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.orbit}>
        <View style={styles.orbitCenter}>
          <View style={styles.pin} />
        </View>
        <Animated.View
          style={[
            styles.ring,
            { transform: [{ rotate: spin }] },
          ]}
        >
          {dots.map((d, i) => {
            const rad = (d.angle * Math.PI) / 180;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: d.color,
                    transform: [
                      { translateX: Math.cos(rad) * RING_RADIUS },
                      { translateY: Math.sin(rad) * RING_RADIUS },
                    ],
                  },
                ]}
              />
            );
          })}
        </Animated.View>
      </View>

      <View style={styles.body}>
        <Typography style={styles.title} color={colors.cobalt}>
          Finding your group…
        </Typography>
        <Typography style={styles.sub} color="rgba(26,75,204,0.65)">
          Most groups assemble within 36 hours. You&rsquo;ll hear back within 48.
        </Typography>
        <View style={styles.progressRow}>
          <Typography style={styles.progressLabel} color={colors.cobalt}>
            LOOKING
          </Typography>
          <View style={styles.progressDots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={styles.progressDot} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F1F3FA',
    borderRadius: radius.lg,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  orbit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitCenter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  pin: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 2,
    borderColor: colors.cobalt,
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    marginBottom: 3,
  },
  sub: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressLabel: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 9,
    letterSpacing: 1.4,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 3,
  },
  progressDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(26,75,204,0.2)',
  },
});
