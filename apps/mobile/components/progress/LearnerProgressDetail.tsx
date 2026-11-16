import { useLocalization } from '../../localization/LocalizationProvider';
import { localeFor } from '../../localization/core';
import { Text } from '../../localization/components';
import React, { useCallback } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useCloudServices, failureMessage } from '../../modules/cloud/services';
import { useCloudRead } from '../../modules/progress/useCloudRead';
import { syncTime } from '../../modules/progress/presentation';
import { ProgressPage, p } from './ProgressPage';
import { Notice } from '../mentor/FeatureScreen';
import { AppButton } from '../ui/AppButton';

export function LearnerProgressDetail({ workspaceId, profileId }: { workspaceId: string; profileId: string }) {
  const { language } = useLocalization();
  const services = useCloudServices();
  const { result, refresh } = useCloudRead(useCallback(() => services.progress.learner(workspaceId, profileId), [services, workspaceId, profileId]));
  return <ProgressPage title="Learner Progress" subtitle="Synchronized topic completion" onBack={() => router.replace({ pathname: '/mentor/workspaces/[id]', params: { id: workspaceId } })}>
    {(() => {
      if (!result) {
        return <Notice busy text="Loading learner progress…" />;
      } else {
        if (!result.ok) {
          return <View style={p.card}><Notice text={failureMessage[result.code]} /><AppButton label="TRY AGAIN" accessibilityLabel="Retry learner progress" onPress={refresh} /></View>;
        } else {
          return <>
      <View style={p.card}><Text style={p.title} verbatim>{result.data.learner.displayName}</Text><Text style={[p.text, { marginTop: 12 }]}>{(() => {
        if (result.data.learner.lastSyncedAt) {
          return `${result.data.learner.completedTopics} of ${result.data.learner.totalTopics} topics completed · ${result.data.learner.percentage}%`;
        } else {
          return 'No synchronized progress yet';
        }
      })()}</Text><Text style={[p.text, { marginTop: 8 }]}>Last synchronized: {syncTime(result.data.learner.lastSyncedAt, new Date(), language)}</Text></View>
      {result.data.topics.map(topic => <View key={topic.topicKey} style={[p.card, p.row, { justifyContent: 'space-between' }]}>
        <View style={{ flex: 1 }}><Text style={[p.text, { marginBottom: 5 }]}>{topic.moduleTitle}</Text><Text style={[p.name, { fontSize: 21 }]}>{topic.title}</Text></View>
        <Text style={p.text}>{(() => {
          if (topic.completedAt) {
            return `✓ Completed · ${new Date(topic.completedAt).toLocaleDateString(localeFor(language))}`;
          } else {
            if (result.data.learner.lastSyncedAt) {
              return 'Not completed';
            } else {
              return 'Not synchronized';
            }
          }
        })()}</Text>
      </View>)}
    </>;
        }
      }
    })()}
  </ProgressPage>;
}
