import React, { useState } from 'react';
import { PronunciationButton } from '../../modules/audio/PronunciationButton';
import { Image, type ImageSourcePropType, type ImageStyle, type TextStyle, type ViewStyle, Linking, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, FontFamily } from '../../constants/theme';
import { baybayinAssets } from '../../content/baybayinAssets';
import type { Language } from '../../localization/core';
import { BayaMascot } from '../branding/BayaMascot';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { bayaniPhoto, acknowledgementArtwork, miniGavinoPhoto } from './originStoryContent';
import { type OriginPage, storybookCopy } from './storybookContent';

export function StorySourceLink({ url, label, language }: { url: string; label: string; language: Language }) {
  const styles = useVisualStyles();
  const [failed, setFailed] = useState(false);
  const [focused, setFocused] = useState(false);
  const copy = storybookCopy[language];
  return <View style={styles.linkGroup}>
    <Pressable accessibilityRole="link" accessibilityLabel={label}
      {...(Platform.OS === 'web' ? { href: url, hrefAttrs: { target: '_blank', rel: 'noopener noreferrer' } } : {})}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      onPress={Platform.OS === 'web' ? undefined : () => { setFailed(false); void Linking.openURL(url).catch(() => setFailed(true)); }}
      style={[styles.link, focused && { borderColor: Colors.focus }]}>
      <Text style={styles.linkText}>{label} ↗</Text>
    </Pressable>
    {failed && <Text accessibilityRole="alert" style={styles.small}>{copy.linkError}</Text>}
  </View>;
}

function LocalPicture({ source, label, error, ratio, prominent = false }: { source: ImageSourcePropType; label: string; error: string; ratio?: number; prominent?: boolean }) {
  const styles = useVisualStyles();
  const [failed, setFailed] = useState(false);
  return <View style={ratio ? [prominent ? baseStyles.photo : styles.photo, { aspectRatio: ratio }] : styles.picture}>
    {failed ? <Text accessibilityRole="alert" style={styles.small}>{error} {label}</Text> :
      <Image source={source} accessibilityLabel={label} resizeMode="contain" onError={() => setFailed(true)} style={styles.image} />}
  </View>;
}

const syllables = [
  { label: 'Ba', mark: null },
  { label: 'Be / Bi', mark: 'above' },
  { label: 'Bo / Bu', mark: 'below' },
] as const;
const activities = [
  { glyph: 'a', icon: 'search-outline' }, { glyph: 'ba', icon: 'volume-medium-outline' },
  { glyph: 'ka', icon: 'pencil-outline' }, { glyph: 'ma', icon: 'leaf-outline' },
] as const;

