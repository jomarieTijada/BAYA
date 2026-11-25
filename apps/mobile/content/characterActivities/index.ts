import source from './questions.json';
import { BAYA_CLASS_LABELS } from '../../ml/bayaClassLabels';
import { resolvePronunciation } from '../../modules/audio/pronunciationMapping';
import { traditionalGroupForGlyph } from '../traditionalCharacters';
import { getBaybayinTracingGuide } from '../baybayinTracingGuides';

export type OptionLetter = 'A' | 'B' | 'C';
type BaseQuestion = Readonly<{ id: string; number: number; setId: string; prompt: string }>;
export type ChoiceQuestion = BaseQuestion & Readonly<{
  type: 'multiple-choice'; options: readonly Readonly<{ id: string; letter: OptionLetter; label: string }>[];
  correctLetter: OptionLetter; sourceAnswer: string;
}>;
export type WritingQuestion = BaseQuestion & Readonly<{
  type: 'handwriting'; prefix: string; target: string; suffix: string; expectedGlyph: string;
}>;
export type CharacterQuestion = ChoiceQuestion | WritingQuestion;
export type CharacterSet = Readonly<{ id: string; number: number; title: string; questions: readonly CharacterQuestion[] }>;
export type CharacterActivity = Readonly<{ id: string; number: number; title: string; sourceInstruction: string; sets: readonly CharacterSet[] }>;
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
export const characterActivities = freeze(source as unknown as readonly CharacterActivity[]);
const bases: Record<string, string> = { 'ᜀ': 'a', 'ᜁ': 'e_i', 'ᜂ': 'o_u', 'ᜃ': 'ka', 'ᜄ': 'ga', 'ᜅ': 'nga', 'ᜆ': 'ta', 'ᜇ': 'da_ra', 'ᜈ': 'na', 'ᜉ': 'pa', 'ᜊ': 'ba', 'ᜋ': 'ma', 'ᜌ': 'ya', 'ᜎ': 'la', 'ᜏ': 'wa', 'ᜐ': 'sa', 'ᜑ': 'ha' };
/** Source uses traditional DA/RA. The separate modern RA model class is never substituted. */
export function glyphClass(glyph: string): string {
  const traditional = traditionalGroupForGlyph(glyph);
  if (traditional) return traditional.modelClass;
  const [base, mark, extra] = Array.from(glyph);
  const id = bases[base];
  if (!id || extra || (mark && !['ᜒ', 'ᜓ'].includes(mark))) throw new Error(`Unknown source glyph: ${glyph}`);
  if (!mark) return id;
  const stem = id.slice(0, -1);
  const result = mark === 'ᜒ' ? `${stem}e_${stem}i` : `${stem}o_${stem}u`;
  if (!BAYA_CLASS_LABELS.includes(result)) throw new Error(`Unknown model class: ${result}`);
  return result;
}
export const glyphAsset = (glyph: string) => getBaybayinTracingGuide(glyphClass(glyph));
// Shared-character listening questions may use an explicitly approved combined clip.
// The immutable document prompt remains available for provenance, never as a visible cue.
export const questionRecording = (q: CharacterQuestion) => resolvePronunciation(q.prompt, true).entry;
export function getCharacterSet(setId: string) {
  for (const activity of characterActivities) {
    const set = activity.sets.find(s => s.id === setId);
    if (set) return { activity, set };
  }
  throw new Error('Unknown Character Level set.');
}
export function validateCharacterContent(): string[] {
  const errors: string[] = [], ids = new Set<string>();
  if (characterActivities.length !== 4) errors.push('Expected four activities');
  for (const a of characterActivities) {
    if (a.sets.length !== 5) errors.push(`${a.id}: expected five sets`);
    a.sets.forEach((s, si) => {
      if (s.questions.length !== 5) errors.push(`${s.id}: expected five questions`);
      s.questions.forEach((q, qi) => {
        if (ids.has(q.id) || q.number !== si * 5 + qi + 1 || q.setId !== s.id) errors.push(`${q.id}: identity/order`);
        ids.add(q.id);
        try {
          if (q.type === 'handwriting') {
            if (!q.target || q.prefix + q.target + q.suffix !== q.prompt) errors.push(`${q.id}: underline`);
            glyphAsset(q.expectedGlyph);
          } else {
            if (q.options.length !== 3 || q.options.map(o => o.letter).join('') !== 'ABC' || !q.options.some(o => o.letter === q.correctLetter)) errors.push(`${q.id}: options/key`);
            if (a.number === 2) glyphAsset(q.prompt); else q.options.forEach(o => glyphAsset(o.label));
            if (a.number === 1 && !questionRecording(q)) errors.push(`${q.id}: missing recording`);
          }
        } catch (error) { errors.push(`${q.id}: ${String(error)}`); }
      });
    });
  }
  if (ids.size !== 100) errors.push('Expected 100 unique questions');
  return errors;
}
