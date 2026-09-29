import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '../../../constants/theme';

export type ConnectorState = 'completed' | 'transition' | 'locked';

type LessonPathConnectorProps = {
  compact?: boolean;
  density?: 'regular' | 'compact' | 'landscapeCompact';
  orientation?: 'horizontal' | 'vertical';
  state: ConnectorState;
};

const connectorColors = {
  completed: Colors.bayaGreen,
  transition: Colors.rolePrimary,
  locked: '#D1C7E8',
} satisfies Record<ConnectorState, string>;

/**
 * Visual progression path connector between lesson cards.
 * Adapts to horizontal (desktop/tablet/landscape) or vertical (portrait) flows.
 */
export function LessonPathConnector({
  compact = false,
  density = 'regular',
  orientation = 'horizontal',
  state,
}: LessonPathConnectorProps) {
  const isLandscapeCompact = density === 'landscapeCompact';
  const color = connectorColors[state];
  const isHorizontal = orientation === 'horizontal';

  return (
    <View
      accessibilityElementsHidden
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[
        isHorizontal ? styles.horizontalContainer : styles.verticalContainer,
        compact && (isHorizontal ? styles.horizontalCompact : styles.verticalCompact),
        isLandscapeCompact && styles.horizontalLandscapeCompact,
      ]}
    >
      <View
        style={[
          isHorizontal ? styles.horizontalLine : styles.verticalLine,
          { borderColor: color },
          compact && (isHorizontal ? styles.horizontalLineCompact : styles.verticalLineCompact),
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    width: 38,
    zIndex: 0,
  },
  horizontalCompact: {
    minWidth: 16,
    width: 22,
  },
  horizontalLandscapeCompact: {
    minWidth: 12,
    width: 18,
  },
  verticalContainer: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    minHeight: 28,
    zIndex: 0,
  },
  verticalCompact: {
    height: 24,
    minHeight: 18,
  },
  horizontalLine: {
    borderBottomWidth: 4,
    borderColor: '#D1C7E8',
    borderStyle: 'dashed',
    height: 0,
    width: '100%',
  },
  horizontalLineCompact: {
    borderBottomWidth: 3,
  },
  verticalLine: {
    borderLeftWidth: 4,
    borderColor: '#D1C7E8',
    borderStyle: 'dashed',
    height: '100%',
    width: 0,
  },
  verticalLineCompact: {
    borderLeftWidth: 3,
  },
});
