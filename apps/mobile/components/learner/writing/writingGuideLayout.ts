export type GuideRect = { x: number; y: number; width: number; height: number };
export type GuideInsets = { top: number; right: number; bottom: number; left: number };

/** Prefer a safe corner that overlaps the highlighted target least. */
export function placeWritingGuide(width: number, height: number, cardWidth: number, cardHeight: number, insets: GuideInsets, target: GuideRect | null) {
  const left = insets.left + 12;
  const top = insets.top + 12;
  const right = Math.max(left, width - insets.right - cardWidth - 12);
  const bottom = Math.max(top, height - insets.bottom - cardHeight - 12);
  const positions = [{ x: right, y: top }, { x: left, y: top }, { x: right, y: bottom }, { x: left, y: bottom }];
  const overlap = (p: { x: number; y: number }) => target ? Math.max(0, Math.min(p.x + cardWidth, target.x + target.width + 8) - Math.max(p.x, target.x - 8)) * Math.max(0, Math.min(p.y + cardHeight, target.y + target.height + 8) - Math.max(p.y, target.y - 8)) : 0;
  return positions.sort((a, b) => overlap(a) - overlap(b))[0];
}
