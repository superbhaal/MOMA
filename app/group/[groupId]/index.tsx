import { View, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();

  // TODO: fetch group details, members, next meetup from Supabase

  return (
    <View style={styles.container}>
      <Typography variant="displayL" color={colors.cobalt} style={styles.header}>
        Group
      </Typography>

      {/* Meetup banner placeholder */}
      <View style={styles.meetupBanner}>
        <Typography variant="bodyM" color={colors.blushText}>
          Next meetup coming soon
        </Typography>
      </View>

      {/* Members placeholder */}
      <Typography variant="label" color={colors.muted} style={styles.sectionLabel}>
        MEMBERS
      </Typography>

      <View style={styles.actions}>
        <Button
          title="OPEN CHAT"
          onPress={() => router.push(`/group/${groupId}/chat`)}
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
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  meetupBanner: {
    backgroundColor: colors.blush,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    marginBottom: spacing.md,
  },
  actions: {
    marginTop: 'auto',
    paddingBottom: 40,
  },
});
