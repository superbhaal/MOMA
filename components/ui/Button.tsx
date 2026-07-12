import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

type Variant = 'primary' | 'secondary' | 'ghost' | 'blush';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  icon,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Typography
        variant={size === 'sm' ? 'labelS' : 'label'}
        color={textColor(variant)}
      >
        {title}
      </Typography>
    </Pressable>
  );
}

function textColor(variant: Variant): string {
  switch (variant) {
    case 'primary':
      return colors.white;
    case 'blush':
      return colors.blushText;
    case 'secondary':
    case 'ghost':
    default:
      return colors.cobalt;
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
  icon: { marginRight: spacing.sm },
});

const sizeStyles = StyleSheet.create({
  sm: { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.lg },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.cobalt },
  secondary: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
  },
  ghost: { backgroundColor: 'transparent' },
  blush: { backgroundColor: colors.blush },
});
