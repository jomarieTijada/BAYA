import React from 'react';
import { AppButton as SharedButton } from '../ui/AppButton';
export function AppButton(props: React.ComponentProps<typeof SharedButton>) {
  return <SharedButton {...props} compact density="compact" style={[props.style, { minHeight: 36, height: 36, paddingVertical: 4 }]} labelStyle={[props.labelStyle, { fontSize: 13 }]} />;
}
