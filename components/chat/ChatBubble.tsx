import { Pressable, StyleSheet, View } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { PlaceCard } from './PlaceCard';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import { spacing } from '@/constants/spacing';
import { scaled } from '@/constants/scale';
import { formatTime } from '@/lib/time';
import type { Message, PlaceAttachment, User } from '@/types';

interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  sender: User | null;
  /** Hide the sender column when the previous message has the same sender. */
  showAvatar?: boolean;
  /** Long-press handler (e.g. open a "message privately" sheet on others' messages). */
  onLongPress?: () => void;
}

/**
 * v11 editorial transcript row — no bubbles: a narrow left column with the
 * sender's identity dot + small-caps name, the message set in Lora serif on
 * the right, a quiet timestamp underneath. Same layout for self ("YOU", in
 * cobalt). Ref: design/moma-v11.html · #screen-chat.
 */
export function ChatBubble({ message, isMine, sender, showAvatar = true, onLongPress }: ChatBubbleProps) {
  const isPlace = message.attachment_type === 'place' && !!message.attachment_data;
  const dotColor = isMine ? colors.cobalt : sender?.profile_color ?? colors.fuchsia;
  const name = isMine ? 'You' : sender?.display_name ?? '?';

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={300}
      disabled={!onLongPress}
      style={styles.row}
    >
      <View style={styles.senderCol}>
        {showAvatar ? (
          <>
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <Typography
              style={styles.senderName}
              color={isMine ? colors.cobalt : colors.muted}
              numberOfLines={1}
            >
              {name.toUpperCase()}
            </Typography>
          </>
        ) : null}
      </View>

      <View style={styles.body}>
        {isPlace ? (
          <PlaceCard place={message.attachment_data as PlaceAttachment} />
        ) : (
          <Typography style={styles.text} color={colors.text}>
            {message.content}
          </Typography>
        )}
        <Typography style={styles.time} color={colors.muted}>
          {timeShort(message.created_at)}
        </Typography>
      </View>
    </Pressable>
  );
}

function timeShort(iso: string): string {
  return formatTime(iso);
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 26,
    marginVertical: 7,
    gap: spacing.md,
  },
  senderCol: {
    width: 56,
    alignItems: 'flex-start',
    paddingTop: 3,
    gap: 3,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  senderName: {
    fontFamily: fonts.bodyMed,
    fontSize: scaled(10.5),
    letterSpacing: 1.2,
  },
  body: { flex: 1 },
  text: {
    fontFamily: fonts.reading,
    fontSize: scaled(14),
    lineHeight: scaled(21),
  },
  time: {
    fontFamily: fonts.body,
    fontSize: scaled(10.5),
    letterSpacing: 0.5,
    marginTop: 3,
  },
});
