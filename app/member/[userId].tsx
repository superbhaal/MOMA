import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { supabase } from '@/lib/supabase';
import { openInstagramProfile } from '@/lib/instagram';
import type { User } from '@/types';

export default function MemberScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const insets = useSafeAreaInsets();
  const [u, setU] = useState<User | null>(null);

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
          <Typography variant="labelS" color={colors.cobalt}>
            ← BACK
          </Typography>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
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
                size={96}
                ringWidth={3}
              />
              <Typography
                variant="displayL"
                color={colors.text}
                style={{ marginTop: spacing.md }}
              >
                {u.display_name}
              </Typography>
              {u.neighbourhood ? (
                <Typography variant="bodyL" color={colors.muted}>
                  {u.neighbourhood.toLowerCase()}
                </Typography>
              ) : null}
            </View>

            {u.bio ? (
              <Card style={{ marginTop: spacing.xl }}>
                <Typography variant="reading" color={colors.text}>
                  {u.bio}
                </Typography>
              </Card>
            ) : null}

            {u.interests && u.interests.length > 0 ? (
              <View style={{ marginTop: spacing.xl }}>
                <Typography variant="label" color={colors.muted}>
                  INTERESTS
                </Typography>
                <Typography variant="bodyL" color={colors.text} style={{ marginTop: 4 }}>
                  {u.interests.join(' · ')}
                </Typography>
              </View>
            ) : null}

            {u.instagram_handle ? (
              <Pressable
                onPress={() => openInstagramProfile(u.instagram_handle)}
                style={styles.instagramRow}
              >
                <Typography variant="label" color={colors.muted}>
                  INSTAGRAM
                </Typography>
                <Typography
                  variant="bodyL"
                  color={colors.cobalt}
                  style={{ marginTop: 4 }}
                >
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  hero: { alignItems: 'center', marginTop: spacing.lg },
  instagramRow: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
  },
});
