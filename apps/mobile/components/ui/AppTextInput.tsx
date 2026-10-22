import React, { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { Colors, FontFamily, Radius, Spacing } from '../../constants/theme';

type AppTextInputProps = Omit<TextInputProps, 'style'> & {
  density?: AppControlDensity | 'form';
  error?: string;
  helperText?: string;
  label: string;
  trailing?: React.ReactNode;
  labelAction?: React.ReactNode;
  optional?: boolean;
  required?: boolean;
};

export type AppControlDensity =
  | 'regular'
  | 'mobile'
  | 'compact'
  | 'landscapeCompact';

/** Labelled input with reusable required, optional, helper, focus, and error states. */
export const AppTextInput = forwardRef<TextInput, AppTextInputProps>(
  function AppTextInput(
    {
      accessibilityHint,
      accessibilityLabel,
      density = 'regular',
      error,
      helperText,
      label,
      onBlur,
      onFocus,
      trailing,
      labelAction,
      optional = false,
      placeholderTextColor = Colors.placeholder,
      required = false,
      ...inputProps
    },
    ref,
  ) {
    const [focused, setFocused] = useState(false);
    const accessibleLabel =
      accessibilityLabel ??
      `${label}${required ? ', required' : optional ? ', optional' : ''}`;
    const isLandscape = density === 'landscapeCompact';
    const isCompact = density === 'compact' || isLandscape;
    const hasSupport = Boolean(error || helperText);

    return (
      <View style={styles.container}>
        <View
          style={[
            styles.labelRow,
            density === 'mobile' && styles.labelRowMobile,
            density === 'compact' && styles.labelRowCompact,
            isLandscape && styles.labelRowLandscapeCompact,
          ]}
        >
          <Text
            style={[
              styles.label,
              density === 'mobile' && styles.labelMobile,
              density === 'compact' && styles.labelCompact,
              isLandscape && styles.labelLandscapeCompact,
            ]}
          >
            {label}
            {required ? <Text style={styles.required}>*</Text> : null}
          </Text>
          {labelAction}
          {optional ? (
            <Text
              style={[
                styles.optionalBadge,
                density === 'mobile' && styles.optionalBadgeMobile,
                density === 'compact' && styles.optionalBadgeCompact,
                isLandscape && styles.optionalBadgeLandscapeCompact,
              ]}
            >
              OPTIONAL
            </Text>
          ) : null}
        </View>

        <View style={{ position: 'relative' }}>
          <TextInput
            ref={ref}
            {...inputProps}
            accessibilityHint={accessibilityHint}
            accessibilityLabel={accessibleLabel}
            accessibilityState={{
              disabled: Boolean(inputProps.editable === false),
            }}
            autoCapitalize={inputProps.autoCapitalize ?? 'none'}
            autoCorrect={inputProps.autoCorrect ?? false}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            placeholderTextColor={placeholderTextColor}
            style={[
              styles.input,
              density === 'form' && { borderRadius: 24 },
              trailing ? { paddingRight: 64 } : undefined,
              density === 'mobile' && styles.inputMobile,
              density === 'compact' && styles.inputCompact,
              isLandscape && styles.inputLandscapeCompact,
              error && styles.inputError,
              focused && styles.inputFocused,
            ]}
          />

          {trailing ? (
            <View style={{ position: 'absolute', right: 8, top: 8 }}>
              {trailing}
            </View>
          ) : null}
        </View>
        {hasSupport ? (
          <View
            style={[
              styles.supportArea,
              density === 'mobile' && styles.supportAreaMobile,
              density === 'compact' && styles.supportAreaCompact,
              isLandscape && styles.supportAreaLandscapeCompact,
            ]}
          >
            {error ? (
              <Text
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                style={[
                  styles.error,
                  density !== 'regular' && styles.supportTextMobile,
                  isCompact && styles.supportTextCompact,
                  isLandscape && styles.supportTextLandscapeCompact,
                ]}
              >
                {error}
              </Text>
            ) : (
              <Text
                style={[
                  styles.helper,
                  density !== 'regular' && styles.supportTextMobile,
                  isCompact && styles.supportTextCompact,
                  isLandscape && styles.supportTextLandscapeCompact,
                ]}
              >
                {helperText}
              </Text>
            )}
          </View>
        ) : density === 'regular' || density === 'mobile' ? (
          <View
            style={[
              styles.supportArea,
              density === 'mobile' && styles.supportAreaMobile,
            ]}
          >
            <Text aria-hidden style={styles.helper}>
              {' '}
            </Text>
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    minHeight: 32,
  },
  labelRowMobile: {
    marginBottom: 6,
    minHeight: 26,
  },
  labelRowCompact: {
    marginBottom: 4,
    minHeight: 24,
  },
  labelRowLandscapeCompact: {
    marginBottom: 2,
    minHeight: 18,
  },
  label: {
    color: Colors.textPrimary,
    flexShrink: 1,
    fontFamily: FontFamily.rounded,
    fontSize: 20,
    fontWeight: '800',
  },
  labelMobile: {
    fontSize: 17,
  },
  labelCompact: {
    fontSize: 16,
  },
  labelLandscapeCompact: {
    fontSize: 14,
    lineHeight: 16,
  },
  required: {
    color: Colors.rolePrimary,
  },
  optionalBadgeMobile: {
    fontSize: 12,
    marginLeft: Spacing.sm,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  optionalBadgeCompact: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  optionalBadgeLandscapeCompact: {
    fontSize: 10,
    marginLeft: Spacing.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  optionalBadge: {
    backgroundColor: Colors.optionalBackground,
    borderRadius: Radius.sm,
    color: Colors.textMuted,
    fontFamily: FontFamily.rounded,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: Spacing.md,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  inputMobile: {
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  inputCompact: {
    borderRadius: Radius.sm,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  inputLandscapeCompact: {
    borderRadius: Radius.sm,
    fontSize: 15,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.md,
    borderWidth: 2,
    color: Colors.textPrimary,
    fontFamily: FontFamily.body,
    fontSize: 19,
    minHeight: 68,
    outlineColor: 'transparent',
    paddingHorizontal: 22,
    paddingVertical: 15,
  },
  supportAreaMobile: {
    minHeight: 31,
    paddingTop: 5,
  },
  supportAreaCompact: {
    minHeight: 27,
    paddingTop: 4,
  },
  supportAreaLandscapeCompact: {
    minHeight: 0,
    paddingTop: 2,
  },
  inputFocused: {
    borderColor: Colors.rolePrimary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: Colors.error,
  },
  supportArea: {
    justifyContent: 'flex-start',
    minHeight: 38,
    paddingTop: 7,
  },
  helper: {
    color: Colors.textMuted,
    fontFamily: FontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  error: {
    color: Colors.error,
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  supportTextMobile: {
    fontSize: 14,
    lineHeight: 19,
  },
  supportTextCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  supportTextLandscapeCompact: {
    fontSize: 12,
    lineHeight: 15,
  },
});
