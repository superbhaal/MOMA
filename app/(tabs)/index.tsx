import { View, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useGroups } from '@/hooks/useGroups';

export default function HomeScreen() {
  const router = useRouter();
  const { groups, loading } = useGroups();

  return (
    <View style={styles.container}>
      <Typography variant="displayL" color={colors.cobalt} style={styles.header}>
        my groups
      </Typography>

      {loading ? (
        <Typography variant="bodyL" color={colors.muted} style={styles.empty}>
          loading...
        </Typography>
      ) : groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Typography variant="bodyL" color={colors.muted} style={styles.empty}>
            no groups yet — you'll be matched soon!
          </Typography>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card
              onPress={() => router.push(`/group/${item.id}`)}
            >
              <Typography variant="displayS">{item.name}</Typography>
              <Typography variant="bodyM" color={colors.muted}>
                {item.city}
              </Typography>
            </Card>
          )}
        />
      )}
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
  list: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
  },
});
