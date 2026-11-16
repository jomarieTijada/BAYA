import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../../localization/components';
import { useLocalization } from '../../localization/LocalizationProvider';
import type { LearnerProgressSummary } from '../../modules/progress/contracts';
import { syncTime } from '../../modules/progress/presentation';
import { Colors, FontFamily, Radius } from '../../constants/theme';
import { AppButton } from '../ui/AppButton';

/** Presentation of the authorized RPC summary, not a second progress calculator. */
export function ResultsSummaryTable({ learners, onView }: { learners: LearnerProgressSummary[]; onView: (profileId: string) => void }) {
  const { text, language } = useLocalization();
  const { width } = useWindowDimensions();
  const headings = ['Learner', 'Topics completed', 'Progress', 'Last synchronized', 'Details'];
  return <View style={styles.section} testID="results-summary">
    <Text accessibilityRole="header" style={styles.title}>Learner Results Summary</Text>
    <Text style={styles.note}>View the learning progress of approved members in this workspace.</Text>
    {width < 1024 && <Text style={styles.hint}>Scroll across the table to see all results.</Text>}
    <ScrollView horizontal tabIndex={0} accessibilityLabel={text('Scroll across the table to see all results.')} showsHorizontalScrollIndicator style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View role="table" accessibilityLabel={text('Learner Results Summary')} style={styles.table} testID="results-table">
        <View role="row" style={[styles.row, styles.header]}>
          {headings.map((heading, index) => <View key={heading} role="columnheader" style={[styles.cell, columns[index]]}><Text style={styles.heading}>{heading}</Text></View>)}
        </View>
        {learners.map((learner, index) => {
          const available = learner.lastSyncedAt !== null && learner.percentage !== null && learner.totalTopics > 0;
          const count = available ? `${learner.completedTopics} / ${learner.totalTopics}` : text('Not available');
          const percentage = available ? `${learner.percentage}%` : text('Not available');
          const synced = learner.lastSyncedAt ? syncTime(learner.lastSyncedAt, new Date(), language) : text('No synchronized results');
          return <View key={learner.profileId} role="row" style={[styles.row, index % 2 === 1 && styles.alternate]} testID={`result-row-${learner.profileId}`}>
            <View role="rowheader" style={[styles.cell, columns[0]]}>
              <Text verbatim style={styles.name}>{learner.displayName}</Text>
              <Text style={styles.note}>{learner.lastSyncedAt ? learner.currentTopic : 'No synchronized results'}</Text>
            </View>
            <View role="cell" style={[styles.cell, columns[1]]}><Text style={styles.value} accessibilityLabel={`${text(headings[1])}: ${count}`}>{count}</Text></View>
            <View role="cell" style={[styles.cell, columns[2]]}><Text style={styles.value} accessibilityLabel={`${text(headings[2])}: ${percentage}`}>{percentage}</Text></View>
            <View role="cell" style={[styles.cell, columns[3]]}><Text style={styles.note} accessibilityLabel={`${text(headings[3])}: ${synced}`}>{synced}</Text></View>
            <View role="cell" style={[styles.cell, columns[4]]}><AppButton compact fullWidth={false} label="View" accessibilityLabel={language === 'tl' ? `Tingnan ang pag-unlad ni ${learner.displayName}` : `View ${learner.displayName}'s progress`} onPress={() => onView(learner.profileId)} style={{ minHeight: 44 }} /></View>
          </View>;
        })}
      </View>
    </ScrollView>
    <Text style={styles.note}>Synchronized topic completion only. Learning not yet synchronized may not appear.</Text>
    <Text style={styles.note}>Approved learners, ordered by join date.</Text>
  </View>;
}
const columns = [{ flex: 2.2, minWidth: 230 }, { flex: 1.2, minWidth: 140 }, { flex: 1, minWidth: 120 }, { flex: 1.3, minWidth: 150 }, { width: 140 }];
const styles = StyleSheet.create({
  section: { gap: 10, minWidth: 0 },
  title: { fontFamily: FontFamily.rounded, fontSize: 23, fontWeight: '800', color: Colors.textPrimary },
  note: { fontFamily: FontFamily.body, fontSize: 16, lineHeight: 22, color: Colors.textSecondary },
  hint: { fontFamily: FontFamily.body, fontSize: 15, color: Colors.textMuted },
  scroll: { width: '100%', flexGrow: 0, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, backgroundColor: Colors.surface },
  scrollContent: { flexGrow: 1 },
  table: { flexGrow: 1, minWidth: 800 },
  row: { flexDirection: 'row', alignItems: 'stretch', borderBottomWidth: 1, borderBottomColor: Colors.border },
  header: { backgroundColor: '#FFF3E1' },
  alternate: { backgroundColor: '#FFFCF6' },
  cell: { padding: 12, gap: 4, justifyContent: 'center', flexShrink: 0 },
  heading: { fontFamily: FontFamily.body, fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  name: { fontFamily: FontFamily.body, fontSize: 17, lineHeight: 23, fontWeight: '700', color: Colors.textPrimary },
  value: { fontFamily: FontFamily.body, fontSize: 17, color: Colors.textPrimary },
});
