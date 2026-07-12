import { Pressable, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import type { SavedDocType } from '@/types';
import { useSavedTips } from '@/hooks/useSavedTips';

interface SaveHeartProps {
  docId: string;
  docType: SavedDocType;
  size?: number;
}

export function SaveHeart({ docId, docType, size = 22 }: SaveHeartProps) {
  const { isSaved, toggle } = useSavedTips();
  const saved = isSaved(docId);
  return (
    <Pressable
      onPress={() => toggle(docId, docType)}
      hitSlop={10}
      style={styles.btn}
    >
      <Typography
        variant="bodyL"
        color={saved ? colors.fuchsia : colors.muted}
        style={{ fontSize: size, lineHeight: size * 1.1 }}
      >
        {saved ? '♥' : '♡'}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 4,
  },
});