/** Shared visual renderer: local assets only; source links never fetch remote imagery. */
export function StorybookVisual({ page, language, mascotSize, turning = false, detailIndex }: { page: OriginPage; language: Language; mascotSize: number; turning?: boolean; detailIndex?: number }) {
  const styles = useVisualStyles();
  const copy = storybookCopy[language];
  const reduced = useReducedMotionPreference();
  const [failedGlyph, setFailedGlyph] = useState<string>();
  return <>
    {page.visual === 'mascot' && <BayaMascot size={mascotSize} state={reduced ? "idle" : "greeting"} autoplay={!reduced && !turning} loop={false} accessibilityLabel={copy.mascotAlt} />}
    {page.visual === 'eagle' && <View style={styles.eagle}>
      <LocalPicture source={bayaniPhoto.localAsset} label={copy.photoAlt} error={copy.imageError} ratio={1024 / 614} prominent />
      <Text style={styles.photoCaption}>{page.caption}</Text>
      <Text style={styles.photoCaption}>{bayaniPhoto.publisher}</Text>
      <StorySourceLink url={bayaniPhoto.sourceUrl} label={copy.viewEagle} language={language} />
    </View>}
    {page.visual === 'learning' && <View style={styles.activities}>
      {activities.map((activity, index) => (detailIndex === undefined || index === detailIndex || (detailIndex === 2 && index === 3)) && <View key={activity.glyph} style={[styles.activity, detailIndex !== undefined && { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }]}>
        <Ionicons name={activity.icon} size={23} color={Colors.accent} accessible={false} />
        <LocalPicture source={baybayinAssets[activity.glyph]} label={`Baybayin ${activity.glyph}`} error={copy.imageError} />
        <Text style={styles.label}>{copy.learningSteps[index]}</Text>
        <Text style={styles.small}>{copy.learningHints[index]}</Text>
      </View>)}
    </View>}
    {page.visual === 'characters' && <View style={styles.syllables}>
      {syllables.map((item, index) => (detailIndex === undefined || detailIndex === index) && <View key={item.label} style={styles.syllable}>
        <View style={styles.characterGlyph} accessible accessibilityRole="image" accessibilityLabel={`${item.label}: ${index === 0 ? 'No kudlit' : index === 1 ? 'Kudlit above' : 'Kudlit below'}`} {...{ onError: () => setFailedGlyph(item.label) }}>
          {failedGlyph === item.label ? <Text accessibilityRole="alert">{copy.imageError} {item.label}: {index === 0 ? 'No kudlit' : index === 1 ? 'Kudlit above' : 'Kudlit below'}</Text> : <Image source={baybayinAssets.ba} resizeMode="contain" style={styles.image} accessible={false} onError={() => setFailedGlyph(item.label)} />}
          {item.mark && <View style={[styles.kudlit, item.mark === 'above' ? styles.kudlitAbove : styles.kudlitBelow]} />}
        </View>
        <View style={styles.syllableText}><Text style={styles.label}>{item.label}</Text></View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {(index === 0 ? [['baya-a-ba', 'Ba']] : index === 1 ? [['baya-e-be', 'Be'], ['baya-i-bi', 'Bi']] : [['baya-o-bo', 'Bo'], ['baya-u-bu', 'Bu']]).map(([id, label]) => <PronunciationButton key={id} audioId={id} label={label} language={language} />)}
        </View>
      </View>)}
    </View>}
    {page.visual === 'gratitude' && <View style={styles.acknowledgements}><View style={styles.artworks}>
      {acknowledgementArtwork.map((art, index) => (detailIndex === undefined || detailIndex === index) && <View key={art.name} style={styles.artworkCard}>
        <LocalPicture source={art.source} label={copy.artworkAlts[index]} error={copy.imageError} ratio={1} />
        <StorySourceLink url={art.url} label={art.name} language={language} />
        <Text style={styles.small}>{index === 0 ? copy.educationalMaterials : copy.artwork}</Text>
      </View>)}
    </View>
      {(detailIndex === undefined || detailIndex === 2) && <View style={[styles.specialThanks, detailIndex !== undefined && { flexDirection: 'column' }] }>
        <View style={styles.portrait}><LocalPicture source={miniGavinoPhoto} label={copy.portraitAlt} error={copy.imageError} ratio={1} /></View>
        <View style={[styles.thanksText, detailIndex !== undefined && { flexBasis: 'auto', width: '100%' }] }>
          <Text style={styles.thanksTitle}>{copy.thanks}</Text>
          <Text style={styles.thanksName}>Ma&apos;am Mini Gavino</Text>
          <Text style={styles.thanksBody}>{copy.support}</Text>
        </View>
      </View>}
    </View>}
    {!!page.caption && page.visual !== 'eagle' && page.visual !== 'mascot' && <Text style={styles.caption}>{page.caption}</Text>}
    {page.visual === 'learning' && <Text style={styles.small}>{copy.glyphCredit}</Text>}
    {page.source && <StorySourceLink url={page.source.url} label={`${copy.source}: ${page.source.name}`} language={language} />}
  </>;
}

