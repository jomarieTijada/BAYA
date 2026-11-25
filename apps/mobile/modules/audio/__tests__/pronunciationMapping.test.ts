import { resolvePronunciation, characterPronunciation, combinedRecordingReview } from '../pronunciationMapping';
import { traditionalGroupForSyllable, traditionalGroupForClass } from '../../../content/traditionalCharacters';

it('shares traditional D/R glyph groups without merging modern model classes', () => {
  expect(traditionalGroupForSyllable('DE')).toBe(traditionalGroupForSyllable('RE'));
  expect(traditionalGroupForSyllable('DO')).toBe(traditionalGroupForSyllable('RU'));
  expect(traditionalGroupForClass('re_ri')).toBeUndefined();
  expect(traditionalGroupForClass('de_di')?.label).toBe('DE/DI/RE/RI');
});
it('does not mislabel a combined clip as a specific syllable', () => {
  expect(resolvePronunciation('da').entry).toBeUndefined();
  expect(resolvePronunciation('da', true).mode).toBe('combined');
  expect(resolvePronunciation('ra', true).entry?.id).toBe('baya-a-dara');
  expect(characterPronunciation('da_ra')?.id).toBe('baya-a-dara');
});
it('keeps existing separate vowel pronunciations distinct', () => {
  expect(resolvePronunciation('be').entry?.id).not.toBe(resolvePronunciation('bi').entry?.id);
  expect(resolvePronunciation('bo').entry?.id).not.toBe(resolvePronunciation('bu').entry?.id);
});
it('inventories all five combined clips and withholds unverified substitutions', () => {
  expect(combinedRecordingReview).toHaveLength(5);
  for (const sound of ['do','ro','du','ru']) {
    expect(resolvePronunciation(sound, true).entry).toBeUndefined();
    expect(resolvePronunciation(sound, true).candidate?.status).toBe('needs-listening-validation');
  }
});

it('uses validated upper D/R clips with accurate combined labels',()=>{
 for(const sound of ['de','re'])expect(resolvePronunciation(sound,true).entry?.label).toBe('De / Re');
 for(const sound of ['di','ri'])expect(resolvePronunciation(sound,true).entry?.label).toBe('Di / Ri');
 expect(resolvePronunciation('de').entry).toBeUndefined();
});
