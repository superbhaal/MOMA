import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { GroupPulse } from '@/components/groups/GroupPulse';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useGroups } from '@/hooks/useGroups';

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groups, loading, refresh } = useGroups();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Typography variant="displayL" color={colors.cobalt} style={styles.header}>
        chats
      </Typography>

      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.cobalt} />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/group/${item.id}/chat`)}
          >
            <View style={styles.avatarStack}>
              {item.members.slice(0, 3).map((m, i) => (
                <View
                  key={m.id}
                  style={{
                    marginLeft: i === 0 ? 0 : -8,
                    zIndex: item.members.length - i,
                  }}
                >
                  <Avatar
                    name={m.user.display_name}
                    ringColor={m.user.profile_color ?? colors.fuchsia}
                    photoUrl={m.user.avatar_url ?? undefined}
                    size={36}
                    outlineColor={colors.white}
                  />
                </View>
              ))}
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Typography variant="displayS" color={colors.text}>
                {item.name}
              </Typography>
              {item.last_message ? (
                <Typography
                  variant="bodyM"
                  color={colors.muted}
                  numberOfLines={1}
                  style={{ marginTop: 2 }}
                >
                  {item.last_message.content}
                </Typography>
              ) : (
                <Typography
                  variant="bodyM"
                  color={colors.muted}
                  style={{ marginTop: 2 }}
                >
                  it&rsquo;s quiet — say hi.
                </Typography>
              )}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <GroupPulse
                lastMessage={item.last_message}
                lastActiveAt={item.last_active_at}
              />
              {item.unread_count > 0 ? (
                <View style={styles.unreadPip}>
                  <Typography variant="labelS" color={colors.white}>
                    {item.unread_count}
                  </Typography>
                </View>
              ) : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <Typography
              variant="bodyL"
              color={colors.muted}
              style={{ paddingHorizontal: spacing.xl, textAlign: 'center' }}
            >
              your group chats land here once you&rsquo;re matched.
            </Typography>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  avatarStack: { flexDirection: 'row' },
  unreadPip: {
    backgroundColor: colors.fuchsia,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
