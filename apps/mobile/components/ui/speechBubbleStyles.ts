import { StyleSheet } from 'react-native';
import { Shadows } from '../../constants/theme';

/** The established Lesson 1/2 paper, border and responsive bubble treatment. */
export const SpeechBubbleColors = { paper: '#FFF9EE', border: '#F5C799', text: '#342214' } as const;
export const speechBubbleStyles = StyleSheet.create({
  surface: { backgroundColor: SpeechBubbleColors.paper, borderColor: SpeechBubbleColors.border, borderRadius: 24, borderWidth: 2, position: 'relative', ...Shadows.card },
  landscape: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
});
