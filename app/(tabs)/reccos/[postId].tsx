import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();

  return (
    <View style={styles.container}>
      <Typography variant="displayM">Post Detail</Typography>
      <Typography variant="bodyL" color={colors.muted}>
        Post ID: {postId}
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
  },
});
