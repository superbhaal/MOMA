import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from './Typography';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Fires once the sheet is presented — use to focus an input after the open animation. */
  onShow?: () => void;
}

/**
 * Bottom sheet primitive.
 * Used by: decline-reason, counter-proposal, place picker, group/profile actions,
 * RSVP undo, pause-matching, etc. (per CLAUDE.md).
 */
export function ActionSheet({ visible, onClose, title, children, onShow }: ActionSheetProps) {
  const translateY = useRef(new Animated.Value(400)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // A sheet is anchored to the bottom, so content it can't fit doesn't overflow
  // downwards where it would at least be obviously cut — it runs off the TOP of
  // the screen, under the status bar, and no amount of scrolling brings it
  // back. So the sheet is capped at what's actually visible: the window, less
  // the keyboard when it's up, less the notch, less a sliver that keeps the
  // page behind it recognisable as a page.
  const maxHeight = windowHeight - keyboardHeight - insets.top - spacing.xxl;

  // Lift the sheet above the keyboard so inputs (and what the user types) stay visible.
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 400,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      onShow={onShow}
      animationType="none"
    >
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY }],
            bottom: keyboardHeight,
            maxHeight,
            paddingBottom:
              keyboardHeight > 0 ? spacing.lg : Math.max(insets.bottom, spacing.lg),
          },
        ]}
      >
        <View style={styles.handle} />
        {title ? (
          <Typography variant="displayM" style={styles.title}>
            {title}
          </Typography>
        ) : null}
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,17,24,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: spacing.md,
  },
  title: {
    marginBottom: spacing.lg,
  },
});
