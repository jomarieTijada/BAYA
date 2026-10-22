import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import type { LearnerProgressSummary } from '../../modules/progress/contracts';
import { isSyncedToday, syncTime } from '../../modules/progress/presentation';
import { p } from './ProgressPage';
import { AppButton } from '../ui/AppButton';
import { Colors } from '../../constants/theme';

export function LearnerProgressRow({ learner, index, onView }: { learner: LearnerProgressSummary; index: number; onView: () => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 1000;
  const fresh = isSyncedToday(learner.lastSyncedAt);
  const colors = ['#FFF3BC', '#CBFAEE', '#FFE3E8'];
  return <View style={[p.card, p.row, { padding: 16, gap: 18 }]}>
    <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: colors[index % colors.length], justifyContent: 'center', alignItems: 'center' }}>
      <Text style={p.name}>{learner.displayName.trim().slice(0, 1).toUpperCase()}</Text>
    </View>
    <View style={{ flex: 1, minWidth: compact ? 180 : 220 }}>
      <Text style={p.name}>{learner.displayName}</Text>
      <Text style={[p.text, { color: Colors.accent, marginTop: 6 }]}>{learner.currentTopic}{learner.lastSyncedAt && learner.percentage !== 100 ? ` (Module ${learner.stage} of ${learner.totalStages})` : ''}</Text>
    </View>
    <View style={[p.row, { flex: compact ? undefined : 1, width: compact ? '100%' : undefined, flexWrap: 'nowrap' }]}>
      <View accessibilityRole="progressbar" accessibilityLabel={`${learner.displayName} completed topics`} accessibilityValue={learner.percentage === null ? { text: 'Not synchronized yet' } : { min: 0, max: 100, now: learner.percentage }} style={{ height: 14, backgroundColor: '#F3F3F3', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 7, flex: 1, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${Math.max(0, Math.min(100, learner.percentage ?? 0))}%`, backgroundColor: fresh ? '#10B981' : '#F5A000', borderRadius: 7 }} />
      </View>
      <Text style={[p.name, { fontSize: 21, minWidth: 52, textAlign: 'right' }]}>{learner.percentage === null ? '—' : `${learner.percentage}%`}</Text>
    </View>
    <Text style={[p.text, { color: fresh ? '#00896B' : Colors.textMuted, minWidth: 90 }]}>{fresh ? '✓ ' : ''}{syncTime(learner.lastSyncedAt)}</Text>
    <AppButton compact label="VIEW →" accessibilityLabel={`View ${learner.displayName}'s progress`} onPress={onView} fullWidth={false} style={{ minWidth: 110, minHeight: 44, height: 44, borderRadius: 18 }} />
  </View>;
}
