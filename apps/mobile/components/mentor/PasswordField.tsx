import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { AppTextInput } from '../ui/AppTextInput';
import { AppIcon } from '../ui/AppIcon';
export function PasswordField({
  label,
  value,
  onChangeText,
  error,
  disabled,
  labelAction,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  disabled: boolean;
  labelAction?: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <AppTextInput
        density="form"
        labelAction={labelAction}
        label={label}
        required
        value={value}
        onChangeText={onChangeText}
        error={error}
        editable={!disabled}
        secureTextEntry={!visible}
        autoComplete={
          label === 'PASSWORD' ? 'current-password' : 'new-password'
        }
        placeholder="Enter your password"
        trailing={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            onPress={() => setVisible(!visible)}
            style={{
              minWidth: 52,
              minHeight: 48,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <AppIcon name={visible ? 'eyeOff' : 'eye'} color="muted" />
          </Pressable>
        }
      />
    </View>
  );
}
