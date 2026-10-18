import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors, IconSize } from '../../constants/theme';
import { ioniconBaseline, ioniconPaths, ioniconUnits } from './ioniconPaths.web';

export type AppIconName =
  | 'arrowLeft'
  | 'arrowRight'
  | 'back'
  | 'bookmark'
  | 'check'
  | 'checkboxChecked'
  | 'checkboxEmpty'
  | 'chevronLeft'
  | 'chevronRight'
  | 'circleCheck'
  | 'circleDot'
  | 'circleEmpty'
  | 'close'
  | 'devicePortrait'
  | 'forward'
  | 'home'
  | 'help'
  | 'swipeHand'
  | 'lessons'
  | 'lock'
  | 'menu'
  | 'personFilled'
  | 'phoneLandscape'
  | 'play'
  | 'profile'
  | 'progress'
  | 'achievement'
  | 'search'
  | 'settings'
  | 'sound'
  | 'soundOff'
  | 'star'
  | 'starOutline'
  | 'add'
  | 'cloud'
  | 'sync'
  | 'trash'
  | 'undo'
  | 'pencil'
  | 'video'
  | 'writing';

type AppIconColor =
  | 'accent'
  | 'achievement'
  | 'adventure'
  | 'avatarIcon'
  | 'bayaOrange'
  | 'error'
  | 'goal'
  | 'level'
  | 'muted'
  | 'onPrimary'
  | 'primaryText'
  | 'secondaryText'
  | 'starMuted'
  | 'success';

type AppIconSize = keyof typeof IconSize | number;

type AppIconProps = {
  accessibilityLabel?: string;
  color?: AppIconColor;
  name: AppIconName;
  size?: AppIconSize;
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const iconNames = {
  arrowLeft: 'arrow-back',
  arrowRight: 'arrow-forward',
  back: 'arrow-back',
  bookmark: 'bookmark',
  check: 'checkmark',
  checkboxChecked: 'checkbox',
  checkboxEmpty: 'square-outline',
  chevronLeft: 'chevron-back',
  chevronRight: 'chevron-forward',
  circleCheck: 'checkmark-circle',
  circleDot: 'radio-button-on',
  circleEmpty: 'ellipse-outline',
  close: 'close',
  devicePortrait: 'tablet-portrait-outline',
  forward: 'arrow-forward',
  home: 'home',
  help: 'help-circle-outline',
  swipeHand: 'hand-left-outline',
  lessons: 'book',
  lock: 'lock-closed',
  menu: 'menu',
  personFilled: 'person',
  phoneLandscape: 'phone-landscape-outline',
  play: 'play',
  profile: 'person-outline',
  progress: 'stats-chart-outline',
  achievement: 'ribbon-outline',
  search: 'search',
  settings: 'settings-outline',
  sound: 'volume-high-outline',
  soundOff: 'volume-mute-outline',
  star: 'star',
  starOutline: 'star-outline',
  add: 'add',
  cloud: 'cloud-outline',
  sync: 'sync',
  trash: 'trash-outline',
  undo: 'arrow-undo-outline',
  pencil: 'pencil-outline',
  video: 'videocam-outline',
  writing: 'pencil-outline',
} satisfies Record<AppIconName, IoniconName>;

const iconColors = {
  accent: Colors.rolePrimary,
  achievement: Colors.achievement,
  adventure: Colors.adventure,
  avatarIcon: '#3D2F1D',
  bayaOrange: Colors.bayaOrange,
  error: Colors.error,
  goal: Colors.goal,
  level: Colors.level,
  muted: Colors.textMuted,
  onPrimary: Colors.surface,
  primaryText: Colors.textPrimary,
  secondaryText: Colors.textSecondary,
  starMuted: '#9EAFC1',
  success: Colors.success,
} satisfies Record<AppIconColor, string>;

/** Maps stable BAYA icon names and tokens to the project's primary Ionicons family. */
export function AppIcon({
  accessibilityLabel,
  color = 'primaryText',
  name,
  size = 'lg',
}: AppIconProps) {
  const decorative = !accessibilityLabel;
  const resolvedSize = typeof size === 'number' ? size : IconSize[size];

  if (Platform.OS === 'web') {
    return (
      <Svg
        aria-hidden={decorative}
        aria-label={accessibilityLabel}
        role={decorative ? undefined : 'img'}
        focusable={false}
        height={resolvedSize}
        viewBox={`0 0 ${ioniconUnits} ${ioniconUnits}`}
        width={resolvedSize}
      >
        <Path
          d={ioniconPaths[iconNames[name]]}
          fill={iconColors[color]}
          transform={`translate(0 ${ioniconBaseline}) scale(1 -1)`}
        />
      </Svg>
    );
  }

  return (
    <Ionicons
      accessibilityElementsHidden={decorative}
      accessibilityLabel={accessibilityLabel}
      accessible={!decorative}
      aria-hidden={decorative}
      color={iconColors[color]}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      name={iconNames[name]}
      size={resolvedSize}
    />
  );
}
