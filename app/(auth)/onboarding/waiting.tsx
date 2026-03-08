import { View, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

export default function WaitingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Typography variant="displayXL" color={colors.cobalt} style={styles.centered}>
          your group is{'\n'}on its way
        </Typography>
        <Typography variant="bodyL" color={colors.muted} style={styles.centered}>
          we're matching you with moms nearby who are on a similar journey. you'll get a notification as soon as your group is ready.
        </Typography>
      </View>

      <Typography variant="bodyS" color={colors.muted} style={styles.centered}>
        this usually takes less than 24 hours
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingTop: 120,
    paddingBottom: 60,
    justifyContent: 'space-between',
  },
  content: {
    gap: spacing.xl,
  },
  centered: {
    textAlign: 'center',
  },
});
