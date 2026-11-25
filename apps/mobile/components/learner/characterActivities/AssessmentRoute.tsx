import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { findCheckpoint, topicCheckpoints } from '../../../content/characterActivities/checkpoints';
import { curriculumService } from '../../../database/services/curriculumService';
import { localLearnerService } from '../../../database/services/localLearnerService';
import { checkpointEligibility } from '../../../modules/characterActivities/curriculum';
import { CharacterActivityHub } from './CharacterActivityHub';
import { useCharacterCopy } from './copy';
import { useLocalization } from '../../../localization/LocalizationProvider';
import { AppButton } from '../../ui/AppButton';

export function AssessmentRoute() {
  const params = useLocalSearchParams<{ checkpointId?: string; activityId?: string; activity?: string }>();
  const id = params.checkpointId;
  const activity = findCheckpoint(id ?? '');
  const legacy = params.activityId ?? params.activity;
  const legacyOwner = topicCheckpoints.find(c => c.questions.some(q => q.id.startsWith(`${legacy}-`)));
  const [access, setAccess] = useState<{ id: string; profileId: string; eligible: boolean; missing: string[] } | null>(null);
  const [error, setError] = useState(false);
  const router = useRouter(), copy = useCharacterCopy(), { language, text } = useLocalization();
  useFocusEffect(useCallback(() => {
    let active = true;
    setAccess(null); setError(false);
    if (activity) void (async () => {
      try {
        const profile = await localLearnerService.getActiveLearner();
        const modules = await curriculumService.getCurriculumModules();
        const eligibility = checkpointEligibility(activity.id, modules);
        const missing = eligibility.missingTopicIds.map(id => text(modules.flatMap(m => m.topics).find(t => t.id === id)?.title ?? id));
        if (active) setAccess({ id: activity.id, profileId: profile?.profile_id ?? '', eligible: !!profile && eligibility.eligible, missing });
      } catch { if (active) setError(true); }
    })();
    return () => { active = false; };
  }, [activity, text]));
  if (!activity) return <Redirect href={{ pathname: '/learner/lessons', params: legacyOwner ? { moduleId: legacyOwner.moduleId } : {} }} />;
  if (access?.id === activity.id && access.eligible) return <CharacterActivityHub key={`${access.profileId}:${activity.id}`} checkpoint={activity} />;
  return <View style={{ flex: 1, padding: 24, gap: 16, backgroundColor: '#FFFDF7', justifyContent: 'center' }}>
    <Text accessibilityRole="header">{activity.title[language === 'tl' ? 'tl' : 'en']}</Text>
    <Text accessibilityLiveRegion="polite">{error ? copy.error : !access ? copy.loading : `${language === 'tl' ? 'Naka-lock — tapusin: ' : 'Locked — complete: '}${access.missing.join(', ')}`}</Text>
    <AppButton label={copy.back} accessibilityLabel={copy.back} onPress={() => router.replace({ pathname: '/learner/lessons', params: { moduleId: activity.moduleId } })} />
  </View>;
}
