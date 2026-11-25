import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../localization/components';
import { useLocalization } from '../../localization/LocalizationProvider';
import type { LearnerProgressSummary } from '../../modules/progress/contracts';
import { syncTime } from '../../modules/progress/presentation';
import { Colors, FontFamily, Radius } from '../../constants/theme';
import { AppButton } from '../ui/AppButton';

/** Presentation of the authorized RPC summary, not a second progress calculator. */
export function ResultsSummaryTable({ learners, onView }: { learners: LearnerProgressSummary[]; onView: (profileId: string) => void }) {
  const { text, language } = useLocalization();
  const headings = ['Learner', 'Topics', 'Progress', 'Last sync', 'Details'];
  return <View style={styles.section} testID="results-summary">
    <Text accessibilityRole="header" style={styles.title}>Learner Results Summary</Text>
    <ScrollView horizontal tabIndex={0} accessibilityLabel={text('Scroll across the table to see all results.')} showsHorizontalScrollIndicator style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View role="table" accessibilityLabel={text('Learner Results Summary')} style={styles.table} testID="results-table">
        <View role="row" style={[styles.row, styles.header]}>
          {headings.map((heading, index) => <View key={heading} role="columnheader" style={[styles.cell, columns[index]]}><Text style={styles.heading}>{heading}</Text></View>)}
        </View>
        {learners.map((learner, index) => {
          const available = learner.lastSyncedAt !== null && learner.percentage !== null && learner.totalTopics > 0;
          const count = available ? `${learner.completedTopics} / ${learner.totalTopics}` : '—';
          const percentage = available ? `${learner.percentage}%` : '—';
          const synced = learner.lastSyncedAt ? syncTime(learner.lastSyncedAt, new Date(), language) : text('Not synchronized yet');
          return <View key={learner.profileId} role="row" style={[styles.row, index % 2 === 1 && styles.alternate]} testID={`result-row-${learner.profileId}`}>
            <View role="rowheader" style={[styles.cell, columns[0]]}>
              <Text verbatim style={styles.name}>{learner.displayName}</Text>
            </View>
            <View role="cell" style={[styles.cell, columns[1]]}><Text style={styles.value} accessibilityLabel={`${text(headings[1])}: ${count}`}>{count}</Text></View>
            <View role="cell" style={[styles.cell, columns[2]]}>{available ? <View accessibilityRole="progressbar" accessibilityLabel={text('Progress')} accessibilityValue={{ min: 0, max: 100, now: learner.percentage! }} style={{ gap: 4 }}><Text style={styles.value}>{percentage}</Text><View style={{ height: 6, borderRadius: 3, backgroundColor: Colors.border, overflow: 'hidden' }}><View style={{ height: 6, width: `${Math.max(0, Math.min(100, learner.percentage!))}%`, backgroundColor: Colors.success }} /></View></View> : <Text style={styles.note}>—</Text>}</View>
            <View role="cell" style={[styles.cell, columns[3]]}><Text style={styles.note} accessibilityLabel={`${text(headings[3])}: ${synced}`}>{synced}</Text></View>
            <View role="cell" style={[styles.cell, columns[4]]}><AppButton density="compact" compact fullWidth={false} label="View" accessibilityLabel={language === 'tl' ? `Tingnan ang pag-unlad ni ${learner.displayName}` : `View ${learner.displayName}'s progress`} onPress={() => onView(learner.profileId)} style={{ minHeight: 32, height: 32, paddingVertical: 2, paddingHorizontal: 10 }} labelStyle={{ fontSize: 12 }} /></View>
          </View>;
        })}
      </View>
    </ScrollView>
  </View>;
}
const columns = [{ flex: 1.8, minWidth: 120 }, { flex: 0.8, minWidth: 70 }, { flex: 1, minWidth: 90 }, { flex: 1.2, minWidth: 115 }, { width: 76 }];
const styles = StyleSheet.create({
  section: { gap: 10, minWidth: 0 },
  title: { fontFamily: FontFamily.rounded, fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  note: { fontFamily: FontFamily.body, fontSize: 13, lineHeight: 17, color: Colors.textSecondary },
  hint: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted },
  scroll: { width: '100%', flexGrow: 0, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, backgroundColor: Colors.surface },
  scrollContent: { flexGrow: 1 },
  table: { flexGrow: 1, minWidth: 500 },
  row: { flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: 1, borderBottomColor: Colors.border },
  header: { backgroundColor: '#FFF3E1' },
  alternate: { backgroundColor: '#FFFCF6' },
  cell: { padding: 8, gap: 4, justifyContent: 'center', flexShrink: 0 },
  heading: { fontFamily: FontFamily.body, fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  name: { fontFamily: FontFamily.body, fontSize: 14, lineHeight: 18, fontWeight: '700', color: Colors.textPrimary },
  value: { fontFamily: FontFamily.body, fontSize: 14, color: Colors.textPrimary },
});
