import { Pressable, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/spacing';
import { scaled } from '@/constants/scale';

interface SceneOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Pill-shaped multi-select option (Q1, Q4 languages). Matches `.ob-lang-pill`. */
export function SceneOption({ label, selected, onPress }: SceneOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, selected && styles.pillSelected]}
    >
      <Typography
        color={selected ? colors.cobalt : colors.white}
        style={[styles.label, selected && styles.labelSelected]}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  pillSelected: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderColor: colors.cobalt,
  },
  label: {
    fontSize: scaled(14),
    fontWeight: '500',
  },
  labelSelected: {
    fontWeight: '700',
  },
});
