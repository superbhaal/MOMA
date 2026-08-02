import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';

/**
 * The drawn wave that separates a group's name from its meetup.
 * Ref: design/moma-v11.html · #screen-detail.
 *
 * Built from alternating half-arcs rather than an SVG path: it is one line of
 * decoration, not worth pulling a native drawing library into the build. Each
 * segment is a bordered box whose corner radius makes the curve — crests hang
 * from the top half, troughs from the bottom, and their ends meet mid-height.
 */
export function WaveRule({
  segments = 12,
  segmentWidth = 22,
  amplitude = 6,
  color = colors.cobalt,
  style,
}: {
  segments?: number;
  segmentWidth?: number;
  amplitude?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.row, { height: amplitude * 2 }, style]} accessible={false}>
      {Array.from({ length: segments }).map((_, i) => {
        const crest = i % 2 === 0;
        return (
          <View
            key={i}
            style={{
              width: segmentWidth,
              height: amplitude,
              marginTop: crest ? 0 : amplitude,
              borderColor: color,
              ...(crest
                ? {
                    borderTopWidth: 1.5,
                    borderTopLeftRadius: segmentWidth / 2,
                    borderTopRightRadius: segmentWidth / 2,
                  }
                : {
                    borderBottomWidth: 1.5,
                    borderBottomLeftRadius: segmentWidth / 2,
                    borderBottomRightRadius: segmentWidth / 2,
                  }),
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'center',
  },
});
