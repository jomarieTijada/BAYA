import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, Shadows } from '../../constants/theme';
import { BackButton } from '../ui/BackButton';
import { BaseCard } from '../ui/cards/BaseCard';
export function FeatureScreen({
  title,
  subtitle,
  onBack,
  children,
  wide = false,
  card = true,
  icon,
  footer,
}: React.PropsWithChildren<{
  title: string;
  subtitle: string;
  onBack: () => void;
  wide?: boolean;
  card?: boolean;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}>) {
  const { width, height } = useWindowDimensions();
  const compact = height < 500;
  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        style={s.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            s.scroll,
            (width < 800 || compact) && { padding: 16 },
          ]}
        >
          <View style={s.back}>
            <BackButton accessibilityLabel="Back" onPress={onBack} compact />
          </View>
          <View style={[s.body, { maxWidth: wide ? 1180 : 780 }]}>
            {card ? (
              <BaseCard
                style={[s.card, (width < 800 || compact) && { padding: 22 }]}
              >
                {icon && <View style={{ alignItems: 'center' }}>{icon}</View>}
                <Text accessibilityRole="header" style={s.title}>
                  {title}
                </Text>
                <Text style={s.subtitle}>{subtitle}</Text>
                {children}
              </BaseCard>
            ) : (
              <>
                <Text
                  accessibilityRole="header"
                  style={[s.title, { textAlign: 'left' }]}
                >
                  {title}
                </Text>
                <Text style={[s.subtitle, { textAlign: 'left' }]}>
                  {subtitle}
                </Text>
                {children}
              </>
            )}
            {footer}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Notice({
  text,
  busy = false,
}: {
  text: string;
  busy?: boolean;
}) {
  if (!busy && !text) return null;
  return (
    <View accessibilityLiveRegion="polite">
      {busy && (
        <ActivityIndicator
          accessibilityLabel="Loading"
          color={Colors.rolePrimary}
        />
      )}
      {!!text && (
        <Text accessibilityRole="alert" style={s.notice}>
          {text}
        </Text>
      )}
    </View>
  );
}
export function TextAction({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={s.link}
    >
      <Text
        style={{
          color: disabled ? Colors.textMuted : Colors.rolePrimary,
          fontSize: 17,
          fontFamily: FontFamily.body,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: 32, paddingTop: 24 },
  back: { alignSelf: 'flex-start', marginBottom: 12 },
  body: {
    width: '100%',
    alignSelf: 'center',
    marginVertical: 'auto',
    paddingBottom: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 36,
    padding: 40,
    gap: 22,
    ...Shadows.card,
  },
  title: {
    fontFamily: FontFamily.rounded,
    fontWeight: '900',
    fontSize: 32,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: 19,
    lineHeight: 28,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  notice: {
    fontFamily: FontFamily.body,
    color: Colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginVertical: 10,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  field: { flex: 1, minWidth: 240 },
  link: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 8,
  },
  action: { maxWidth: 550, alignSelf: 'center', marginTop: 10 },
});
