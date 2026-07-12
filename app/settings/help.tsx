import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui/Typography';
import { MeCard } from '@/components/me/MeCard';
import { MeRow } from '@/components/me/MeRow';
import { MeSectionLabel } from '@/components/me/MeSectionLabel';
import { SettingsHeader } from '@/components/me/SettingsHeader';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/typography';

const FAQ = [
  {
    q: 'How does matching work?',
    a: 'We form small local groups of 3–5 moms at a similar life stage, in your area, with overlapping free time. You preview a group before joining — and can always ask for another.',
  },
  {
    q: 'Why can I only join two groups?',
    a: 'Showing up matters more than collecting groups. Two is enough to find your people without spreading yourself thin.',
  },
  {
    q: 'Can I pause without leaving my groups?',
    a: 'Yes. Pause matching from your profile — your current groups stay open, you just stop being matched into new ones.',
  },
  {
    q: 'Who can see my profile?',
    a: 'Only the members of groups you join. There is no public profile and no stranger search.',
  },
];

export default function HelpScreen() {
  const [open, setOpen] = useState<number | null>(null);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={styles.container}>
      <SettingsHeader title="Help & support" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <MeSectionLabel label="Frequently asked" />
        <MeCard>
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <Pressable
                key={i}
                onPress={() => setOpen(isOpen ? null : i)}
                style={[styles.faqRow, i === FAQ.length - 1 && styles.faqRowLast]}
              >
                <View style={styles.faqHead}>
                  <Typography style={styles.faqQ}>{item.q}</Typography>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.muted}
                  />
                </View>
                {isOpen ? <Typography style={styles.faqA}>{item.a}</Typography> : null}
              </Pressable>
            );
          })}
        </MeCard>

        <MeSectionLabel label="Get in touch" />
        <MeCard>
          <MeRow
            icon="mail-outline"
            iconTint={colors.cobalt}
            iconBg="#eef2ff"
            label="Email support"
            value="hello@moma.app"
            onPress={() => Linking.openURL('mailto:hello@moma.app?subject=møma%20support')}
          />
          <MeRow
            icon="document-text-outline"
            iconTint="#2a7a2a"
            iconBg="#f0faf0"
            label="Community guidelines"
            isLast
            onPress={() => Linking.openURL('https://moma.app/guidelines')}
          />
        </MeCard>

        <Typography style={styles.version}>møma v{version}</Typography>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: spacing.xxxl },
  faqRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  faqRowLast: { borderBottomWidth: 0 },
  faqHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  faqQ: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.text,
  },
  faqA: {
    fontFamily: fonts.reading,
    fontSize: 13,
    lineHeight: 21,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  version: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
