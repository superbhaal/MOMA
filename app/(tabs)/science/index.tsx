import { View, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

export default function ScienceScreen() {
  return (
    <View style={styles.container}>
      <Typography variant="displayL" color={colors.soleil} style={styles.header}>
        science & wellness
      </Typography>
      <Typography variant="bodyL" color={colors.muted} style={styles.placeholder}>
        articles feed coming soon
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  placeholder: {
    paddingHorizontal: spacing.xl,
  },
});
