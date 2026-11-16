import { useLocalization } from '../../localization/LocalizationProvider';
import { AccessibilityView, Text } from '../../localization/components';
import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import type { LearnerProgressSummary } from '../../modules/progress/contracts';
import { isSyncedToday, syncTime } from '../../modules/progress/presentation';
import { p } from './ProgressPage';
import { AppButton } from '../ui/AppButton';
import { Colors } from '../../constants/theme';

export function LearnerProgressRow({ learner, index, onView }: { learner: LearnerProgressSummary; index: number; onView: () => void }) {
  const { language } = useLocalization();
  const { width } = useWindowDimensions();
  const compact = width < 1000;
  const fresh = isSyncedToday(learner.lastSyncedAt);
  const colors = ['#FFF3BC', '#CBFAEE', '#FFE3E8'];
  return <View style={[p.card, p.row, { padding: 16, gap: 18 }]}>
    <View style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: colors[index % colors.length], justifyContent: 'center', alignItems: 'center' }}>
      <Text style={p.name} verbatim>{learner.displayName.trim().slice(0, 1).toUpperCase()}</Text>
    </View>
    <View style={{ flex: 1, minWidth: (() => {
      if (compact) {
        return 180;
      } else {
        return 220;
      }
    })() }}>
      <Text style={p.name} verbatim>{learner.displayName}</Text>
      <Text style={[p.text, { color: Colors.accent, marginTop: 6 }]}>{learner.currentTopic}{(() => {
        if (learner.lastSyncedAt && learner.percentage !== 100) {
          return ` (Module ${learner.stage} of ${learner.totalStages})`;
        } else {
          return '';
        }
      })()}</Text>
    </View>
    <View style={[p.row, { flex: (() => {
      if (compact) {
        return undefined;
      } else {
        return 1;
      }
    })(), width: (() => {
      if (compact) {
        return '100%';
      } else {
        return undefined;
      }
    })(), flexWrap: 'nowrap' }]}>
      <AccessibilityView accessibilityRole="progressbar" accessibilityLabel={`${learner.displayName} completed topics`} accessibilityValue={(() => {
        if (learner.percentage === null) {
          return { text: 'Not synchronized yet' };
        } else {
          return { min: 0, max: 100, now: learner.percentage };
        }
      })()} style={{ height: 14, backgroundColor: '#F3F3F3', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 7, flex: 1, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${Math.max(0, Math.min(100, learner.percentage ?? 0))}%`, backgroundColor: (() => {
          if (fresh) {
            return '#10B981';
          } else {
            return '#F5A000';
          }
        })(), borderRadius: 7 }} />
      </AccessibilityView>
      <Text style={[p.name, { fontSize: 21, minWidth: 52, textAlign: 'right' }]}>{(() => {
        if (learner.percentage === null) {
          return '—';
        } else {
          return `${learner.percentage}%`;
        }
      })()}</Text>
    </View>
    <Text style={[p.text, { color: (() => {
      if (fresh) {
        return '#00896B';
      } else {
        return Colors.textMuted;
      }
    })(), minWidth: 90 }]}>{(() => {
      if (fresh) {
        return '✓ ';
      } else {
        return '';
      }
    })()}{syncTime(learner.lastSyncedAt, new Date(), language)}</Text>
    <AppButton compact label="VIEW →" accessibilityLabel={`View ${learner.displayName}'s progress`} onPress={onView} fullWidth={false} style={{ minWidth: 110, minHeight: 44, height: 44, borderRadius: 18 }} />
  </View>;
}
