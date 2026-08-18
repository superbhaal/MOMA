import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { Illustration, type IllustrationName } from '@/components/ui/Illustration';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { radius, spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';

interface DiscoverHeaderProps {
  /** Fixed section title across all sub-tabs. */
  title?: string;
  /** Context line under the title (varies per sub-tab). */
  subtitle: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
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
 *
 * One masthead for all three sub-tabs, at one size. Explore used to shrink it
 * to buy room for the map, which made switching to it read as landing on a
 * different screen rather than turning a page — only the drawing and the two
 * lines of copy change now.
 */
export function DiscoverHeader({
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  topInset = 0,
  titleRight,
  illustration,
}: DiscoverHeaderProps) {
  const { t } = useTranslation();
  return (
    <View style={[styles.band, { paddingTop: topInset + 26 }]}>
      <View style={styles.titleRow}>
        {/* The drawing sits outside the title box, so the title keeps its
            centred two-line break instead of flowing around it. */}
        <Typography
          style={[styles.title, illustration && styles.titleInset]}
          color={colors.cobalt}
        >
          {title ?? t('dis.masthead')}
        </Typography>
        {/* Both live in the right margin, and the badge carries meaning where
            the drawing is decoration — so the badge wins when they collide. */}
        {illustration && !titleRight ? (
          <Illustration name={illustration} size="lg" style={styles.illo} />
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
          placeholder={searchPlaceholder ?? t('dis.searchDefault')}
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
    fontSize: scaled(34),
    lineHeight: scaled(40),
    letterSpacing: -0.4,
    textAlign: 'center',
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
    fontSize: scaled(12),
    lineHeight: scaled(17),
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
    fontSize: scaled(14),
    color: colors.text,
    padding: 0,
  },
});
