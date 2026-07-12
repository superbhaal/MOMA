import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean; // default true
}

export function Card({ children, onPress, style, padded = true }: CardProps) {
  const compose = [styles.card, padded && styles.padded, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...compose, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={compose}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.xl,
  },
  padded: {
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.9,
  },
});
