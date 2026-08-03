import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { MeCard } from '@/components/me/MeCard';
import { MeSectionLabel } from '@/components/me/MeSectionLabel';
import { SettingsHeader } from '@/components/me/SettingsHeader';
import { Pill } from '@/components/ui/Pill';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';
import { scaled } from '@/constants/scale';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import type { NotifChatCadence } from '@/types';

const CADENCE: { value: NotifChatCadence; label: string }[] = [
  { value: 'every', label: 'Every message' },
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'off', label: 'Off' },
];

const HOURS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { update } = usePreferences();

  const [meetupReminders, setMeetupReminders] = useState(user?.notif_meetup_reminders ?? true);
  const [cadence, setCadence] = useState<NotifChatCadence>(user?.notif_chat_activity ?? 'daily');
  const [quietEnabled, setQuietEnabled] = useState(user?.notif_quiet_hours_enabled ?? false);
  const [quietStart, setQuietStart] = useState(user?.notif_quiet_start ?? '21:00');
  const [quietEnd, setQuietEnd] = useState(user?.notif_quiet_end ?? '07:00');

  function setMeetup(v: boolean) {
    setMeetupReminders(v);
    update({ notif_meetup_reminders: v });
  }
  function setCad(v: NotifChatCadence) {
    setCadence(v);
    update({ notif_chat_activity: v });
  }
  function setQuiet(v: boolean) {
    setQuietEnabled(v);
    update({ notif_quiet_hours_enabled: v });
  }
  function setStart(v: string) {
    setQuietStart(v);
    update({ notif_quiet_start: v });
  }
  function setEnd(v: string) {
    setQuietEnd(v);
    update({ notif_quiet_end: v });
  }

  return (
    <View style={styles.container}>
      <SettingsHeader title="Notifications" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <MeSectionLabel label="Meetups" />
        <MeCard padded>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Typography style={styles.rowTitle}>Meetup reminders</Typography>
              <Typography style={styles.rowSub}>
                A nudge the day before a confirmed meetup.
              </Typography>
            </View>
            <Switch
              value={meetupReminders}
              onValueChange={setMeetup}
              trackColor={{ true: colors.cobalt, false: colors.line }}
            />
          </View>
        </MeCard>

        <MeSectionLabel label="Group chat activity" />
        <MeCard padded>
          <Typography style={styles.rowSub}>
            How often we let you know about new messages in your groups.
          </Typography>
          <View style={styles.pills}>
            {CADENCE.map((c) => (
              <Pill
                key={c.value}
                label={c.label}
                active={cadence === c.value}
                tone="pool"
                onPress={() => setCad(c.value)}
              />
            ))}
          </View>
        </MeCard>

        <MeSectionLabel label="Quiet hours" />
        <MeCard padded>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Typography style={styles.rowTitle}>Mute overnight</Typography>
              <Typography style={styles.rowSub}>
                No pushes between your chosen hours.
              </Typography>
            </View>
            <Switch
              value={quietEnabled}
              onValueChange={setQuiet}
              trackColor={{ true: colors.cobalt, false: colors.line }}
            />
          </View>

          {quietEnabled ? (
            <View style={styles.timeBlock}>
              <Typography style={styles.timeLabel}>FROM</Typography>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRow}>
                {HOURS.map((h) => (
                  <Pill key={`s-${h}`} label={h} active={quietStart === h} onPress={() => setStart(h)} />
                ))}
              </ScrollView>
              <Typography style={[styles.timeLabel, { marginTop: spacing.md }]}>TO</Typography>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeRow}>
                {HOURS.map((h) => (
                  <Pill key={`e-${h}`} label={h} active={quietEnd === h} onPress={() => setEnd(h)} />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </MeCard>

        <Typography style={styles.footnote}>
          Changes save automatically.
        </Typography>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: spacing.xxxl },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchText: { flex: 1 },
  rowTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(14),
    color: colors.text,
  },
  rowSub: {
    fontFamily: fonts.body,
    fontSize: scaled(12),
    lineHeight: scaled(18),
    color: colors.muted,
    marginTop: 2,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.md,
  },
  timeBlock: { marginTop: spacing.lg },
  timeLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: scaled(10),
    letterSpacing: 1.4,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  timeRow: { gap: 8, paddingRight: spacing.lg },
  footnote: {
    fontFamily: fonts.body,
    fontSize: scaled(12),
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
