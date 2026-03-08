import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { supabase } from '@/lib/supabase';

export default function WelcomeScreen() {
  const router = useRouter();

  async function handleAppleSignIn() {
    // TODO: implement Apple SSO via supabase.auth.signInWithOAuth
    // For now, navigate to onboarding for dev
    router.push('/(auth)/onboarding/step1');
  }

  async function handleGoogleSignIn() {
    // TODO: implement Google SSO via supabase.auth.signInWithOAuth
    router.push('/(auth)/onboarding/step1');
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Typography variant="displayXL" color={colors.cobalt}>
          møma
        </Typography>
        <Typography
          variant="displayS"
          color={colors.muted}
          style={styles.tagline}
        >
          everyone says 'it takes a village.'{'\n'}here's yours.
        </Typography>
      </View>

      <View style={styles.actions}>
        <Button title="CONTINUE WITH APPLE" onPress={handleAppleSignIn} />
        <Button
          title="CONTINUE WITH GOOGLE"
          variant="secondary"
          onPress={handleGoogleSignIn}
          style={styles.googleBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 120,
    paddingBottom: 60,
  },
  hero: {
    alignItems: 'center',
  },
  tagline: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
  googleBtn: {
    marginTop: spacing.sm,
  },
});
