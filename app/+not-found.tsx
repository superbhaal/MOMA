import { Link, Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Typography variant="displayM">Page not found</Typography>
        <Link href="/" style={styles.link}>
          <Typography variant="bodyL" color={colors.cobalt}>
            Go to home screen
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
