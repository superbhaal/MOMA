import { Text, TextProps, StyleSheet } from 'react-native';
import { textStyles } from '@/constants/typography';
import { colors } from '@/constants/colors';

type Variant = keyof typeof textStyles;

interface TypographyProps extends TextProps {
  variant?: Variant;
  color?: string;
}

export function Typography({
  variant = 'bodyL',
  color = colors.text,
  style,
  ...props
}: TypographyProps) {
  return (
    <Text
      style={[textStyles[variant], { color }, style]}
      {...props}
    />
  );
}
