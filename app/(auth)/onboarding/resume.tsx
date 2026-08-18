import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { useAuth } from '@/hooks/useAuth';
import { getQuizProgress, TOTAL_QUIZ_STEPS } from '@/hooks/useOnboarding';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';

const TOTAL_STEPS = TOTAL_QUIZ_STEPS;

/**
 * Resume screen — reached from the auth gate when the user is authenticated
 * but not onboarded. If they've already answered ≥ 1 quiz question, show the
 * "you were almost there" card so they can pick up or start over. Otherwise
 * (fresh signup or fully complete) auto-redirect.
 */
export default function ResumeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, authLoading } = useAuth();
  const [starting, setStarting] = useState(false);

  const progress = useMemo(() => getQuizProgress(user), [user]);
  const showResumeCard =
    !authLoading && progress.answered > 0 && progress.answered < TOTAL_STEPS;

  // Auto-redirect when there's nothing to "resume" (fresh signup or already done).
  useEffect(() => {
    if (authLoading) return;
    if (progress.answered === 0 || progress.answered >= TOTAL_STEPS) {
      router.replace(progress.nextRoute);
    }
  }, [authLoading, progress, router]);

  if (authLoading || !showResumeCard) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.cobalt} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.body}>
        <Typography variant="labelS" color={colors.muted} style={styles.eyebrow}>
          {t('ob.resumeWelcome')}
        </Typography>
        <Typography style={styles.heading}>
          You were{'\n'}almost there.
        </Typography>
        <Typography variant="bodyL" color={colors.mutedStrong} style={styles.sub}>
          You answered {progress.answered} of {TOTAL_STEPS} questions. Pick up where you left off. We kept your answers safe.
        </Typography>

        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Typography variant="labelS" color={colors.muted}>
              {t('ob.resumeProgress')}
            </Typography>
            <Typography variant="labelS" color={colors.cobalt}>
              {progress.answered} / {TOTAL_STEPS}
            </Typography>
          </View>
          <View style={styles.segments}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={[styles.seg, i < progress.answered && styles.segDone]}
              />
            ))}
          </View>
          <Typography variant="bodyM" color={colors.mutedStrong} style={styles.nextUp}>
            Next up: {progress.nextLabel}
          </Typography>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.replace(progress.nextRoute)}
          style={styles.continueBtn}
        >
          <Typography variant="label" color={colors.white}>
            {t('ob.resumeContinue')}
          </Typography>
        </Pressable>
        <Pressable
          onPress={async () => {
            setStarting(true);
            // Route to q1 — saving q1 overwrites is_first_baby and subsequent
            // steps cascade-overwrite from there.
            router.replace('/(auth)/onboarding/q1');
          }}
          style={styles.startOverBtn}
          disabled={starting}
        >
          <Typography variant="bodyL" color={colors.muted}>
            {t('ob.resumeStartOver')}
          </Typography>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 26,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  eyebrow: {
    marginBottom: spacing.md,
  },
  heading: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(48),
    lineHeight: scaled(54),
    letterSpacing: -0.9,
    color: colors.cobalt,
  },
  sub: {
    marginTop: spacing.xl,
  },
  progressCard: {
    marginTop: spacing.xxl,
    backgroundColor: colors.cobaltSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
  },
  seg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lineStrong,
  },
  segDone: {
    backgroundColor: colors.cobalt,
  },
  nextUp: {
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
  actions: {
    gap: spacing.md,
    alignItems: 'center',
  },
  continueBtn: {
    backgroundColor: colors.cobalt,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  startOverBtn: {
    paddingVertical: spacing.sm,
  },
});
