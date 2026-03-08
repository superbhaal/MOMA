import { View, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/lib/supabase';

export default function MeScreen() {
  const user = useAppStore((s) => s.user);
  const reset = useAppStore((s) => s.reset);

  async function handleSignOut() {
    await supabase.auth.signOut();
    reset();
  }

  return (
    <View style={styles.container}>
      <Typography variant="displayL" color={colors.cobalt} style={styles.header}>
        me
      </Typography>

      <View style={styles.profile}>
        <Avatar
          name={user?.display_name ?? 'User'}
          color={user?.profile_color ?? colors.fuchsia}
          size={80}
        />
        <Typography variant="displayM" style={styles.name}>
          {user?.display_name ?? 'Loading...'}
        </Typography>
        <Typography variant="bodyM" color={colors.muted}>
          {user?.city ?? 'No city set'}
        </Typography>
      </View>

      <Button
        title="SIGN OUT"
        variant="secondary"
        onPress={handleSignOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  profile: {
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    marginTop: spacing.sm,
  },
});
