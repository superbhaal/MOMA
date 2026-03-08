import { Pressable, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

interface PillProps {
  label: string;
  active?: boolean;
  activeColor?: string;
  onPress?: () => void;
}

export function Pill({
  label,
  active = false,
  activeColor = colors.pool,
  onPress,
}: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        { backgroundColor: active ? activeColor : colors.cream },
      ]}
    >
      <Typography
        variant="labelS"
        color={active ? colors.white : colors.muted}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
});
