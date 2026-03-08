import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';

const CONNECTION_OPTIONS = [
  'Deep talks over coffee',
  'Group walks and fresh air',
  'Text-first, meet later',
  'All of the above!',
];

export default function OnboardingStep5() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <ProgressBar progress={5 / 6} />

      <View style={styles.content}>
        <Typography variant="displayL" color={colors.cobalt}>
          how do you connect?
        </Typography>
        <Typography variant="bodyL" color={colors.muted}>
          what feels most natural to you?
        </Typography>

        <View style={styles.options}>
          {CONNECTION_OPTIONS.map((option) => (
            <Pressable
              key={option}
              onPress={() => setSelected(option)}
              style={[
                styles.option,
                selected === option && styles.optionActive,
              ]}
            >
              <Typography
                variant="bodyL"
                color={selected === option ? colors.cobalt : colors.text}
              >
                {option}
              </Typography>
            </Pressable>
          ))}
        </View>
      </View>

      <Button
        title="CONTINUE"
        onPress={() => router.push('/(auth)/onboarding/step6')}
        disabled={!selected}
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
    gap: spacing.lg,
  },
  options: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  option: {
    padding: spacing.lg,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionActive: {
    borderColor: colors.cobalt,
    backgroundColor: colors.white,
  },
});
