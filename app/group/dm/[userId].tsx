import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

export default function DmScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  return (
    <View style={styles.container}>
      <Typography variant="displayM" color={colors.cobalt}>
        Direct Message
      </Typography>
      <Typography variant="bodyL" color={colors.muted}>
        Chat with user — coming soon
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    gap: spacing.md,
  },
});
