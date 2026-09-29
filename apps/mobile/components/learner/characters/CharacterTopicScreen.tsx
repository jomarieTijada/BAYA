import React, { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { approvedCurriculum } from '../../../content/approvedCurriculum';
import { getBaybayinCharacterTopic } from '../../../content/baybayinCharactersData';
import { localLearnerService } from '../../../database/services/localLearnerService';
import { LearnerAppShell } from '../LearnerAppShell';
import { ActivityHeader } from '../activity/ActivityHeader';
import { StoryNavigation } from '../story/StoryNavigation';
import { CharacterViewer } from './CharacterViewer';

const module = approvedCurriculum.find(item => item.id === 'module-2')!;
const characterCounts = module.topics.map(item => getBaybayinCharacterTopic(item.id)?.characters.length ?? 0);
const totalCharacters = characterCounts.reduce((total, count) => total + count, 0);

/** Shared Module 2 shell; only the supplied topic data changes. */
function CharacterTopicScreen({ topicId }: { topicId: 'topic-2-1' | 'topic-2-2' }) {
  const router = useRouter();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const advancing = useRef(false);
  const [selection, setSelection] = useState({ topicId, index: 0 });
  const topic = getBaybayinCharacterTopic(topicId);
  const index = module.topics.findIndex(item => item.id === topicId);
  const selectedIndex = selection.topicId === topicId ? selection.index : 0;
  const isLastCharacter = selectedIndex === (topic?.characters.length ?? 1) - 1;
  const isLastTopic = index === module.topics.length - 1;
  const backToLessons = () => router.dismissTo('/learner/lessons');
  const openTopic = (id: 'topic-2-1' | 'topic-2-2') => {
    setSelection({ topicId: id, index: 0 });
    router.setParams({ topicId: id });
  };
  const selectCharacter = (characterIndex: number) => setSelection({ topicId, index: characterIndex });

  const previous = () => {
    if (selectedIndex > 0) selectCharacter(selectedIndex - 1);
    else if (index > 0) openTopic(module.topics[index - 1].id as 'topic-2-1' | 'topic-2-2');
  };

  const completeAndNext = async () => {
    if (advancing.current || !topic) return;
    if (!isLastCharacter) {
      selectCharacter(selectedIndex + 1);
      return;
    }
    advancing.current = true;
    setIsAdvancing(true);
    const target = !isLastTopic ? (module.topics[index + 1].id as 'topic-2-1' | 'topic-2-2') : '/learner/lessons';
    try {
      if (__DEV__) console.info('[BAYA Progress] request topicId=%s source=character_next target=%s', topicId, target);
      await localLearnerService.completeTopic(topicId);
      if (__DEV__) console.info('[BAYA Progress] navigate topicId=%s target=%s', topicId, target);
      if (!isLastTopic) openTopic(module.topics[index + 1].id as 'topic-2-1' | 'topic-2-2');
      else backToLessons();
    } catch (error) {
      if (__DEV__) console.warn('[BAYA Progress] request topicId=%s status=failed', topicId, { error });
      Alert.alert('Could not save progress', 'Please try again.');
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
      header={<ActivityHeader currentStep={characterCounts.slice(0, index).reduce((total, count) => total + count, 0) + selectedIndex + 1} totalSteps={totalCharacters} onBack={backToLessons} onOpenSettings={() => router.push('/learner/settings')} subtitle={topic.title} title={module.title} />}
      footer={<StoryNavigation disabled={isAdvancing} onPrevious={selectedIndex > 0 || index > 0 ? previous : undefined} onNext={completeAndNext} isLast={isLastTopic && isLastCharacter} previousAccessibilityLabel={selectedIndex > 0 ? 'Bumalik sa nakaraang simbolo' : 'Bumalik sa nakaraang paksa'} nextAccessibilityLabel={!isLastCharacter ? 'Susunod na simbolo' : isLastTopic ? 'Bumalik sa mga paksa' : 'Susunod na paksa'} />}
      testID={`character-topic-screen-${topicId}`}
    >
      <CharacterViewer topicId={topic.id} characters={topic.characters} selectedIndex={selectedIndex} onSelectCharacter={selectCharacter} />
    </LearnerAppShell>
  );
}

export function Topic2_1Screen() { return <CharacterTopicScreen topicId="topic-2-1" />; }
export function Topic2_2Screen() { return <CharacterTopicScreen topicId="topic-2-2" />; }

