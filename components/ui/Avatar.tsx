import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { colors } from '@/constants/colors';

interface AvatarProps {
  name: string;
  color?: string;
  size?: number;
}

export function Avatar({ name, color = colors.fuchsia, size = 40 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Typography
        variant="bodyM"
        color={colors.white}
        style={{ fontSize: size * 0.36 }}
      >
        {initials}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
