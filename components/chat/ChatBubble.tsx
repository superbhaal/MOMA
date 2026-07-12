import { StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import type { Message, User } from '@/types';

interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  sender: User | null;
  /** Hide the avatar when the previous message has the same sender. */
  showAvatar?: boolean;
}

export function ChatBubble({ message, isMine, sender, showAvatar = true }: ChatBubbleProps) {
  return (
    <View style={[styles.row, isMine && styles.rowMine]}>
      {!isMine && showAvatar ? (
        <Avatar
          name={sender?.display_name ?? '?'}
          ringColor={sender?.profile_color ?? colors.fuchsia}
          photoUrl={sender?.avatar_url ?? undefined}
          size={28}
        />
      ) : (
        <View style={{ width: 28 }} />
      )}
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleOther,
        ]}
      >
        {!isMine && showAvatar && sender ? (
          <Typography
            variant="labelS"
            color={sender.profile_color ?? colors.muted}
            style={{ marginBottom: 2 }}
          >
            {sender.display_name.toUpperCase()}
          </Typography>
        ) : null}
        <Typography
          variant="bodyL"
          color={isMine ? colors.white : colors.text}
        >
          {message.content}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  rowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  bubbleOther: {
    backgroundColor: colors.cream,
    borderBottomLeftRadius: 4,
  },
  bubbleMine: {
    backgroundColor: colors.cobalt,
    borderBottomRightRadius: 4,
  },
});
