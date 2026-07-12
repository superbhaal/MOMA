import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';

interface ColorSwatchProps {
  hex: string;
  selected: boolean;
  onPress: () => void;
  size?: number;
}

/** Round colour pill. Selected scales 1.22 + adds white border (per `.ob-sw.sel`). */
export function ColorSwatch({ hex, selected, onPress, size = 30 }: ColorSwatchProps) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <View
        style={[
          styles.outer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: selected ? colors.white : 'transparent',
            transform: [{ scale: selected ? 1.22 : 1 }],
          },
        ]}
      >
        <View
          style={{
            backgroundColor: hex,
            width: size - 5,
            height: size - 5,
            borderRadius: (size - 5) / 2,
          }}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
});
