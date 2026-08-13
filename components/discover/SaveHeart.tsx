import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import type { SavedDocType } from '@/types';
import { useSavedTips } from '@/hooks/useSavedTips';

interface SaveHeartProps {
  docId: string;
  docType: SavedDocType;
  /** Snapshotted onto the row so the shelf can name what she kept. */
  title?: string;
  size?: number;
}

/**
 * Stroked heart that toggles a Learn/Watch bookmark. Saved → filled fuchsia.
 * stopPropagation so saving never opens the article/reel underneath.
 */
export function SaveHeart({ docId, docType, title, size = 20 }: SaveHeartProps) {
  const { isSaved, toggle } = useSavedTips();
  const saved = isSaved(docId);
  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation?.();
        toggle(docId, docType, title);
      }}
      hitSlop={12}
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Saved' : 'Save'}
    >
      <Ionicons
        name={saved ? 'heart' : 'heart-outline'}
        size={size}
        color={saved ? colors.fuchsia : colors.muted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 2 },
});
