import { StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';

interface ProgressSegmentsProps {
  /** Number of segments. */
  count: number;
  /** How many are complete (filled cobalt). */
  filled: number;
}

/**
 * The composer's N-segment progress bar. Three states, not two: the steps
 * behind you are pale cobalt, the one you're on is solid, the rest are grey —
 * so the bar answers "where am I" as well as "how far in".
 */
export function ProgressSegments({ count, filled }: ProgressSegmentsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[
            styles.seg,
            i < filled - 1 && styles.segDone,
            i === filled - 1 && styles.segCurrent,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, flex: 1 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.lineStrong },
  segDone: { backgroundColor: colors.cobaltMuted },
  segCurrent: { backgroundColor: colors.cobalt },
});
