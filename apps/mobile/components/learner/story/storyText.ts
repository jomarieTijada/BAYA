/** Translate a complete educational message before splitting its paragraphs.
 * Older resources that define individual paragraphs remain supported. */
export function storyParagraphs(source: string, translate: (value: string) => string): string[] {
  const translated = translate(source);
  const paragraphs = translated.split(/\n\s*\n/).map(value => value.trim()).filter(Boolean);
  return translated === source ? paragraphs.map(translate) : paragraphs;
}

/** Keep glyphs, accents and punctuation intact; ASCII \b cannot bound Baybayin. */
export function storyTextSegments(text: string, words: readonly string[]) {
  const terms = [...new Set(words.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!terms.length) return [{ text, highlighted: false }];
  const escaped = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(escaped.join('|'), 'giu');
  const segments: { text: string; highlighted: boolean }[] = [];
  const isWord = (character: string) => /[\p{L}\p{M}\p{N}]/u.test(character);
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index!;
    const end = start + match[0].length;
    const first = [...match[0]][0];
    const last = [...match[0]].at(-1)!;
    const before = [...text.slice(0, start)].at(-1) ?? '';
    const after = [...text.slice(end)][0] ?? '';
    if ((isWord(first) && isWord(before)) || (isWord(last) && isWord(after))) continue;
    if (start > cursor) segments.push({ text: text.slice(cursor, start), highlighted: false });
    segments.push({ text: match[0], highlighted: true });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlighted: false });
  return segments;
}
