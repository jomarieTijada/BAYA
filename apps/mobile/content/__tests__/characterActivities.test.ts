import fs from 'node:fs';
import path from 'node:path';
import { characterActivities, validateCharacterContent, glyphClass, glyphAsset, questionRecording } from '../characterActivities';
import { evaluateAnswer } from '../../modules/characterActivities/assessment';
import { writingClassId } from '../writingMastery';

const extraction = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../docs/activities/source-extraction.json'), 'utf8'));
const tables = extraction.blocks.filter((b: {kind: string}) => b.kind === 'table');
describe('DOCX Character Level content', () => {
  it('resolves all published recordings including the approved combined DE/RE clip', () => expect(validateCharacterContent()).toEqual([]));
  for (const [ai, activity] of characterActivities.entries()) for (const [si, set] of activity.sets.entries()) for (const [qi, q] of set.questions.entries()) {
    it(`${q.id} exactly matches the source table and answer key`, () => {
      const rows = tables[ai * 5 + si].rows.filter((r: {text: string}[]) => /^\d+$/.test(r[0].text.trim()));
      const row = rows[qi];
      expect(q.number).toBe(Number(row[0].text)); expect(q.prompt).toBe(row[1].text);
      if (q.type === 'multiple-choice') {
        expect(q.options.map(o => o.label)).toEqual(row.slice(2, 5).map((c: {text: string}) => c.text));
        expect(q.correctLetter).toBe(row[5].text[0]);
        for (const option of q.options) expect(evaluateAnswer(q, { kind: 'choice', optionId: option.id, audioPlayed: true })).toBe(option.letter === q.correctLetter);
        if (ai === 0) {
          if (['DE', 'RE'].includes(q.prompt)) expect(questionRecording(q)?.id).toBe('baya-e-dere');
          else expect(questionRecording(q)?.label.toUpperCase()).toBe(q.prompt);
        }
      } else {
        const runs = row[1].paragraphs.flatMap((p: {runs: unknown[]}) => p.runs);
        expect(q.target).toBe(runs.filter((r: {underline: boolean}) => r.underline).map((r: {text: string}) => r.text).join(''));
        expect(q.target).toBe(row[2].text); expect(q.expectedGlyph).toBe(row[3].text);
        expect(q.prefix + q.target + q.suffix).toBe(q.prompt);
        const label = glyphClass(q.expectedGlyph);
        expect(evaluateAnswer(q, { kind: 'writing', prediction: { label, classIndex: writingClassId(label), probability: .95 } })).toBe(true);
        expect(glyphAsset(q.expectedGlyph)).toBeDefined();
      }
    });
  }
  it('does not replace traditional DA/RA with modern RA', () => expect(glyphClass('ᜇᜒ')).toBe('de_di'));
  it('blocks listening scoring until playback and rejects invalid options', () => {
    const q = characterActivities[0].sets[0].questions[0];
    expect(() => evaluateAnswer(q, {kind: 'choice', optionId: `${q.id}-B`})).toThrow();
    expect(() => evaluateAnswer(q, {kind: 'choice', optionId: 'missing', audioPlayed: true})).toThrow();
  });
  it('does not score uncertain or mismatched recognition as a correct answer', () => {
    const q = characterActivities[3].sets[0].questions[0];
    expect(() => evaluateAnswer(q, {kind: 'writing', prediction: {label:'ga',classIndex:writingClassId('ga'),probability:.79}})).toThrow();
    expect(evaluateAnswer(q, {kind: 'writing', prediction: {label:'ba',classIndex:writingClassId('ba'),probability:.99}})).toBe(false);
  });
});
