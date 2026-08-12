import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useDiscoverRole } from '@/hooks/useDiscoverRole';

interface ComposeFabProps {
  bottom?: number;
  /** What tapping it does. Defaults to the Explore place composer. */
  onPress?: () => void;
  /** Spoken by VoiceOver — the FAB has no visible text to read. */
  accessibilityLabel?: string;
}

/**
 * Role-gated compose affordance, fixed above the bottom nav.
 *   contributor / admin → cobalt round FAB.
 *   reader              → nothing. Readers were shown a banner explaining that
 *   posting opens up later; it sat over the feed on every visit and explained a
 *   door they can't see, so it's gone.
 *
 * A bare +, because the button sits over a feed and a labelled pill covered the
 * card behind it. What it adds is whatever the tab is made of — a reel on
 * Watch, a place or a person on Explore — so each tab passes its own handler.
 * Read has no FAB at all: the articles are ours to write.
 */
export function ComposeFab({
  // Just clear of the tab bar. It shipped at 100, which put it a third of the
  // way up the last card and read as floating loose over the feed.
  bottom = 20,
  onPress,
  accessibilityLabel = 'Share a recommendation',
}: ComposeFabProps) {
  const router = useRouter();
  const { canPost } = useDiscoverRole();

  if (!canPost) return null;

  return (
    <Pressable
      style={({ pressed }) => [styles.fab, { bottom }, pressed && styles.fabPressed]}
      onPress={onPress ?? (() => router.push('/discover/place/new'))}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name="add" size={24} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.cobalt,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.cobalt,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabPressed: { backgroundColor: colors.cobaltDeep, transform: [{ translateY: 0.5 }] },
});
