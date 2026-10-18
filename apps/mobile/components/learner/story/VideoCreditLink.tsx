import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text } from 'react-native';
import { FontFamily } from '../../../constants/theme';
import type { VideoCredit } from '../../../content/types';

export function VideoCreditLink({ credit }: { credit: VideoCredit }) {
  return <Pressable
    accessibilityLabel={credit.label}
    accessibilityRole="link"
    accessibilityHint="Bubukas sa labas ng aralin. Kailangan ng internet."
    onPress={() => {
      void Linking.openURL(credit.url).catch(() => Alert.alert('Hindi mabuksan ang website', 'Subukan muli kapag may koneksiyon sa internet.'));
    }}
    style={styles.link}
    testID="video-credit-link"
  >
    <Text style={styles.text}>{credit.label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  link: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44, paddingVertical: 6, maxWidth: '100%' },
  text: { fontFamily: FontFamily.body, fontSize: 14, lineHeight: 20, color: '#8D3C13', textDecorationLine: 'underline' },
});
