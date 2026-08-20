import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingSaveHint } from '@/components/onboarding/OnboardingSaveHint';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function Q1FirstBabyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
      <OnboardingHeader current={1} total={4} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Typography style={styles.heading}>
          {t('ob.q1heading')}
        </Typography>
        <Typography style={styles.sub}>
          {t('ob.q1sub')}
        </Typography>

        {error ? (
          <Typography variant="bodyM" color={colors.cherry} style={{ marginBottom: spacing.sm }}>
            {error}
          </Typography>
        ) : null}

        <View style={styles.options}>
          <OptionCard
            letter="a"
            title={t('ob.yes')}
            desc="Doing this for the first time."
            selected={isFirst === true}
            onPress={() => setIsFirst(true)}
          />
          <OptionCard
            letter="b"
            title={t('ob.no')}
            desc="Been here before."
            selected={isFirst === false}
            onPress={() => setIsFirst(false)}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 4, spacing.xl) }]}>
        <OnboardingButton
          title={saving ? t('ob.saving') : t('ob.continue')}
          onPress={() => advance(false)}
          disabled={isFirst === null || saving}
        />
        <OnboardingSaveHint />
      </View>
    </View>
  );
}

/**
 * One answer per line: a serif letter marker, the answer, then its gloss —
 * the whole row inside a hairline pill. Ref: design/moma-v11.html quiz options.
 */
function OptionCard({
  letter,
  title,
  desc,
  selected,
  onPress,
}: {
  letter: string;
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
      <Typography style={[styles.optLetter, selected && styles.optLetterSel]}>
        {letter}
      </Typography>
      <Typography style={[styles.optTitle, selected && styles.optTitleSel]}>
        {title}
      </Typography>
      <Typography style={styles.optDesc} numberOfLines={2}>
        {desc}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: {
    paddingHorizontal: 26,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  heading: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(40),
    lineHeight: scaled(46),
    letterSpacing: -0.8,
    color: colors.cobalt,
    marginBottom: spacing.md,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: scaled(16),
    lineHeight: scaled(23),
    color: colors.mutedStrong,
    marginBottom: spacing.xxl,
  },
  options: {
    gap: 10,
  },
  optCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  optCardSel: {
    backgroundColor: colors.cobaltSoft,
    borderWidth: 1.5,
    borderColor: colors.cobalt,
  },
  optLetter: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(18),
    color: colors.muted,
  },
  optLetterSel: {
    color: colors.cobalt,
  },
  optTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(17),
    color: colors.text,
  },
  optTitleSel: {
    color: colors.cobalt,
  },
  optDesc: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: scaled(14),
    lineHeight: scaled(19),
    color: colors.muted,
  },
  footer: {
    paddingHorizontal: 26,
    paddingTop: spacing.sm,
    position: 'relative',
  },
});
