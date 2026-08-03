import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';

interface ProgressSegmentsProps {
  /** Number of segments. */
  count: number;
  /** How many are complete (filled cobalt). */
  filled: number;
}

/** The composer's N-segment progress bar — completed segments fill cobalt. */
export function ProgressSegments({ count, filled }: ProgressSegmentsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.seg, i < filled && styles.segFilled]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, flex: 1 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong },
  segFilled: { backgroundColor: colors.cobalt },
});
