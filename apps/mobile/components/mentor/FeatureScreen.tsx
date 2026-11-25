import { Pressable, Text } from '../../localization/components';
import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontFamily, Shadows } from '../../constants/theme';
import { PageHeader } from '../layout/PageHeader';
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
  dense = true,
  action,
}: React.PropsWithChildren<{
  title: string;
  subtitle: string;
  onBack?: () => void;
  wide?: boolean;
  card?: boolean;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  dense?: boolean;
  action?: React.ReactNode;
}>) {
  const { width, height } = useWindowDimensions();
  const compact = height < 500;
  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        style={s.screen}
        behavior={(() => {
          if (Platform.OS === 'ios') {
            return 'padding';
          } else {
            return undefined;
          }
        })()}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            s.scroll,
            card && { justifyContent: 'center' },
            (width < 800 || compact) && { padding: 10 },
          ]}
        >
          <View style={[s.body, { maxWidth: (() => {
            if (card) {
              return 420;
            } else if (wide) {
              return 1180;
            } else {
              return 900;
            }
          })() }]}>
            {(() => {
              if (card) {
                return (
              <BaseCard
                style={[s.card, (width < 800 || compact) && { padding: 10 }, dense && { gap: (() => {
                  if (compact) {
                    return 6;
                  } else {
                    return 8;
                  }
                })() }]}
              >
                {icon && <View style={{ alignItems: 'center' }}>{icon}</View>}
                <PageHeader title={title} subtitle={subtitle} onBack={onBack} compact={dense || compact} action={action} />
                {children}
              </BaseCard>
            );
              } else {
                return (
              <>
                <PageHeader title={title} subtitle={subtitle} onBack={onBack} compact action={action} />
                {children}
              </>
            );
              }
            })()}
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
  verbatim = false,
  onPress,
  disabled = false,
}: {
  label: string;
  verbatim?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      verbatim={verbatim}
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={s.link}
    >
      <Text verbatim={verbatim}
        style={{
          color: (() => {
            if (disabled) {
              return Colors.textMuted;
            } else {
              return Colors.rolePrimary;
            }
          })(),
          fontSize: 13,
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
  scroll: { flexGrow: 1, padding: 10, paddingTop: 10 },
  back: { alignSelf: 'flex-start', marginBottom: 12 },
  body: {
    width: '100%',
    alignSelf: 'center',
    marginVertical: 0,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 12,
    gap: 6,
    ...Shadows.card,
  },
  title: {
    fontFamily: FontFamily.rounded,
    fontWeight: '900',
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  notice: {
    fontFamily: FontFamily.body,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 2,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  field: { flex: 1, minWidth: 170 },
  link: {
    minHeight: 28,
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 8,
  },
  action: { maxWidth: 320, alignSelf: 'center', marginTop: 6 },
});
