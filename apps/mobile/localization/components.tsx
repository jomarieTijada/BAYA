import React, { forwardRef } from 'react';
import { Image as NativeImage, type ImageProps, Text as NativeText, Pressable as NativePressable, TextInput as NativeTextInput, type TextProps, type PressableProps, type TextInputProps, View as NativeView, type View, type ViewProps } from 'react-native';
import { useLocalization } from './LocalizationProvider';
function localizedChildren(children: React.ReactNode, text: (source: string) => string): React.ReactNode {
  if (typeof children === 'string') return text(children);
  if (typeof children === 'number') return children;
  const result: React.ReactNode[] = [];
  let parts: (string | number)[] = [];
  const flush = () => {
    if (!parts.length) return;
    const source = parts.join('');
    const translated = text(source);
    if (translated !== source) result.push(translated);
    else result.push(...parts.map(part => typeof part === 'string' ? text(part) : part));
    parts = [];
  };
  React.Children.forEach(children, child => {
    if (typeof child === 'string' || typeof child === 'number') parts.push(child);
    else { flush(); result.push(child); }
  });
  flush();
  return result;
}
/** Presentation-only adapters. They keep native elements and refs stable when language changes.
 * Mark user-authored text and subject-matter symbols verbatim; never translate input values.
 */
export const Text = forwardRef<NativeText, TextProps & { verbatim?: boolean }>(function LocalizedText({ children, verbatim, accessibilityLabel, ...props }, ref) {
  const { text } = useLocalization();
  return <NativeText {...props} ref={ref} accessibilityLabel={accessibilityLabel && text(accessibilityLabel)}>{verbatim ? children : localizedChildren(children, text)}</NativeText>;
});
export const Pressable = forwardRef<View, PressableProps & { verbatim?: boolean }>(function LocalizedPressable({ accessibilityLabel, accessibilityHint, verbatim, ...props }, ref) {
  const { text } = useLocalization();
  return <NativePressable {...props} ref={ref} accessibilityLabel={verbatim ? accessibilityLabel : accessibilityLabel && text(accessibilityLabel)} accessibilityHint={accessibilityHint && text(accessibilityHint)} />;
});
export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function LocalizedTextInput({ placeholder, accessibilityLabel, accessibilityHint, ...props }, ref) {
  const { text } = useLocalization();
  return <NativeTextInput {...props} ref={ref} placeholder={placeholder && text(placeholder)} accessibilityLabel={accessibilityLabel && text(accessibilityLabel)} accessibilityHint={accessibilityHint && text(accessibilityHint)} />;
});

export const AccessibilityView = forwardRef<View, ViewProps>(function AccessibilityView({ accessibilityLabel, accessibilityHint, ...props }, ref) {
  const { text } = useLocalization();
  return <NativeView {...props} ref={ref} accessibilityLabel={accessibilityLabel && text(accessibilityLabel)} accessibilityHint={accessibilityHint && text(accessibilityHint)} />;
});

export const Image = forwardRef<NativeImage, ImageProps>(function LocalizedImage({ accessibilityLabel, accessibilityHint, ...props }, ref) {
  const { text } = useLocalization();
  return <NativeImage {...props} ref={ref} accessibilityLabel={accessibilityLabel && text(accessibilityLabel)} accessibilityHint={accessibilityHint && text(accessibilityHint)} />;
});
