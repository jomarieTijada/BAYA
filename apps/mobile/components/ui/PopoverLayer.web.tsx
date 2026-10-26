import React from 'react';
import { createPortal } from 'react-dom';

/** Nonmodal portal escapes scrolling/clipped ancestors without trapping focus. */
export function PopoverLayer({ children }: React.PropsWithChildren<{ onDismiss: () => void }>) {
  if (typeof document === 'undefined') return null;
  return createPortal(<div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1100 }}>{children}</div>, document.body);
}
