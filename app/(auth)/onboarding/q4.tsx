import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
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
import { useOnboarding } from '@/hooks/useOnboarding';

export default function Q4ColourScreen() {
  const router = useRouter();
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
        <Typography style={styles.heading}>Pick a colour.</Typography>
        <Typography style={styles.sub}>
          This is yours. You&rsquo;ll see it on your profile and in the chat.
        </Typography>

        {error ? (
          <Typography variant="bodyM" color={colors.cherry} style={{ marginBottom: spacing.sm }}>
            {error}
          </Typography>
        ) : null}

        <Typography style={styles.groupLabel}>SOFT</Typography>
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

        <Typography style={[styles.groupLabel, { marginTop: spacing.lg }]}>BOLD</Typography>
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
              <Typography style={styles.captionPicked}>Picked </Typography>
              <Typography style={styles.captionDash}>— </Typography>
              <Typography style={styles.captionName}>{picked.label}</Typography>
            </Typography>
          ) : (
            <Typography style={styles.captionEmpty}>
              Tap a swatch to pick yours.
            </Typography>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 4, spacing.xl) }]}>
        <OnboardingButton
          title={saving ? 'saving…' : 'Find my group'}
          onPress={() => advance(false)}
          disabled={!colorHex || saving}
        />
        <OnboardingSaveHint />
      </View>
    </View>
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
    fontFamily: fonts.serifItal,
    fontStyle: 'italic',
    fontSize: 17,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: spacing.xl,
  },
  groupLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.55)',
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
    fontSize: 14,
    color: colors.white,
    letterSpacing: 0.2,
  },
  captionDash: {
    fontFamily: fonts.bodyMed,
    fontSize: 14,
    color: 'rgba(255,255,255,0.60)',
  },
  captionName: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.white,
    letterSpacing: 0.2,
  },
  captionEmpty: {
    fontFamily: fonts.body,
    fontStyle: 'italic',
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    position: 'relative',
  },
});
