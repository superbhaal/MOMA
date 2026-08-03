import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius } from '@/constants/spacing';
import { useDiscoverRole } from '@/hooks/useDiscoverRole';

/**
 * Role-gated compose affordance, fixed above the bottom nav.
 *   contributor / admin → cobalt pill FAB → place composer.
 *   reader              → nothing. Readers were shown a banner explaining that
 *   posting opens up later; it sat over the feed on every visit and explained a
 *   door they can't see, so it's gone.
 */
export function ComposeFab({ bottom = 100 }: { bottom?: number }) {
  const router = useRouter();
  const { canPost } = useDiscoverRole();

  if (!canPost) return null;

  return (
    <Pressable
      style={({ pressed }) => [styles.fab, { bottom }, pressed && styles.fabPressed]}
      onPress={() => router.push('/discover/place/new')}
      accessibilityRole="button"
      accessibilityLabel="Share a recommendation"
    >
      <Ionicons name="add" size={20} color={colors.white} />
      <Typography style={styles.fabLabel} color={colors.white}>
        Share a rec
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cobalt,
    borderRadius: radius.pill,
    paddingLeft: 16,
    paddingRight: 19,
    paddingVertical: 13,
    shadowColor: colors.cobalt,
    shadowOpacity: 0.36,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabPressed: { backgroundColor: colors.cobaltDeep, transform: [{ translateY: 0.5 }] },
  fabLabel: { fontFamily: fonts.bodySemi, fontSize: 14 },
});
