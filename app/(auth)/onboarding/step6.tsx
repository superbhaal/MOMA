import { useState } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

const IDENTITY_OPTIONS = [
  'First-time mom',
  'Second+ time mom',
  'Single mom',
  'Working mom',
  'Stay-at-home mom',
];

const COLOR_OPTIONS = [
  colors.fuchsia,
  colors.orange,
  colors.soleil,
  colors.lavender,
  colors.pool,
  colors.cherry,
  colors.lime,
  colors.peche,
  colors.menthe,
  colors.ciel,
  colors.rose,
  colors.sable,
];

export default function OnboardingStep6() {
  const router = useRouter();
  const [identity, setIdentity] = useState<string | null>(null);
  const [profileColor, setProfileColor] = useState<string | null>(null);

  const canContinue = identity && profileColor;

  async function handleFinish() {
    // TODO: write user profile + matching_queue to Supabase
    router.replace('/(auth)/onboarding/waiting');
  }

  return (
    <View style={styles.container}>
      <ProgressBar progress={6 / 6} />

      <View style={styles.content}>
        <Typography variant="displayL" color={colors.cobalt}>
          almost there
        </Typography>

        <Typography variant="label" color={colors.muted}>
          I IDENTIFY AS
        </Typography>
        <View style={styles.options}>
          {IDENTITY_OPTIONS.map((option) => (
            <Pressable
              key={option}
              onPress={() => setIdentity(option)}
              style={[
                styles.option,
                identity === option && styles.optionActive,
              ]}
            >
              <Typography
                variant="bodyM"
                color={identity === option ? colors.cobalt : colors.text}
              >
                {option}
              </Typography>
            </Pressable>
          ))}
        </View>

        <Typography variant="label" color={colors.muted} style={styles.colorLabel}>
          PICK YOUR COLOR
        </Typography>
        <View style={styles.colorGrid}>
          {COLOR_OPTIONS.map((color) => (
            <Pressable
              key={color}
              onPress={() => setProfileColor(color)}
              style={[
                styles.colorSwatch,
                { backgroundColor: color },
                profileColor === color && styles.colorSelected,
              ]}
            />
          ))}
        </View>
      </View>

      <Button
        title="FIND MY GROUP"
        onPress={handleFinish}
        disabled={!canContinue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    marginTop: spacing.xxxl,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionActive: {
    borderColor: colors.cobalt,
    backgroundColor: colors.white,
  },
  colorLabel: {
    marginTop: spacing.xxl,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
});
