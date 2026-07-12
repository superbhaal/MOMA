import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import type { ProposalVote, Vote } from '@/types';

interface ProposalVoteRowProps {
  votes: ProposalVote[];
  myVote: Vote | null;
  onVote: (v: Vote) => void;
}

const OPTIONS: { value: Vote; label: string }[] = [
  { value: 'going', label: 'going' },
  { value: 'maybe', label: 'maybe' },
  { value: 'cant', label: "can't" },
];

export function ProposalVoteRow({ votes, myVote, onVote }: ProposalVoteRowProps) {
  const tally: Record<Vote, number> = { going: 0, maybe: 0, cant: 0 };
  for (const v of votes) tally[v.vote] = (tally[v.vote] ?? 0) + 1;

  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = myVote === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onVote(opt.value)}
            style={[styles.btn, active && styles.btnActive]}
          >
            <Typography
              variant="labelS"
              color={active ? colors.white : colors.cobalt}
            >
              {opt.label.toUpperCase()}
            </Typography>
            <Typography
              variant="bodyS"
              color={active ? colors.white : colors.muted}
              style={{ marginTop: 2 }}
            >
              {tally[opt.value]}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  btnActive: {
    backgroundColor: colors.cobalt,
    borderColor: colors.cobalt,
  },
});
