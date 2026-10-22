export function syncTime(value: string | null | undefined, now = new Date()): string {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Not synchronized yet';
  const date = new Date(value);
  const elapsed = now.getTime() - date.getTime();
  if (elapsed >= 0 && elapsed < 60000) return 'Just now';
  if (date.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString();
}
export function isSyncedToday(value: string | null, now = new Date()) {
  return !!value && new Date(value).toDateString() === now.toDateString();
}
