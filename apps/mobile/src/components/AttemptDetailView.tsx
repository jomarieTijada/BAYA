import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { ATTEMPTS_PER_CHARACTER } from '@baya/shared-types';
import { StrokeReplayCanvas } from './StrokeReplayCanvas';
import {
  getAttemptDetailMetrics,
  type AttemptDetailData,
} from '../screens/practiceUiLogic';

interface Props {
  attempt: AttemptDetailData;
  imageUri: string | null;
  previewLabel: string;
  previewSize: number;
}

function formatDimension(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function AttemptDetailView({
  attempt,
  imageUri,
  previewLabel,
  previewSize,
}: Props) {
  const metrics = getAttemptDetailMetrics(attempt);

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>{previewLabel}</Text>
          <Text style={styles.target}>{attempt.targetClass.toUpperCase()}</Text>
        </View>
        <View style={styles.attemptBadge}>
          <Text style={styles.attemptBadgeText}>
            {`Attempt ${attempt.attemptNumber ?? '—'} of ${ATTEMPTS_PER_CHARACTER}`}
          </Text>
        </View>
      </View>

      <View style={styles.previewSection}>
        {imageUri ? (
          <Image
            key={`${attempt.attemptId}:${imageUri}`}
            source={{ uri: imageUri }}
            style={[styles.previewImage, { width: previewSize, height: previewSize }]}
            resizeMode="contain"
            accessibilityLabel={`Actual handwriting for ${attempt.targetClass}, attempt ${attempt.attemptNumber ?? 'unknown'}`}
          />
        ) : (
          <View style={[styles.previewImage, styles.missingPreview, { width: previewSize, height: previewSize }]}>
            <Text style={styles.missingPreviewText}>Preview unavailable</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.stat}><Text style={styles.statValue}>{metrics.strokeCount}</Text> strokes</Text>
        <Text style={styles.stat}><Text style={styles.statValue}>{metrics.pointCount}</Text> points</Text>
        <Text style={styles.stat}><Text style={styles.statValue}>{metrics.durationSeconds.toFixed(2)} s</Text></Text>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailText}>
          Canvas: <Text style={styles.detailValue}>{`${formatDimension(attempt.canvasWidth)} × ${formatDimension(attempt.canvasHeight)}`}</Text>
        </Text>
        {attempt.layoutMode && (
          <Text style={styles.detailText}>Layout: <Text style={styles.detailValue}>{attempt.layoutMode}</Text></Text>
        )}
        {attempt.screenWidth != null && attempt.screenHeight != null && (
          <Text style={styles.detailText}>
            Screen: <Text style={styles.detailValue}>{`${formatDimension(attempt.screenWidth)} × ${formatDimension(attempt.screenHeight)}`}</Text>
          </Text>
        )}
        {attempt.pixelRatio != null && (
          <Text style={styles.detailText}>Pixel ratio: <Text style={styles.detailValue}>{attempt.pixelRatio.toFixed(2)}</Text></Text>
        )}
        {attempt.schemaVersion != null && (
          <Text style={styles.detailText}>Schema: <Text style={styles.detailValue}>{`v${attempt.schemaVersion}`}</Text></Text>
        )}
        <Text style={styles.idText}>{`Attempt ID: ${attempt.attemptId}`}</Text>
      </View>

      <View style={styles.replaySection}>
        <Text style={styles.sectionLabel}>Stroke replay</Text>
        <StrokeReplayCanvas
          strokes={attempt.strokes}
          width={previewSize}
          height={previewSize}
          sourceWidth={attempt.canvasWidth}
          sourceHeight={attempt.canvasHeight}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    color: '#777',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  target: {
    color: '#A88000',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 2,
  },
  attemptBadge: {
    backgroundColor: '#F4F7F1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  attemptBadgeText: {
    color: '#3E8027',
    fontSize: 12,
    fontWeight: '700',
  },
  previewSection: {
    alignItems: 'center',
  },
  previewImage: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E7E7',
  },
  missingPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
  },
  missingPreviewText: {
    color: '#999',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 9,
    padding: 10,
    gap: 8,
  },
  stat: {
    color: '#666',
    fontSize: 12,
  },
  statValue: {
    color: '#333',
    fontWeight: 'bold',
  },
  detailsCard: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 9,
    padding: 10,
    gap: 4,
  },
  detailText: {
    color: '#666',
    fontSize: 12,
  },
  detailValue: {
    color: '#333',
    fontWeight: '600',
  },
  idText: {
    color: '#999',
    fontSize: 9,
    marginTop: 4,
  },
  replaySection: {
    alignItems: 'center',
    gap: 8,
  },
  sectionLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700',
  },
});
