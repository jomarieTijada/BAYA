import { openLearnerSettings } from '../settings/LearnerSettingsOverlay';
import { useActivityResume } from '../../../modules/resume/ActivityResumeBoundary';
import { useLocalizedAlert } from '../../../localization/useLocalizedAlert';
import React, { useEffect, useRef, useState } from 'react';

import { useRouter } from 'expo-router';

import { topicCheckpoints } from '../../../content/characterActivities/checkpoints';
import { approvedCurriculum } from '../../../content/approvedCurriculum';
import { getBaybayinCharacterTopic } from '../../../content/baybayinCharactersData';
import { localLearnerService } from '../../../database/services/localLearnerService';
import { LearnerAppShell } from '../LearnerAppShell';
import { ActivityHeader } from '../activity/ActivityHeader';
import { StoryNavigation } from '../story/StoryNavigation';
import { CharacterViewer } from './CharacterViewer';

/** Shared Module 2 shell; only the supplied topic data changes. */
export function CharacterTopicScreen({ topicId }: { topicId: string }) {
  const module = approvedCurriculum.find(m => m.topics.some(t => t.id === topicId))!;
  const characterCounts = module.topics.map(t => getBaybayinCharacterTopic(t.id)?.characters.length ?? 0);
  const totalCharacters = characterCounts.reduce((n, count) => n + count, 0);
  const resume = useActivityResume();
  const localizedAlert = useLocalizedAlert();
  const router = useRouter();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const advancing = useRef(false);
  const [selection, setSelection] = useState({ topicId, index: resume?.initial.draft.kind === 'characters' ? resume.initial.draft.index : 0 });
  const topic = getBaybayinCharacterTopic(topicId);
  const index = module.topics.findIndex(item => item.id === topicId);
  let selectedIndex;
  if (selection.topicId === topicId) {
    selectedIndex = selection.index;
  } else {
    selectedIndex = 0;
  }
  const updateResume = resume?.update;
  useEffect(() => { updateResume?.({ kind: 'characters', index: selectedIndex }, true); }, [selectedIndex, updateResume]);
  const isLastCharacter = selectedIndex === (topic?.characters.length ?? 1) - 1;
  const checkpoint = topicCheckpoints.find(c => c.topicId === topicId);
  const isLastTopic = index === module.topics.length - 1;
  const backToLessons = () => router.dismissTo('/learner/lessons');
  const openTopic = (id: string) => {
    setSelection({ topicId: id, index: 0 });
    router.setParams({ topicId: id });
  };
  const selectCharacter = (characterIndex: number) => setSelection({ topicId, index: characterIndex });

  const previous = () => {
    if (selectedIndex > 0) selectCharacter(selectedIndex - 1);
    else if (index > 0) openTopic(module.topics[index - 1].id);
  };

  const completeAndNext = async () => {
    if (advancing.current || !topic) return;
    if (!isLastCharacter) {
      selectCharacter(selectedIndex + 1);
      return;
    }
    advancing.current = true;
    setIsAdvancing(true);
    let target;
    if (!isLastTopic) {
      target = (module.topics[index + 1].id);
    } else {
      target = '/learner/lessons';
    }
    try {
      if (__DEV__) console.info('[BAYA Progress] request topicId=%s source=character_next target=%s', topicId, target);
      if (resume) await localLearnerService.completeTopic(topicId, undefined, resume.initial.profileId);
      else await localLearnerService.completeTopic(topicId);
      if (resume && !resume.isActive()) return;
      if (__DEV__) console.info('[BAYA Progress] navigate topicId=%s target=%s', topicId, target);
      if (checkpoint) router.push({ pathname: '/learner/character-activities', params: { checkpointId: checkpoint.id } });
      else if (!isLastTopic) openTopic(module.topics[index + 1].id);
      else backToLessons();
    } catch (error) {
      if (__DEV__) console.warn('[BAYA Progress] request topicId=%s status=failed', topicId, { error });
      localizedAlert('Could not save progress', 'Please try again.');
    } finally {
      advancing.current = false;
      setIsAdvancing(false);
    }
  };

  if (!topic) return null;
  return (
    <LearnerAppShell
      activeRoute="/learner/lessons"
      backgroundColor="#FFFDF7"
      showBottomNavigation={false}
      header={<ActivityHeader currentStep={characterCounts.slice(0, index).reduce((total, count) => total + count, 0) + selectedIndex + 1} totalSteps={totalCharacters} onBack={backToLessons} onOpenSettings={() => openLearnerSettings()} subtitle={topic.title} title={module.title} />}
      floatingFooter
      footer={<StoryNavigation disabled={isAdvancing} onPrevious={(() => {
        if (selectedIndex > 0 || index > 0) {
          return previous;
        } else {
          return undefined;
        }
      })()} onNext={completeAndNext} isLast={!checkpoint && isLastTopic && isLastCharacter} previousAccessibilityLabel={(() => {
        if (selectedIndex > 0) {
          return 'Bumalik sa nakaraang simbolo';
        } else {
          return 'Bumalik sa nakaraang paksa';
        }
      })()} nextAccessibilityLabel={(() => {
        if (!isLastCharacter) {
          return 'Susunod na simbolo';
        } else {
          if (checkpoint) return 'Next';
          if (isLastTopic) {
            return 'Bumalik sa mga paksa';
          } else {
            return 'Susunod na paksa';
          }
        }
      })()} />}
      testID={`character-topic-screen-${topicId}`}
    >
      <CharacterViewer topicId={topic.id} characters={topic.characters} selectedIndex={selectedIndex} onSelectCharacter={selectCharacter} />
    </LearnerAppShell>
  );
}

export function Topic2_1Screen() { return <CharacterTopicScreen topicId="topic-2-1" />; }
export function Topic2_2Screen() { return <CharacterTopicScreen topicId="topic-2-2" />; }
