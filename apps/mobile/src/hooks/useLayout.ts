/**
 * apps/mobile/src/hooks/useLayout.ts
 *
 * Responsive layout hook for BAYA landscape-only screens.
 *
 * Layout modes (based on landscape screen HEIGHT — the constrained axis):
 *   compact  height < 390   Very short landscape phones (e.g. 800 x 360)
 *   phone    height < 550   Standard landscape phones   (e.g. 915 x 412)
 *   tablet   height >= 550  Tablets / large phones      (e.g. 1280 x 800)
 *
 * Canvas sizing considers BOTH axes:
 *   - Width axis: screenWidth minus right panel, padding, gaps
 *   - Height axis: screenHeight minus header, footer, padding
 *   - canvasSize = min(both axes, maxForMode) clamped to minForMode
 *
 * All values are memoized -- only recalculated when window dimensions change.
 */

import { useMemo } from 'react';
import { useWindowDimensions, PixelRatio } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ---------------------------------------------------------------------------
// Layout mode
// ---------------------------------------------------------------------------

export type LayoutMode = 'compact' | 'phone' | 'tablet';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface LayoutValues {
  /** Current window width in logical pixels. */
  width: number;
  /** Current window height in logical pixels. */
  height: number;
  /** Derived layout mode based on window height. */
  layoutMode: LayoutMode;
  /**
   * Square canvas side length in logical pixels.
   * Always fits within both the available width and available height.
   */
  canvasSize: number;
  /**
   * Width of the right info/controls panel in logical pixels.
   * On compact/phone layouts this is a compact panel; on tablet it is wider.
   */
  rightPanelWidth: number;
  /** Standard spacing unit for this layout mode. */
  spacing: number;
  /**
   * Font scale multiplier (1.0 = base). Applied as a clamp factor.
   * Use clampFont(size) helper rather than multiplying directly.
   */
  fontScale: number;
  /** Safe-area insets from react-native-safe-area-context. */
  insets: { top: number; bottom: number; left: number; right: number };
  /** Device pixel ratio */
  pixelRatio: number;
  /** Header bar height estimate for this layout mode. */
  headerHeight: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clamp a value between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLayout(): LayoutValues {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pixelRatio = PixelRatio.get();

  return useMemo(() => {
    // Layout mode
    const layoutMode: LayoutMode =
      height < 390 ? 'compact' : height < 550 ? 'phone' : 'tablet';

    // Panel / spacing constants per mode
    const rightPanelWidth =
      layoutMode === 'compact' ? 170 :
      layoutMode === 'phone'   ? 200 :
      /* tablet */               260;

    const spacing =
      layoutMode === 'compact' ? 6  :
      layoutMode === 'phone'   ? 10 :
      /* tablet */               14;

    const fontScale =
      layoutMode === 'compact' ? 0.85 :
      layoutMode === 'phone'   ? 0.95 :
      /* tablet */               1.0;

    // Header / footer estimates
    const headerHeight =
      layoutMode === 'compact' ? 38 :
      layoutMode === 'phone'   ? 44 :
      /* tablet */               52;

    // Canvas size calculation
    // Horizontal budget: total width minus right panel, safe areas, padding, gap
    const hPad = spacing * 2 + insets.left + insets.right;
    const gap  = spacing;
    const availableCanvasWidth =
      width - rightPanelWidth - hPad - gap;

    // Vertical budget: total height minus header, safe areas, padding
    const vPad = spacing * 2 + insets.top + insets.bottom;
    // Extra vertical: canvas action row below canvas (Undo/Hint ~36px)
    const canvasActionRow = layoutMode === 'compact' ? 28 : 36;
    const availableCanvasHeight =
      height - headerHeight - vPad - canvasActionRow;

    // Max canvas per mode (prevents over-scaling on large tablets)
    const maxCanvas =
      layoutMode === 'compact' ? 290 :
      layoutMode === 'phone'   ? 380 :
      /* tablet */               520;

    const minCanvas =
      layoutMode === 'compact' ? 160 :
      layoutMode === 'phone'   ? 220 :
      /* tablet */               300;

    const canvasSize = clamp(
      Math.min(availableCanvasWidth, availableCanvasHeight),
      minCanvas,
      maxCanvas,
    );

    return {
      width,
      height,
      layoutMode,
      canvasSize,
      rightPanelWidth,
      spacing,
      fontScale,
      insets,
      pixelRatio,
      headerHeight,
    };
  }, [width, height, insets, pixelRatio]);
}

/**
 * Clamp a calculated font size to readable bounds.
 * Prevents absurdly large text on tablets or unreadably small text on phones.
 */
export function clampFont(calculated: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(calculated), min), max);
}
