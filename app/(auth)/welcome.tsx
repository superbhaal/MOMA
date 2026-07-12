import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Typography color={colors.cobalt} style={styles.brand}>
          møma
        </Typography>
        <Typography color={colors.muted} style={styles.tagline}>
          EVERYONE SAYS IT TAKES A VILLAGE.
        </Typography>
      </View>

      <View style={styles.actions}>
        <Button
          title="create an account"
          size="lg"
          onPress={() => router.push('/(auth)/signup')}
        />
        <Button
          title="i already have an account"
          variant="secondary"
          size="lg"
          onPress={() => router.push('/(auth)/login')}
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
    paddingBottom: 120,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontFamily: fonts.serif,
    fontSize: 96,
    lineHeight: 100,
  },
  tagline: {
    fontFamily: fonts.bodyMed,
    fontSize: 13,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
});
