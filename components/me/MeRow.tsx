import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

interface MeRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconTint: string;
  iconBg: string;
  label: string;
  /** Muted text shown before the chevron (e.g. "5 members", "On"). */
  value?: string;
  onPress?: () => void;
  /** Renders the label in cherry and drops the icon tint to a danger look. */
  danger?: boolean;
  /** Hide the trailing chevron (e.g. for inert info rows). */
  showArrow?: boolean;
  /** First/last row corner rounding is handled by the parent MeCard's overflow. */
  isLast?: boolean;
}

/** A single tappable row inside a MeCard (icon · label · value · chevron). */
export function MeRow({
  icon,
  iconTint,
  iconBg,
  label,
  value,
  onPress,
  danger = false,
  showArrow = true,
  isLast = false,
}: MeRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        isLast && styles.rowLast,
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={15} color={danger ? colors.cherry : iconTint} />
      </View>
      <Typography style={[styles.label, danger && { color: colors.cherry }]}>
        {label}
      </Typography>
      {value ? <Typography style={styles.value}>{value}</Typography> : null}
      {showArrow ? (
        <Ionicons name="chevron-forward" size={15} color={colors.muted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  pressed: {
    backgroundColor: colors.cream,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    color: colors.text,
  },
  value: {
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    color: colors.muted,
    marginRight: 2,
  },
});
