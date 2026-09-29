import { useWindowDimensions } from 'react-native';

/**
 * Shared viewport classification for BAYA layouts.
 * A short landscape viewport remains a phone even when its width crosses a tablet breakpoint.
 */
export function useResponsiveLayout() {
  const { height, width } = useWindowDimensions();
  const shortSide = Math.min(width, height);
  const isLandscape = width > height;
  const isPhone = shortSide < 600;
  const isPhoneLandscape = isPhone && isLandscape;
  const isPhonePortrait = isPhone && !isLandscape;
  const isCompactHeight = height < 650;
  const isTablet = !isPhone && width >= 600 && width < 1100;
  const isTabletPortrait = isTablet && !isLandscape;
  const isTabletLandscape = isTablet && isLandscape;
  const isDesktop = !isPhone && width >= 1100;

  return {
    height,
    width,
    shortSide,
    isCompactHeight,
    isDesktop,
    isLandscape,
    isPhone,
    isPhoneLandscape,
    isPhonePortrait,
    isTablet,
    isTabletPortrait,
    isTabletLandscape,
  } as const;
}
