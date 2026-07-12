import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingSaveHint } from '@/components/onboarding/OnboardingSaveHint';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function Q1FirstBabyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onboardingData, saveProgress } = useOnboarding();
  const [isFirst, setIsFirst] = useState<boolean | null>(onboardingData.isFirstBaby);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function advance(skip = false) {
    setError(null);
    setSaving(true);
    if (!skip && isFirst !== null) {
      const { error: saveError } = await saveProgress({
        is_first_baby: isFirst,
        is_mentor_eligible: !isFirst,
      });
      setSaving(false);
      if (saveError) {
        setError(saveError.message);
        return;
      }
    } else {
      setSaving(false);
    }
    router.push('/(auth)/onboarding/q2');
  }

  return (
    <View style={styles.container}>
      <OnboardingHeader current={1} total={4} onSkip={() => advance(true)} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Typography style={styles.heading}>
          Is this your{'\n'}first baby?
        </Typography>
        <Typography style={styles.sub}>
          This helps us match you with moms in a similar place.
        </Typography>

        {error ? (
          <Typography variant="bodyM" color={colors.cherry} style={{ marginBottom: spacing.sm }}>
            {error}
          </Typography>
        ) : null}

        <View style={styles.options}>
          <OptionCard
            title="Yes"
            desc="Doing this for the first time."
            selected={isFirst === true}
            onPress={() => setIsFirst(true)}
          />
          <OptionCard
            title="No"
            desc="Been here before."
            selected={isFirst === false}
            onPress={() => setIsFirst(false)}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 4, spacing.xl) }]}>
        <OnboardingButton
          title={saving ? 'saving…' : 'Continue'}
          onPress={() => advance(false)}
          disabled={isFirst === null || saving}
        />
        <OnboardingSaveHint />
      </View>
    </View>
  );
}

function OptionCard({
  title,
  desc,
  selected,
  onPress,
}: {
  title: string;
  desc: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optCard, selected && styles.optCardSel]}
    >
      <Typography style={[styles.optTitle, selected && styles.optTitleSel]}>
        {title}
      </Typography>
      <Typography style={[styles.optDesc, selected && styles.optDescSel]}>
        {desc}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cobalt },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  heading: {
    fontFamily: fonts.serif,
    fontWeight: '300',
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.5,
    color: colors.white,
    marginBottom: spacing.md,
  },
  sub: {
    fontFamily: fonts.body,
    fontWeight: '300',
    fontSize: 17,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.60)',
    marginBottom: spacing.xl,
  },
  options: {
    gap: 10,
  },
  optCard: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.40)',
    borderRadius: radius.lg,
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  optCardSel: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  optTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 19,
    lineHeight: 24,
    color: colors.white,
    marginBottom: 4,
  },
  optTitleSel: {
    color: colors.cobalt,
  },
  optDesc: {
    fontFamily: fonts.body,
    fontWeight: '300',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.60)',
  },
  optDescSel: {
    color: 'rgba(26,75,204,0.62)',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    position: 'relative',
  },
});
