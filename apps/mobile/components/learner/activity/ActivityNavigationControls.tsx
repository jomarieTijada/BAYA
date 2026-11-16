import { Pressable, Text } from '../../../localization/components';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors, FontFamily, Shadows } from '../../../constants/theme';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { AppIcon } from '../../ui/AppIcon';

/**
 * Reusable Video Native Controls Safe Area Spacing Constants.
 * Used to elevate floating navigation actions above native player controls
 * (fullscreen button, scrubber timeline, volume, settings) during video steps.
 */
export const VIDEO_NATIVE_CONTROLS_SAFE_ZONE = {
  desktop: 90,
  tablet: 80,
  mobile: 24,
  landscapeCompact: 60,
} as const;

export const VIDEO_CONTROL_SAFE_BOTTOM = 88;
export const VIDEO_CONTROL_SAFE_BOTTOM_TABLET = 84;
export const VIDEO_CONTROL_SAFE_BOTTOM_MOBILE = 24;
export const VIDEO_CONTROL_SAFE_BOTTOM_LANDSCAPE = 60;
export const DEFAULT_NAVIGATION_BOTTOM = 12;
export const DEFAULT_NAVIGATION_BOTTOM_LANDSCAPE = 8;

export type ActivityNavigationControlsProps = {
  compact?: boolean;
  disabledHint?: string;
  isFinalStep?: boolean;
  isVideoStep?: boolean;
  landscapeCompact?: boolean;
  nextEnabled: boolean;
  nextIcon?: 'arrowRight' | 'check';
  nextLabel?: string;
  onBack: () => void;
  onNext: () => void;
  showBack?: boolean;
  showNext?: boolean;
};

/**
 * Mobile Learning Floating Card Controls.
 * Integrated directly inside the active learning container.
 * - Bottom-left: Circular Back Button (44-48px, solid white background)
 * - Bottom-right: Circular Next Button (44-48px, solid BAYA orange background)
 *
 * Layer Hierarchy:
 * - Video Player: zIndex 1
 * - BAYA Navigation Overlay: zIndex 10
 * - Buttons: zIndex 20
 *
 * For VIDEO steps:
 * - Desktop: bottom 88px, right 28px (clears fullscreen and 3-dots native controls)
 * - Tablet: bottom 84px, right 24px
 * - Mobile: bottom 24px, right 18px
 * - Landscape compact: bottom 60px, right 16px
 *
 * For SLIDE steps:
 * Controls sit at standard corner position (bottom: 12px, horizontal: 12px).
 */
