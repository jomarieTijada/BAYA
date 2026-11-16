import { formatDate, translateText, type Language } from '../../localization/core';
export function syncTime(value: string | null | undefined, now = new Date(), language: Language = 'en'): string {
  if (!value || !Number.isFinite(Date.parse(value))) return translateText(language, 'Not synchronized yet');
  const date = new Date(value);
  const elapsed = now.getTime() - date.getTime();
  if (elapsed >= 0 && elapsed < 60000) return translateText(language, 'Just now');
  if (date.toDateString() === now.toDateString()) return translateText(language, 'Today');
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return translateText(language, 'Yesterday');
  return formatDate(language, date);
}
export function isSyncedToday(value: string | null, now = new Date()) {
  return !!value && new Date(value).toDateString() === now.toDateString();
}
