import { educationalMessages } from './education';
import { messages } from './messages';
import { en, type MessageKey } from './en';
import { tl } from './tl';
export type Language = 'en' | 'tl';
export const DEFAULT_LANGUAGE: Language = 'en';
export const languageNames: Record<Language, string> = { en: 'English', tl: 'Tagalog' };
export const localeFor = (language: Language) => language === 'tl' ? 'fil-PH' : 'en-PH';
export const isLanguage = (value: unknown): value is Language => value === 'en' || value === 'tl';
export type Variables = Readonly<Record<string, string | number>>;
const resources = { en, tl };
const education = new Map<string, { en: string; tl: string }>(educationalMessages.map(message => [message.source, message]));
const uppercaseSources = new Map([...Object.keys(en), ...educationalMessages.map(message => message.source)].map(key => [key.toLocaleUpperCase(), key]));
const templates = messages.map(message => {
  const names: string[] = [];
  const parts = message.source.trim().split(/(\{\w+\})/g).map(part => {
    if (/^\{\w+\}$/.test(part)) { names.push(part.slice(1, -1)); return '(.*?)'; }
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  });
  return { message, names, pattern: new RegExp('^' + parts.join('') + '$', 's') };
});
/** Typed lookup for new UI. */
export function translate(language: Language, key: MessageKey, values: Variables = {}): string {
  const message = resources[language][key] ?? en[key];
  if (typeof message !== 'string') return language === 'tl' ? 'Hindi available ang teksto.' : 'Text unavailable.';
  return interpolate(message, values);
}
export function interpolate(message: string, values: Variables): string {
  return message.replace(/\{(\w+)\}/g, (_match, name: string) => String(values[name] ?? ''));
}
/** Compatibility boundary for existing application-owned presentation strings.
 * Never call this on names, workspace codes, answers, glyphs, or other user data.
 * Unknown source text falls back unchanged, never to a raw key.
 */
export function translateText(language: Language, source: string): string {
  const normalized = source.replace(/\s+/g, ' ').trim();
  const lesson = education.get(normalized);
  if (lesson) return lesson[language];
  if (!Object.prototype.hasOwnProperty.call(en, normalized)) {
    for (const { message, names, pattern } of templates) {
      const match = pattern.exec(source.trim());
      if (match) return interpolate(message[language], Object.fromEntries(names.map((name, index) => [name, match[index + 1]])));
    }
    const canonical = uppercaseSources.get(normalized);
    if (canonical && canonical !== normalized) return translateText(language, canonical).toLocaleUpperCase(localeFor(language));
    return source;
  }
  const translated = resources[language][normalized as MessageKey];
  return (source.match(/^\s*/)?.[0] ?? '') + translated + (source.match(/\s*$/)?.[0] ?? '');
}
export function formatNumber(language: Language, value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(localeFor(language), options).format(value);
}
export function formatDate(language: Language, value: Date | string, options?: Intl.DateTimeFormatOptions) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(localeFor(language), options).format(date) : '';
}
export function learnerCount(language: Language, count: number) {
  const number = formatNumber(language, count);
  return language === 'tl' ? `${number} mag-aaral` : `${number} ${count === 1 ? 'learner' : 'learners'}`;
}
