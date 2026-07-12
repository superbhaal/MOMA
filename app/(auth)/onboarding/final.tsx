import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { OnboardingSaveHint } from '@/components/onboarding/OnboardingSaveHint';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Pressable } from 'react-native';

export default function FinalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, fetchProfile } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const [queueing, setQueueing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user) return;

      const { error: queueError } = await supabase
        .from('matching_queue')
        .upsert({ user_id: user.id, status: 'waiting' }, { onConflict: 'user_id' });
      if (cancelled) return;
      if (queueError) {
        setError(queueError.message);
        setQueueing(false);
        return;
      }

      // Try neighbourhood first, fall back to city if neighbourhood is empty
      // or yields a tiny count — gives more believable "N moms" for testing.
      const neighbourhood = user.neighbourhood;
      const city = user.city;
      let resolved: number | null = null;
      if (neighbourhood) {
        const { count: c } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('neighbourhood', neighbourhood);
        resolved = c ?? null;
      }
      if ((resolved == null || resolved < 2) && city) {
        const { count: c2 } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('city', city);
        resolved = c2 ?? resolved;
      }
      if (cancelled) return;
      setCount(resolved);
      setQueueing(false);

      await fetchProfile(user.id);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const firstName = user?.display_name?.split(' ')[0] ?? 'you';
  const area = user?.neighbourhood ?? user?.city ?? 'your area';
  const showCount = count !== null && count > 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.hero}>
        {queueing ? (
          <ActivityIndicator size="large" color={colors.white} />
        ) : (
          <>
            <Typography style={styles.name}>{firstName}.</Typography>
            <Typography style={styles.sub}>
              {showCount
                ? `We’re looking at ${count} moms in ${area} right now, finding your best 3 matches. You’ll hear within 48 hours.`
                : `We’re looking for moms in ${area} right now, finding your best 3 matches. You’ll hear within 48 hours.`}
            </Typography>

            <View style={styles.avatars}>
              {[
                { ring: colors.fuchsia, offset: 0 },
                { ring: colors.lavender, offset: -10 },
                { ring: colors.pool, offset: -10 },
              ].map((a, i) => (
                <View key={i} style={[styles.avRing, { marginLeft: a.offset }]}>
                  <Avatar
                    name="?"
                    ringColor={a.ring}
                    size={40}
                    ringWidth={2}
                    outlineColor={colors.cobalt}
                  />
                </View>
              ))}
            </View>

            <Pressable onPress={() => router.replace('/(tabs)')} style={styles.cta}>
              <Typography style={styles.ctaText}>GO TO YOUR GROUPS</Typography>
            </Pressable>
          </>
        )}

        {error ? (
          <Typography variant="bodyS" color={colors.cherry} style={{ marginTop: spacing.md }}>
            {error}
          </Typography>
        ) : null}
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 4, spacing.xl) }]}>
        <OnboardingSaveHint />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cobalt,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  name: {
    fontFamily: fonts.serif,
    fontWeight: '300',
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -0.8,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  sub: {
    fontFamily: fonts.body,
    fontWeight: '300',
    fontSize: 17,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.60)',
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: spacing.xxl,
  },
  avatars: {
    flexDirection: 'row',
    marginBottom: spacing.xxl,
  },
  avRing: {},
  cta: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'center',
  },
  ctaText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.cobalt,
    letterSpacing: 1.4,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    position: 'relative',
    minHeight: 28,
  },
});
