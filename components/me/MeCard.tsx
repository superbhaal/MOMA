import { StyleSheet, View, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

interface MeCardProps {
  children: ReactNode;
  /** Adds inner padding. Off by default so MeRow lists sit flush to the edges. */
  padded?: boolean;
  style?: ViewStyle;
}

/** White rounded container used for every grouped block on the Me screen. */
export function MeCard({ children, padded = false, style }: MeCardProps) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
});