const baseStyles = StyleSheet.create({
  photoCaption: { fontFamily: FontFamily.body, fontSize: 11, lineHeight: 14, textAlign: 'center', color: Colors.textSecondary },
  characterGlyph: { width: 72, height: 72, position: 'relative' },
  kudlit: { position: 'absolute', width: '10%', height: '10%', borderRadius: 20, backgroundColor: '#242220', left: '45%' },
  kudlitAbove: { top: '5%' },
  kudlitBelow: { bottom: '5%' },
  caption: { fontFamily: FontFamily.body, fontSize: 14, lineHeight: 21, textAlign: 'center', color: Colors.textSecondary, maxWidth: 360 },
  small: { fontFamily: FontFamily.body, fontSize: 13, lineHeight: 20, textAlign: 'center', color: Colors.textSecondary },
  heroText: { fontFamily: FontFamily.rounded, fontSize: 28, lineHeight: 35, fontWeight: '800', textAlign: 'center', color: Colors.textPrimary },
  label: { fontFamily: FontFamily.rounded, fontSize: 19, lineHeight: 26, fontWeight: '700', textAlign: 'center', color: Colors.textPrimary },
  eagle: { width: '100%', padding: 8, borderRadius: 22, borderWidth: 1, borderColor: '#DFCEAE', backgroundColor: '#F5EDD9', alignItems: 'center', gap: 16 },
  photo: { width: '100%', aspectRatio: 4 / 3 },
  image: { width: '100%', height: '100%' },
  picture: { width: 96, height: 96, justifyContent: 'center' },
  linkGroup: { alignItems: 'center', gap: 4, maxWidth: '100%' },
  link: { minHeight: 48, justifyContent: 'center', padding: 10, borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  linkText: { fontFamily: FontFamily.body, fontSize: 15, lineHeight: 22, fontWeight: '700', color: Colors.accent, textAlign: 'center', textDecorationLine: 'underline' },
  activities: { width: '100%', maxWidth: 420, flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  activity: { width: '46%', borderRadius: 18, padding: 12, backgroundColor: '#F5EDD9', alignItems: 'center', gap: 6 },
  syllables: { width: '100%', maxWidth: 360, gap: 12 },
  syllable: { padding: 12, borderRadius: 16, backgroundColor: '#F5EDD9', flexDirection: 'row', alignItems: 'center', gap: 12 },
  syllableText: { flex: 1, gap: 6 },
  artworks: { width: '100%', maxWidth: 600, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  acknowledgements: { width: '100%', gap: 18 },
  specialThanks: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 12, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  portrait: { width: 128 },
  thanksText: { flexGrow: 1, flexBasis: 180, gap: 7 },
  thanksTitle: { fontFamily: FontFamily.body, fontSize: 14, fontWeight: '700', color: Colors.accent },
  thanksName: { fontFamily: FontFamily.rounded, fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  thanksBody: { fontFamily: FontFamily.body, fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
  artworkCard: { flexBasis: 190, flexGrow: 1, maxWidth: 280, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: '#DFCEAE', backgroundColor: '#FFFFFF', alignItems: 'center', gap: 10 },
  thankYou: { width: '100%', maxWidth: 380, borderRadius: 24, borderWidth: 1, borderColor: '#DFCEAE', backgroundColor: '#F5EDD9', padding: 28, alignItems: 'center', gap: 20 },
  rule: { height: 1, width: '65%', backgroundColor: '#DFCEAE' },
});

// Keep artwork within the same short landscape spread as its story text.
function useVisualStyles(): Record<keyof typeof baseStyles, ViewStyle & TextStyle & ImageStyle> {
  const { height } = useWindowDimensions();
  if (height >= 500) return baseStyles;
  return {
    ...baseStyles,
    photoCaption: { ...baseStyles.photoCaption, fontSize: 9, lineHeight: 12 },
    characterGlyph: { ...baseStyles.characterGlyph, width: 48, height: 48 },
    caption: { ...baseStyles.caption, fontSize: 11, lineHeight: 14 },
    small: { ...baseStyles.small, fontSize: 10, lineHeight: 13 },
    label: { ...baseStyles.label, fontSize: 13, lineHeight: 17 },
    eagle: { ...baseStyles.eagle, padding: 6, gap: 4 },
    photo: { ...baseStyles.photo, maxHeight: Math.max(64, height * .28) },
    picture: { ...baseStyles.picture, width: 40, height: 40 },
    link: { ...baseStyles.link, minHeight: 30, padding: 3 },
    linkText: { ...baseStyles.linkText, fontSize: 11, lineHeight: 14 },
    activities: { ...baseStyles.activities, gap: 6 },
    activity: { ...baseStyles.activity, padding: 5, gap: 2, borderRadius: 10 },
    syllables: { ...baseStyles.syllables, gap: 5 },
    syllable: { ...baseStyles.syllable, padding: 5, gap: 4, flexWrap: 'wrap' },
    syllableText: { ...baseStyles.syllableText, gap: 2 },
    artworks: { ...baseStyles.artworks, flexWrap: 'nowrap', gap: 5 },
    artworkCard: { ...baseStyles.artworkCard, flexBasis: 0, minWidth: 0, padding: 4, gap: 2 },
    acknowledgements: { ...baseStyles.acknowledgements, gap: 6 },
    specialThanks: { ...baseStyles.specialThanks, flexWrap: 'nowrap', padding: 5, gap: 6 },
    portrait: { width: 40 },
    thanksText: { ...baseStyles.thanksText, flexBasis: 0, gap: 2 },
    thanksTitle: { ...baseStyles.thanksTitle, fontSize: 10 },
    thanksName: { ...baseStyles.thanksName, fontSize: 12 },
    thanksBody: { ...baseStyles.thanksBody, fontSize: 10, lineHeight: 13 },
  };
}
