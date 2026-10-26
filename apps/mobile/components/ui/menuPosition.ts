export type MenuAnchor = { x: number; y: number; width: number; height: number };
export function menuPosition(anchor: MenuAnchor, width: number, height: number, desiredHeight: number, insets: { top: number; bottom: number; left: number; right: number }) {
  const menuWidth = Math.min(264, width - insets.left - insets.right - 24);
  const below = anchor.y + anchor.height + 8;
  const roomBelow = height - insets.bottom - 12 - below;
  const roomAbove = anchor.y - insets.top - 20;
  const above = roomBelow < desiredHeight && roomAbove > roomBelow;
  const maxHeight = Math.max(44, above ? roomAbove : roomBelow);
  return { width: menuWidth, maxHeight, left: Math.max(insets.left + 12, Math.min(anchor.x + anchor.width - menuWidth, width - insets.right - menuWidth - 12)), top: above ? Math.max(insets.top + 12, anchor.y - 8 - Math.min(desiredHeight, maxHeight)) : below };
}
