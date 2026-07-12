import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { GroupCard } from '@/components/groups/GroupCard';
import { WaitingForMatchCard } from '@/components/groups/WaitingForMatchCard';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/hooks/useAuth';
import { useGroups } from '@/hooks/useGroups';
import { useMatching } from '@/hooks/useMatching';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { groups, loading, refresh } = useGroups();
  const matching = useMatching();

  const atCap = groups.length >= 2;
  const showFindAnother = groups.length === 1 && matching.status === 'waiting';
  const previewing = matching.status === 'previewing';

  const greeting = currentGreeting();
  const firstName = user?.display_name?.split(' ')[0] ?? '';
  const babyLabel = babyAgeLabel(user?.baby_dob);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Page header */}
      <View style={styles.header}>
        <Typography style={styles.eyebrow} color={colors.muted}>
          {greeting.toUpperCase()}
        </Typography>
        <Typography style={styles.title} color={colors.text}>
          {firstName}
        </Typography>
        {babyLabel ? (
          <View style={styles.weekPill}>
            <Typography style={styles.weekPillText} color={colors.white}>
              {babyLabel}
            </Typography>
          </View>
        ) : null}
      </View>
      <View style={styles.divider} />

      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.cobalt} />
        }
        ListHeaderComponent={
          <>
            <Typography style={styles.sectionLabel} color={colors.muted}>
              YOUR GROUPS
            </Typography>

            {previewing ? (
              <View style={{ marginBottom: spacing.md }}>
                <Card onPress={() => router.push('/group-preview')}>
                  <View style={styles.previewEyebrowRow}>
                    <View style={styles.previewEyebrowDot} />
                    <Typography
                      style={styles.previewEyebrow}
                      color={colors.cobalt}
                    >
                      YOUR GROUP IS READY
                    </Typography>
                  </View>
                  <Typography
                    variant="displayM"
                    color={colors.text}
                    style={{ marginTop: spacing.xs }}
                  >
                    Meet your group
                  </Typography>
                  <Typography
                    variant="bodyL"
                    color={colors.muted}
                    style={{ marginTop: spacing.xs }}
                  >
                    Tap to preview the moms we&rsquo;ve matched you with.
                  </Typography>
                </Card>
              </View>
            ) : null}

            {!previewing && groups.length === 0 && !loading ? (
              <WaitingForMatchCard />
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: spacing.md }}>
            <GroupCard group={item} onPress={() => router.push(`/group/${item.id}`)} />
          </View>
        )}
        ListFooterComponent={
          <View style={{ marginTop: spacing.lg }}>
            {showFindAnother ? (
              <Card>
                <Typography variant="label" color={colors.muted}>
                  STILL LOOKING
                </Typography>
                <Typography variant="bodyL" color={colors.text} style={{ marginTop: spacing.xs }}>
                  we&rsquo;re looking for a second group that fits your prefs.
                </Typography>
              </Card>
            ) : null}
            {atCap ? (
              <Typography variant="bodyM" color={colors.muted} style={{ textAlign: 'center' }}>
                you&rsquo;re at the 2-group cap. leave one to find another.
              </Typography>
            ) : null}
          </View>
        }
      />
    </View>
  );
}

function currentGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function babyAgeLabel(dob: string | null | undefined): string | null {
  if (!dob) return null;
  const days = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) {
    const w = Math.ceil(Math.abs(days) / 7);
    return `Due in ${w} week${w === 1 ? '' : 's'}`;
  }
  if (days < 7 * 12) {
    const w = Math.max(1, Math.floor(days / 7));
    return `Week ${w} with baby`;
  }
  if (days < 365 * 2) {
    const m = Math.floor(days / 30);
    return `${m} month${m === 1 ? '' : 's'} in`;
  }
  const y = Math.floor(days / 365);
  return `${y} year${y === 1 ? '' : 's'} in`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: 14,
  },
  eyebrow: {
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    letterSpacing: 1.6,
    marginBottom: 2,
  },
  title: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: 36,
    lineHeight: 38,
    letterSpacing: -0.4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginHorizontal: spacing.xl,
    marginTop: 10,
  },
  sectionLabel: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 10,
    letterSpacing: 1.6,
    paddingTop: 14,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  weekPill: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.fuchsia,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  previewEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewEyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cobalt,
  },
  previewEyebrow: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 10,
    letterSpacing: 1.6,
  },
  weekPillText: {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 11,
    letterSpacing: 0.3,
  },
});

