import { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

export default function OnboardingStep1() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [babyDob, setBabyDob] = useState('');

  const canContinue = name.trim().length > 0 && babyDob.trim().length > 0;

  return (
    <View style={styles.container}>
      <ProgressBar progress={1 / 6} />

      <View style={styles.content}>
        <Typography variant="displayL" color={colors.cobalt}>
          let's start with you
        </Typography>

        <View style={styles.field}>
          <Typography variant="label" color={colors.muted}>
            YOUR NAME
          </Typography>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="First name"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.field}>
          <Typography variant="label" color={colors.muted}>
            BABY'S DATE OF BIRTH
          </Typography>
          <TextInput
            style={styles.input}
            value={babyDob}
            onChangeText={setBabyDob}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
          />
        </View>
      </View>

      <Button
        title="CONTINUE"
        onPress={() => router.push('/(auth)/onboarding/step2')}
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
    gap: spacing.xxl,
  },
  field: {
    gap: spacing.sm,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: spacing.md,
  },
});
