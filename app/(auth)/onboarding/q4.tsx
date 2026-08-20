import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingSaveHint } from '@/components/onboarding/OnboardingSaveHint';
import { ColorSwatch } from '@/components/onboarding/ColorSwatch';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { PROFILE_COLOUR_SWATCHES } from '@/constants/onboarding';
import { scaled } from '@/constants/scale';
import { useOnboarding } from '@/hooks/useOnboarding';

export default function Q4ColourScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { onboardingData, saveProgress } = useOnboarding();
  const [colorHex, setColorHex] = useState<string | null>(onboardingData.profileColor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const soft = PROFILE_COLOUR_SWATCHES.filter((s) => s.group === 'soft');
  const bold = PROFILE_COLOUR_SWATCHES.filter((s) => s.group === 'bold');
  const picked = colorHex
    ? PROFILE_COLOUR_SWATCHES.find((s) => s.hex === colorHex) ?? null
    : null;

  async function advance(skip = false) {
    setError(null);
    setSaving(true);
    if (!skip && colorHex) {
      const { error: saveError } = await saveProgress({ profile_color: colorHex });
      setSaving(false);
      if (saveError) {
        setError(saveError.message);
        return;
      }
    } else {
      setSaving(false);
    }
    router.push('/(auth)/onboarding/final');
  }

  return (
    <View style={styles.container}>
      <OnboardingHeader current={4} total={4} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Typography style={styles.heading}>{t('ob.q4heading')}</Typography>
        <Typography style={styles.sub}>
          {t('ob.q4sub')}
        </Typography>

        {error ? (
          <Typography variant="bodyM" color={colors.cherry} style={{ marginBottom: spacing.sm }}>
            {error}
          </Typography>
        ) : null}

        <Typography style={styles.groupLabel}>{t('ob.soft')}</Typography>
        <View style={styles.swatches}>
          {soft.map((s) => (
            <ColorSwatch
              key={s.name}
              hex={s.hex}
              selected={colorHex === s.hex}
              onPress={() => setColorHex(s.hex)}
              size={30}
            />
          ))}
        </View>

        <Typography style={[styles.groupLabel, { marginTop: spacing.lg }]}>{t('ob.bold')}</Typography>
        <View style={styles.swatches}>
          {bold.map((s) => (
            <ColorSwatch
              key={s.name}
              hex={s.hex}
              selected={colorHex === s.hex}
              onPress={() => setColorHex(s.hex)}
              size={30}
            />
          ))}
        </View>

        <View style={styles.captionWrap}>
          {picked ? (
            <Typography style={styles.caption}>
              <Typography style={styles.captionPicked}>{t('ob.picked')}</Typography>
              <Typography style={styles.captionDash}>— </Typography>
              <Typography style={styles.captionName}>{picked.label}</Typography>
            </Typography>
          ) : (
            <Typography style={styles.captionEmpty}>
              {t('ob.q4tapSwatch')}
            </Typography>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 4, spacing.xl) }]}>
        <OnboardingButton
          title={saving ? t('ob.saving') : t('ob.findMyGroup')}
          onPress={() => advance(false)}
          disabled={!colorHex || saving}
        />
        <OnboardingSaveHint />
      </View>
    </View>
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
    fontFamily: fonts.serifItal,
    fontStyle: 'italic',
    fontSize: scaled(17),
    lineHeight: scaled(24),
    color: colors.mutedStrong,
    marginBottom: spacing.xxl,
  },
  groupLabel: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(10.5),
    letterSpacing: 2.4,
    color: colors.cobalt,
    marginBottom: spacing.sm,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  captionWrap: {
    marginTop: spacing.lg,
    minHeight: 18,
  },
  caption: {
    flexDirection: 'row',
  },
  captionPicked: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(14),
    color: colors.text,
    letterSpacing: 0.2,
  },
  captionDash: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(14),
    color: colors.muted,
  },
  captionName: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(14),
    color: colors.cobalt,
    letterSpacing: 0.2,
  },
  captionEmpty: {
    fontFamily: fonts.body,
    fontStyle: 'italic',
    fontSize: scaled(14),
    color: colors.muted,
  },
  footer: {
    paddingHorizontal: 26,
    paddingTop: spacing.sm,
    position: 'relative',
  },
});
