import { en } from '../en';
import { tl } from '../tl';
import { educationalMessages } from '../education';
import { translate, formatDate, formatNumber, interpolate, isLanguage, learnerCount, translateText } from '../core';
import { messages } from '../messages';

describe('bundled localization', () => {
  it('has matching, nonempty English and Tagalog keys', () => {
    expect(Object.keys(tl).sort()).toEqual(Object.keys(en).sort());
    for (const value of Object.values(tl)) expect(value.trim().length).toBeGreaterThan(0);
  });
  it('normalizes display whitespace and falls back without exposing keys', () => {
    expect(translateText('tl', '  Settings  ')).toBe('  Mga Setting  ');
    expect(translateText('en', 'Suriin')).toBe('Check');
    expect(translateText('tl', 'An unknown source message')).toBe('An unknown source message');
    expect(translateText('en', 'ᜊ = Ba\nᜃ = Ka\nᜆ = Ta')).toBe('ᜊ = Ba\nᜃ = Ka\nᜆ = Ta');
  });
  it('interpolates values literally without translating user names', () => {
    expect(translateText('tl', 'Approve Settings')).toBe('Aprubahan si Settings');
    expect(translateText('tl', 'Approve Ana  Maria')).toBe('Aprubahan si Ana  Maria');
    expect(translate('tl', 'missing.key' as keyof typeof en)).toBe('Hindi available ang teksto.');
    expect(translateText('tl', 'Enter the verification code sent to a+b@example.com.')).toBe('Ilagay ang code ng pagpapatunay na ipinadala sa a+b@example.com.');
    expect(interpolate('Hello {name}', { name: '$& {another}' })).toBe('Hello $& {another}');
    expect(interpolate('Hello {missing}', {})).toBe('Hello ');
  });
  it('renders every catalogued dynamic message without raw placeholders', () => {
    for (const item of messages) {
      const source = item.source.replace(/\{\w+\}/g, '3');
      for (const language of ['en', 'tl'] as const) expect(translateText(language, source)).not.toMatch(/\{\w+\}/);
    }
  });
  it('formats counts and dates and validates language IDs', () => {
    expect(learnerCount('en', 1)).toBe('1 learner');
    expect(learnerCount('en', 2)).toBe('2 learners');
    expect(learnerCount('tl', 2)).toBe('2 mag-aaral');
    expect(formatNumber('en', 1234)).toBe('1,234');
    expect(formatDate('tl', 'invalid')).toBe('');
    expect(formatDate('en', '2026-11-06T00:00:00Z', { year: 'numeric', timeZone: 'UTC' })).toBe('2026');
    expect(isLanguage('fil')).toBe(false);
  });
  it('marks educational translations pending review and retains glyph sequences', () => {
    for (const item of educationalMessages) {
      expect(item.validation).toBe('pending-subject-matter-review');
      expect(item.en.match(/[\u1700-\u171f]/g)).toEqual(item.source.match(/[\u1700-\u171f]/g));
    }
  });
});
