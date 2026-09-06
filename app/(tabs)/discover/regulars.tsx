import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Typography } from '@/components/ui/Typography';
import { DiscoverHeader } from '@/components/discover/DiscoverHeader';
import { DiscoverSubTabs, type DiscoverTab } from '@/components/discover/DiscoverSubTabs';
import { SavedFilterToggle } from '@/components/discover/SavedFilterToggle';
import { SaveHeart } from '@/components/discover/SaveHeart';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts, textStyles } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import { useRegulars, type Regular } from '@/hooks/useLovedSpots';
import { useSavedTips } from '@/hooks/useSavedTips';
import { useAppStore } from '@/store/useAppStore';

/**
 * The Regulars — moms with write access to the Explore map, as a searchable
 * list. Its own route rather than a feed tab: Learn and Watch are one Sanity
 * query with a format filter, and this is people from Postgres.
 */
export default function RegularsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { regulars, loading } = useRegulars(query);
  const [savedOnly, setSavedOnly] = useState(false);
  const { isSaved } = useSavedTips();
  const shown = useMemo(
    () => (savedOnly ? regulars.filter((r) => isSaved(r.id)) : regulars),
    [regulars, savedOnly, isSaved],
  );
  const setFeedTab = useAppStore((s) => s.setDiscoverFeedTab);

  const onSubTab = (next: DiscoverTab) => {
    if (next === 'regular') return;
    if (next === 'explore') {
      router.replace('/discover/explore');
      return;
    }
    // Same move as Explore makes: set the feed tab in the store, then pop back
    // to the feed already mounted underneath rather than stacking a copy.
    setFeedTab(next);
    if (router.canGoBack()) router.dismissTo('/discover');
    else router.replace('/discover');
  };

  return (
    <View style={styles.container}>
      <DiscoverHeader
        subtitle={t('dis.subRegular')}
        searchPlaceholder={t('dis.searchRegulars')}
        searchValue={query}
        onSearchChange={setQuery}
        searchRight={<SavedFilterToggle active={savedOnly} onChange={setSavedOnly} />}
        topInset={insets.top}
        illustration="poolside"
      />
      <DiscoverSubTabs active="regular" onChange={onSubTab} />

      {loading && regulars.length === 0 ? (
        <ActivityIndicator style={{ marginTop: spacing.xxl }} color={colors.cobalt} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Typography style={styles.empty} color={colors.muted}>
              {savedOnly
                ? t('dis.emptySavedRegulars')
                : query.trim()
                  ? t('dis.noRegulars')
                  : t('dis.regularsEmpty')}
            </Typography>
          }
          renderItem={({ item }) => <Row regular={item} onPress={() => router.push(`/discover/contributor/${item.id}`)} />}
        />
      )}
    </View>
  );
}

function Row({ regular, onPress }: { regular: Regular; onPress: () => void }) {
  const { t } = useTranslation();
  const where = regular.neighbourhood?.split(',')[0]?.trim() || regular.city || '';
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Avatar
        name={regular.display_name}
        ringColor={regular.profile_color ?? colors.fuchsia}
        photoUrl={regular.avatar_url}
        size={48}
        isRegular
      />
      <View style={styles.rowText}>
        <Typography style={styles.name} color={colors.text}>
          {regular.display_name}
        </Typography>
        <Typography style={styles.meta} color={colors.muted}>
          {[where, t('dis.spotsCount', { count: regular.spot_count })]
            .filter(Boolean)
            .join(' · ')}
        </Typography>
      </View>
      {/* Nothing else claims the right edge here, so the heart can sit on the
          row itself — one tap to keep a mom she wants to find again. */}
      <SaveHeart docId={regular.id} docType="regular" title={regular.display_name} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  list: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowText: { flex: 1 },
  name: { fontFamily: fonts.serifReg, fontSize: scaled(19), lineHeight: scaled(23) },
  meta: { ...textStyles.control, marginTop: 1 },
  empty: {
    ...textStyles.cardBody,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
