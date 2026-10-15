import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LessonReference } from '../../../content/types';
import { FontFamily, Spacing } from '../../../constants/theme';

/** Short attribution stays visible; bibliographic details are available on demand. */
export function LessonSource({ reference }: { reference: LessonReference }) {
  const [expanded, setExpanded] = useState(false);
  return <View style={styles.source} testID="lesson-source">
    <Text style={styles.caption}>Sanggunian: {reference.abbreviation}</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)} style={styles.action}>
      <Text style={styles.link}>{expanded ? 'Itago ang Sanggunian' : 'Alamin ang Sanggunian'}</Text>
    </Pressable>
    {expanded ? <View style={styles.details} testID="lesson-source-details">
      <Text style={styles.detailText}>{reference.organization} ({reference.abbreviation})</Text>
      <Text style={styles.detailText}>{reference.title}</Text>
      <Text style={styles.detailText}>{reference.author}</Text>
      <Pressable accessibilityRole="link" accessibilityLabel={`Basahin ang ${reference.title} sa ${reference.abbreviation}`} onPress={() => {
        void Linking.openURL(reference.url).catch(() => Alert.alert('Hindi mabuksan ang sanggunian', 'Subukan muli kapag may koneksiyon sa internet.'));
      }} style={styles.action}>
        <Text style={styles.link}>Basahin sa {reference.abbreviation}</Text>
      </Pressable>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  source: { marginTop: Spacing.xs, alignItems: 'flex-start' },
  caption: { fontFamily: FontFamily.body, color: '#61564B', fontSize: 13, lineHeight: 19 },
  action: { minHeight: 44, justifyContent: 'center', paddingVertical: 6, maxWidth: '100%' },
  link: { fontFamily: FontFamily.body, color: '#8D3C13', fontSize: 14, lineHeight: 20, textDecorationLine: 'underline' },
  details: { gap: 3, width: '100%' },
  detailText: { fontFamily: FontFamily.body, color: '#61564B', fontSize: 13, lineHeight: 19 },
});
