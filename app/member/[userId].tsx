import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { fonts, textStyles } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { supabase } from '@/lib/supabase';
import { openInstagramProfile } from '@/lib/instagram';
import { BroughtCard } from '@/components/brought/BroughtCard';
import { KIND_POSSESSIVE } from '@/constants/brought';
import { useBroughtFor } from '@/hooks/useBrought';
import type { User } from '@/types';

/**
 * Member profile — v11: centred hero (ringed avatar, serif-italic cobalt
 * name, small-caps meta), Lora-italic bio on white, outlined interest pills,
 * quiet cobalt links. Ref: design/moma-v11.html · #screen-member.
 */
export default function MemberScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { items: broughtItems } = useBroughtFor(userId ? [userId] : []);
  const insets = useSafeAreaInsets();
  const [u, setU] = useState<User | null>(null);
  const brought = userId ? broughtItems[userId] : undefined;

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setU(data as User);
      });
  }, [userId]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Typography style={styles.back} color={colors.cobalt}>
            ← Back
          </Typography>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!u ? (
          <Typography variant="bodyL" color={colors.muted}>
            loading...
          </Typography>
        ) : (
          <>
            <View style={styles.hero}>
              <Avatar
                name={u.display_name}
                ringColor={u.profile_color ?? colors.fuchsia}
                photoUrl={u.avatar_url ?? undefined}
                size={104}
                ringWidth={3}
              />
              <Typography style={styles.name} color={colors.cobalt}>
                {u.display_name}
              </Typography>
              {u.neighbourhood ? (
                <Typography style={styles.meta} color={colors.muted}>
                  {u.neighbourhood.toUpperCase()}
                </Typography>
              ) : null}
            </View>

            {u.bio ? (
              <Typography style={styles.bio} color={colors.mutedStrong}>
                {u.bio}
              </Typography>
            ) : null}

            {u.interests && u.interests.length > 0 ? (
              <View style={styles.interests}>
                {u.interests.map((it) => (
                  <View key={it} style={styles.interestPill}>
                    <Typography style={styles.interestText} color={colors.text}>
                      {it}
                    </Typography>
                  </View>
                ))}
              </View>
            ) : null}

            {/* What she brought — attributed, and its own page one tap away. */}
            {brought ? (
              <View style={styles.broughtSection}>
                <Typography style={styles.broughtLabel} color={colors.cobalt}>
                  {KIND_POSSESSIVE[brought.kind].toUpperCase()}
                </Typography>
                <BroughtCard item={brought} onPress={() => router.push(`/brought/${u.id}`)} />
              </View>
            ) : null}

            {u.instagram_handle ? (
              <Pressable
                onPress={() => openInstagramProfile(u.instagram_handle)}
                style={styles.instagramRow}
                hitSlop={8}
              >
                <Typography style={styles.instagram} color={colors.cobalt}>
                  @{u.instagram_handle.replace(/^@/, '')} ↗
                </Typography>
              </Pressable>
            ) : null}

            <View style={{ marginTop: spacing.xxl }}>
              <Button
                title="message"
                size="lg"
                onPress={() => router.push(`/group/dm/${u.id}`)}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    paddingHorizontal: 26,
    paddingVertical: spacing.md,
  },
  back: { fontFamily: fonts.bodyMed, fontSize: scaled(13) },
  scroll: {
    paddingHorizontal: 26,
    paddingBottom: spacing.xxxl,
  },
  hero: { alignItems: 'center', marginTop: spacing.xl },
  name: {
    fontFamily: fonts.serifItal,
    fontSize: scaled(34),
    lineHeight: scaled(40),
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  meta: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(10.5),
    letterSpacing: 2.4,
    marginTop: 5,
  },
  broughtSection: { marginTop: spacing.xxl, alignSelf: 'stretch' },
  broughtLabel: textStyles.labelS,
  bio: {
    fontFamily: fonts.readingItal,
    fontSize: scaled(15),
    lineHeight: scaled(24),
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  interests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 9,
    marginTop: spacing.xl,
  },
  interestPill: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 100,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  interestText: { fontFamily: fonts.body, fontSize: scaled(13) },
  instagramRow: { alignItems: 'center', marginTop: spacing.xl },
  instagram: { fontFamily: fonts.bodySemi, fontSize: scaled(14) },
});
