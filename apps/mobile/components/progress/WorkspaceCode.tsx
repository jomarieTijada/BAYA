import React, { useState } from 'react';
import { Platform, Pressable, Share, Text, View } from 'react-native';
import { AppIcon } from '../ui/AppIcon';
import { Colors } from '../../constants/theme';
import { p } from './ProgressPage';

export function WorkspaceCode({ code }: { code: string }) {
  const [message, setMessage] = useState('');
  return <View style={{ maxWidth: '100%' }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Copy workspace code" onPress={() => {
      void (async () => {
        try {
          if (Platform.OS === 'web' && globalThis.navigator?.clipboard) {
            await navigator.clipboard.writeText(code); setMessage('Code copied.');
          } else if (Platform.OS !== 'web') await Share.share({ message: code });
          else setMessage('Select the code to copy it.');
        } catch { setMessage('Select the code to copy it.'); }
      })();
    }} style={[p.row, { borderWidth: 1.5, borderColor: Colors.accent, backgroundColor: Colors.background, padding: 14, borderRadius: 12, gap: 10 }]}>
      <Text selectable style={[p.text, { fontWeight: '700' }]}>ID: {code}</Text><AppIcon name="copy" color="accent" size={22} />
    </Pressable>
    {!!message && <Text accessibilityLiveRegion="polite" style={[p.text, { fontSize: 14 }]}>{message}</Text>}
  </View>;
}
