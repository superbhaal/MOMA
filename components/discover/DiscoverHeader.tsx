import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { Illustration, type IllustrationName } from '@/components/ui/Illustration';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';

interface DiscoverHeaderProps {
  /** Fixed section title across all sub-tabs. */
  title?: string;
  /** Context line under the title (varies per sub-tab). */
  subtitle: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  /** `feed` = Learn/Watch (38px title). `map` = Explore (28px, tighter). */
  variant?: 'feed' | 'map';
  /** Extra top padding for the status bar (safe-area inset). */
  topInset?: number;
  /** Right-aligned adornment beside the title (e.g. the Contributor badge). */
  titleRight?: React.ReactNode;
  /** The sub-tab's drawing, sitting to the right of the masthead. */
  illustration?: IllustrationName;
}

/**
 * v11 Discover header — the soleil band is GONE: white ground, centred
 * serif-italic cobalt title, quiet centred subtitle, hairline-outlined pill
 * search. Ref: design/moma-v11.html · #screen-well (Refined skin).
 */
export function DiscoverHeader({
  title = 'How to build a human',
  subtitle,
  searchPlaceholder = 'Search…',
  searchValue,
  onSearchChange,
  variant = 'feed',
  topInset = 0,
  titleRight,
  illustration,
}: DiscoverHeaderProps) {
  const isMap = variant === 'map';
  return (
    <View style={[styles.band, { paddingTop: topInset + (isMap ? spacing.md : 26) }]}>
      <View style={styles.titleRow}>
        {/* The drawing sits outside the title box, so the title keeps its
            centred two-line break instead of flowing around it. */}
        <Typography
          style={[styles.title, isMap && styles.titleMap, illustration && styles.titleInset]}
          color={colors.cobalt}
        >
          {title}
        </Typography>
        {/* Both live in the right margin, and the badge carries meaning where
            the drawing is decoration — so the badge wins when they collide. */}
        {illustration && !titleRight ? (
          <Illustration name={illustration} size={isMap ? 'md' : 'lg'} style={styles.illo} />
        ) : null}
        {titleRight ? <View style={styles.titleRight}>{titleRight}</View> : null}
      </View>

      <Typography style={styles.subtitle} color={colors.muted}>
        {subtitle}
      </Typography>

      <View style={styles.search}>
        <Ionicons name="search" size={15} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.muted}
          value={searchValue}
          onChangeText={onSearchChange}
          returnKeyType="search"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: colors.white,
    paddingHorizontal: 26,
    paddingBottom: spacing.md,
  },
  titleRow: {
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontFamily: fonts.serifItal,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  titleMap: {
    fontSize: 27,
    lineHeight: 32,
  },
  // Narrows the measured text box so "How to build a human" breaks over two
  // lines and leaves the right margin to the drawing.
  titleInset: {
    paddingHorizontal: 56,
  },
  illo: {
    position: 'absolute',
    right: -6,
    top: -2,
  },
  titleRight: {
    position: 'absolute',
    right: 0,
    top: 4,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
});
