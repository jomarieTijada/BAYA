import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { achievementIcons } from '../../../content/achievements/achievementIcons';
import { glyphAsset } from '../../../content/characterActivities';
import type { AchievementDefinition } from '../../../content/achievements/achievementTypes';

export function AchievementIconBadge({ definition, unlocked = false, compact=false }: { definition: AchievementDefinition; unlocked?: boolean; compact?:boolean }) {
  const icon = achievementIcons[definition.id], glyph = icon.glyph;
  return <View accessible={false} testID={`badge-${definition.id}`} style={[styles.badge, !unlocked && styles.locked, compact && {width:40,height:40}]}>
    <View style={compact?{transform:[{scale:0.65}]}:undefined}>{icon.feather ? <Svg width={44} height={44} viewBox="0 0 48 48"><Path d="M10 39 34 13M17 31C8 16 24 6 39 7C40 20 33 34 17 31ZM19 29 19 19M25 23 32 23" fill="none" stroke={unlocked ? '#B96300' : '#796B55'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />{icon.feather === 2 && <Path d="M22 39C36 39 43 29 43 18M28 38 38 29" stroke="#B96300" strokeWidth={2.5} fill="none" strokeLinecap="round" />}</Svg>
      : glyph ? <View style={styles.composition}><Image source={glyphAsset(glyph)} resizeMode="contain" style={styles.glyph} /><Ionicons name={definition.category === 'handwriting' ? 'pencil-outline' : 'search-outline'} size={18} color="#995000" style={styles.secondary} /></View>
      : <View style={styles.composition}><Ionicons name={icon.primaryIcon as keyof typeof Ionicons.glyphMap} size={38} color={unlocked ? '#B96300' : '#796B55'} />{icon.secondaryIcon && <Ionicons name={icon.secondaryIcon as keyof typeof Ionicons.glyphMap} size={16} color="#995000" style={styles.secondary} />}</View>}
  </View></View>;
}
const styles = StyleSheet.create({
  badge: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#F7CC59', backgroundColor: '#FFF0B9', alignItems: 'center', justifyContent: 'center' },
  locked: { backgroundColor: '#F4EFE3', borderColor: '#D9CEB8' },
  composition: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  glyph: { width: 36, height: 36 }, secondary: { position: 'absolute', right: -4, bottom: -4, backgroundColor: '#FFF0B9', borderRadius: 9 },
});
