import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Typography variant="displayM">Page not found</Typography>
        <Link href="/" style={styles.link}>
          <Typography variant="bodyL" color={colors.cobalt}>
        {t('misc.goHome')}
          </Typography>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  link: {
    marginTop: spacing.lg,
  },
});
