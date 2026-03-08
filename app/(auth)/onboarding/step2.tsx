import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

export default function OnboardingStep2() {
  const router = useRouter();

  async function handleAllowLocation() {
    // TODO: request location permission via expo-location
    router.push('/(auth)/onboarding/step3');
  }

  return (
    <View style={styles.container}>
      <ProgressBar progress={2 / 6} />

      <View style={styles.content}>
        <Typography variant="displayL" color={colors.cobalt}>
          where are you?
        </Typography>
        <Typography variant="bodyL" color={colors.muted}>
          we'll match you with moms nearby so meetups are actually doable.
        </Typography>
      </View>

      <View style={styles.actions}>
        <Button title="ALLOW LOCATION" onPress={handleAllowLocation} />
        <Button
          title="ENTER CITY MANUALLY"
          variant="ghost"
          onPress={() => router.push('/(auth)/onboarding/step3')}
        />
      </View>
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
  actions: {
    gap: spacing.md,
  },
});