export function ActivityNavigationControls({
  compact = false,
  disabledHint = 'Complete video first',
  isFinalStep = false,
  isVideoStep = false,
  landscapeCompact = false,
  nextEnabled,
  nextIcon,
  nextLabel,
  onBack,
  onNext,
  showBack = true,
  showNext = true,
}: ActivityNavigationControlsProps) {
  const { isDesktop, isPhoneLandscape, isTablet } = useResponsiveLayout();
  const isLandscapeMode = landscapeCompact || isPhoneLandscape;

  const [backHovered, setBackHovered] = useState(false);
  const [backFocused, setBackFocused] = useState(false);
  const [nextHovered, setNextHovered] = useState(false);
  const [nextFocused, setNextFocused] = useState(false);

  // Button size: 44px - 48px circle
  let buttonSize;
  if (isLandscapeMode) {
    buttonSize = 42;
  } else {
    if (compact) {
      buttonSize = 44;
    } else {
      buttonSize = 48;
    }
  }
  let iconSize;
  if (isLandscapeMode) {
    iconSize = 19;
  } else {
    if (compact) {
      iconSize = 20;
    } else {
      iconSize = 22;
    }
  }

  // Responsive safe positioning outside the native controls zone
  let bottomPosition;
  if (isVideoStep) {
    if (isLandscapeMode) {
      bottomPosition = VIDEO_CONTROL_SAFE_BOTTOM_LANDSCAPE;
    } else {
      if (isDesktop) {
        bottomPosition = VIDEO_CONTROL_SAFE_BOTTOM;
      } else {
        if (isTablet) {
          bottomPosition = VIDEO_CONTROL_SAFE_BOTTOM_TABLET;
        } else {
          bottomPosition = VIDEO_CONTROL_SAFE_BOTTOM_MOBILE;
        }
      }
    }
  } else {
    if (isLandscapeMode) {
      bottomPosition = DEFAULT_NAVIGATION_BOTTOM_LANDSCAPE;
    } else {
      bottomPosition = DEFAULT_NAVIGATION_BOTTOM;
    }
  }

  let horizontalPosition;
  if (isVideoStep) {
    if (isLandscapeMode) {
      horizontalPosition = 16;
    } else {
      if (isDesktop) {
        horizontalPosition = 28;
      } else {
        if (isTablet) {
          horizontalPosition = 24;
        } else {
          horizontalPosition = 18;
        }
      }
    }
  } else {
    if (isLandscapeMode) {
      horizontalPosition = 10;
    } else {
      horizontalPosition = 12;
    }
  }

  const handleNextPress = () => { if (nextEnabled) onNext(); };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.overlayContainer,
        {
          bottom: bottomPosition,
          left: horizontalPosition,
          pointerEvents: 'box-none' as any,
          right: horizontalPosition,
        },
      ]}
      testID="activity-navigation-controls"
    >
      {/* Bottom-Left: Circular Back Button (Visible when showBack = true) */}
      {(() => {
        if (showBack) {
          return (
        <Pressable
          accessibilityHint="Bumalik sa nakaraang hakbang"
          accessibilityLabel="Nakaraang hakbang"
          accessibilityRole="button"
          hitSlop={10}
          onBlur={() => setBackFocused(false)}
          onFocus={() => setBackFocused(true)}
          onHoverIn={() => setBackHovered(true)}
          onHoverOut={() => setBackHovered(false)}
          onPress={onBack}
          pointerEvents="auto"
          style={({ pressed }) => [
            styles.circularButton,
            styles.backButton,
            {
              borderRadius: buttonSize / 2,
              cursor: 'pointer' as any,
              height: buttonSize,
              pointerEvents: 'auto' as any,
              width: buttonSize,
            },
            (backHovered || backFocused) && styles.backButtonHovered,
            pressed && styles.buttonPressed,
          ]}
        >
          <AppIcon color="primaryText" name="arrowLeft" size={iconSize} />
        </Pressable>
      );
        } else {
          return (
        <View pointerEvents="none" style={styles.placeholder} />
      );
        }
      })()}

      {/* Bottom-Right: Circular Next Button (Visible when showNext = true) */}
      {(() => {
        if (showNext) {
          return (
        <Pressable
          accessibilityHint={
            (() => {
              if (!nextEnabled) {
                return disabledHint;
              } else {
                if (isFinalStep) {
                  return 'Tapusin ang aralin';
                } else {
                  return 'Pumunta sa susunod na hakbang';
                }
              }
            })()
          }
          accessibilityLabel={(() => {
            if (isFinalStep) {
              return 'Tapusin ang aralin';
            } else {
              return 'Ituloy ang aralin';
            }
          })()}
          accessibilityRole="button"
          accessibilityState={{ disabled: !nextEnabled }}
          hitSlop={10}
          onBlur={() => setNextFocused(false)}
          onFocus={() => setNextFocused(true)}
          onHoverIn={() => setNextHovered(true)}
          onHoverOut={() => setNextHovered(false)}
          disabled={!nextEnabled}
            onPress={handleNextPress}
          pointerEvents="auto"
          style={({ pressed }) => [
            styles.circularButton,
            styles.nextButton,
            (() => {
              if (nextLabel) {
                return styles.pillButton;
              } else {
                return null;
              }
            })(),
            {
              borderRadius: buttonSize / 2,
              cursor: 'pointer' as any,
              height: buttonSize,
              pointerEvents: 'auto' as any,
              width: (() => {
                if (nextLabel) {
                  return 'auto';
                } else {
                  return buttonSize;
                }
              })(),
              paddingHorizontal: (() => {
                if (nextLabel) {
                  if (compact) {
                    return 16;
                  } else {
                    return 20;
                  }
                } else {
                  return 0;
                }
              })(),
            },
            !nextEnabled && styles.nextButtonDisabled,
            nextEnabled && (nextHovered || nextFocused) && styles.nextButtonHovered,
            pressed && styles.buttonPressed,
          ]}
        >
          {(() => {
            if (nextLabel) {
              return (
            <Text
              style={[
                styles.nextLabelText,
                compact && styles.nextLabelTextCompact,
                landscapeCompact && styles.nextLabelTextLandscapeCompact,
                !nextEnabled && styles.nextLabelTextDisabled,
              ]}
            >
              {nextLabel}
            </Text>
          );
            } else {
              return null;
            }
          })()}
          <AppIcon
            color={(() => {
              if (nextEnabled) {
                return 'onPrimary';
              } else {
                return 'muted';
              }
            })()}
            name={nextIcon || ((() => {
              if (isFinalStep) {
                return 'check';
              } else {
                return 'arrowRight';
              }
            })())}
            size={iconSize}
          />
        </Pressable>
      );
        } else {
          return (
        <View pointerEvents="none" style={styles.placeholder} />
      );
        }
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    alignItems: 'center',
    elevation: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    zIndex: 10,
  },
  circularButton: {
    alignItems: 'center',
    elevation: 20,
    justifyContent: 'center',
    zIndex: 20,
    ...Shadows.card,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
  },
  nextLabelText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.rounded,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  nextLabelTextCompact: {
    fontSize: 14,
  },
  nextLabelTextLandscapeCompact: {
    fontSize: 13,
  },
  nextLabelTextDisabled: {
    color: '#8D8174',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#EFE7DA',
    borderWidth: 1.5,
  },
  backButtonHovered: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DECFC0',
    transform: [{ scale: 1.05 }],
  },
  nextButton: {
    backgroundColor: '#FAA61F',
    borderColor: '#FFA20A',
    borderWidth: 1.5,
  },
  nextButtonDisabled: {
    backgroundColor: '#EAE1D5',
    borderColor: '#D8CDC0',
    elevation: 6,
    shadowOpacity: 0.1,
  },
  nextButtonHovered: {
    backgroundColor: Colors.rolePrimaryHover,
    transform: [{ scale: 1.05 }],
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  placeholder: {
    height: 48,
    width: 48,
  },
});
