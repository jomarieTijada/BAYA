import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QuestionScreen } from '../QuestionScreen';
import { characterActivities } from '../../../../content/characterActivities';
import type { SetAttempt } from '../../../../modules/characterActivities/assessment';
import { characterActivityService as service } from '../../../../database/services/characterActivityService';
import { recognizeWriting } from '../../../../ml/writingRecognition';
import { writingClassId } from '../../../../content/writingMastery';

jest.mock('../../../../database/services/characterActivityService', () => ({ characterActivityService: {submit: jest.fn(), advance: jest.fn(), failure: jest.fn().mockResolvedValue(undefined)} }));
jest.mock('../../../../ml/writingRecognition', () => ({ recognizeWriting: jest.fn() }));
jest.mock('../../../../localization/LocalizationProvider', () => ({ useLocalization: () => ({language:'en',text:(s:string)=>s}) }));
jest.mock('../../../../modules/audio/usePronunciation', () => ({usePronunciation:()=>({phase:'ready',pronounce:jest.fn()})}));
jest.mock('../../writing/WritingCanvas', () => ({WritingCanvas: ({onChange,onSizeChange}: {onChange: (s: unknown)=>void;onSizeChange:(s:unknown)=>void}) => {
  const { Pressable, Text } = jest.requireActual('react-native');
  return <Pressable accessibilityLabel="Draw test strokes" onPress={() => {onSizeChange({width:300,height:250});onChange([[{x:.2,y:.2},{x:.4,y:.5},{x:.7,y:.7}]]);}}><Text>Canvas</Text></Pressable>;
}}));
function fixture(activityIndex: number) {
  const activity = characterActivities[activityIndex], set = activity.sets[0], question = set.questions[0];
  const attempt: SetAttempt = {version:1,id:'test',profileId:'learner',activityId:activity.id,setId:set.id,startedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),cursor:0,responses:[],failures:[],syncState:'local-only'};
  const onChange = jest.fn();
  render(<QuestionScreen {...{activity,question,attempt,onChange}} />);
  return {activity,question,attempt,onChange};
}
beforeEach(() => jest.clearAllMocks());
it('does not expose the listening cue and cannot score before audio', () => {
  fixture(0); expect(screen.queryByText('BA')).toBeNull();
  fireEvent.press(screen.getByTestId('answer-B')); fireEvent.press(screen.getByLabelText('Next'));
  expect(service.submit).not.toHaveBeenCalled();
});
it('selection needs explicit submission and blocks repeated clicks while saving', async () => {
  (service.submit as jest.Mock).mockImplementation(() => new Promise(() => {}));
  fixture(1); fireEvent.press(screen.getByTestId('answer-B')); expect(service.submit).not.toHaveBeenCalled();
  // Native Pressable normalizes ARIA props into accessibilityState; the browser
  // restart harness separately asserts the actual DOM aria-checked attribute.
  expect(screen.getByTestId('answer-B').props.accessibilityState.checked).toBe(true);
  expect(screen.getByTestId('answer-A').props.accessibilityState.checked).toBe(false);
  fireEvent.press(screen.getByLabelText('Next')); fireEvent.press(screen.getByLabelText('Next'));
  expect(service.submit).toHaveBeenCalledTimes(1);
});
it('shows the exact underlined target and sends real canvas data to the inference boundary', async () => {
  const {attempt,onChange} = fixture(3);
  expect(screen.getByTestId('underlined-syllable').props.children).toBe('GA');
  (recognizeWriting as jest.Mock).mockResolvedValue([{label:'ga',classIndex:writingClassId('ga'),probability:.96}]);
  (service.submit as jest.Mock).mockResolvedValue(attempt);
  fireEvent.press(screen.getByLabelText('Draw test strokes')); fireEvent.press(screen.getByLabelText('Check Writing'));
  await waitFor(() => expect(onChange).toHaveBeenCalled());
  expect(recognizeWriting).toHaveBeenCalledWith(expect.any(Array), {width:300,height:250}, 3);
});
it('uncertain recognition gives a retry without a scored response', async () => {
  fixture(3); (recognizeWriting as jest.Mock).mockResolvedValue([{label:'ga',classIndex:writingClassId('ga'),probability:.6}]);
  fireEvent.press(screen.getByLabelText('Draw test strokes')); fireEvent.press(screen.getByLabelText('Check Writing'));
  await waitFor(() => expect(service.failure).toHaveBeenCalledWith(expect.anything(), 'uncertain'));
  expect(service.submit).not.toHaveBeenCalled();
});
it('inference failure retains the drawing and permits a retry without grading', async () => {
  fixture(3); (recognizeWriting as jest.Mock).mockRejectedValue(new Error('runtime unavailable'));
  fireEvent.press(screen.getByLabelText('Draw test strokes')); fireEvent.press(screen.getByLabelText('Check Writing'));
  await waitFor(() => expect(service.failure).toHaveBeenCalled());
  expect(service.submit).not.toHaveBeenCalled(); expect(screen.getByTestId('writing-clear-button')).toBeTruthy();
});

it('uses the canonical lesson layout, target reference, tracing configuration and controls', () => {
  fixture(3);
  expect(screen.getByTestId('canonical-writing-layout')).toBeTruthy();
  expect(screen.getByTestId('writing-reference-card')).toBeTruthy();
  expect(screen.getByTestId('writing-undo-button')).toBeTruthy();
  expect(screen.getByTestId('writing-clear-button')).toBeTruthy();
  expect(screen.getByTestId('writing-confidence-card')).toBeTruthy();
  expect(screen.queryByTestId('assessment-slide')).toBeNull();
});
it('checked multiple choice stays in one slide and advances only on Continue', async () => {
  const activity=characterActivities[1],set=activity.sets[0],question=set.questions[0];
  const attempt: SetAttempt={version:1,id:'checked',profileId:'learner',activityId:activity.id,setId:set.id,startedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),cursor:0,responses:[{questionId:question.id,answer:{kind:'choice',optionId:question.type==='multiple-choice'?question.options[1].id:''},correct:true,answeredAt:new Date().toISOString()}],failures:[],syncState:'local-only'};
  const onChange=jest.fn();(service.advance as jest.Mock).mockResolvedValue({...attempt,cursor:1});
  render(<QuestionScreen {...{activity,question,attempt,onChange}} />);
  expect(screen.getAllByTestId('assessment-slide')).toHaveLength(1);
  expect(screen.getAllByRole('radio')).toHaveLength(3);
  expect(screen.queryByTestId('quiz-instruction')).toBeNull();
  expect(screen.queryByLabelText('Check Answer')).toBeNull();
  expect(service.advance).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Next'));
  await waitFor(()=>expect(onChange).toHaveBeenCalledWith(expect.objectContaining({cursor:1})));
  expect(service.advance).toHaveBeenCalledTimes(1);
});

it('saves the selected choice and advances with one Next press', async () => {
  const {attempt, question, onChange} = fixture(1);
  const saved = {...attempt, responses: [{questionId:question.id, correct:true}]};
  (service.submit as jest.Mock).mockResolvedValue(saved);
  (service.advance as jest.Mock).mockResolvedValue({...saved,cursor:1});
  fireEvent.press(screen.getByTestId('answer-B'));
  fireEvent.press(screen.getByLabelText('Next'));
  await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({cursor:1})));
  expect(service.advance).toHaveBeenCalledWith(saved);
});

it('keeps instructions hidden until BAYA is tapped, and lets the learner dismiss them', () => {
  fixture(1);
  expect(screen.queryByTestId('quiz-instruction')).toBeNull();
  expect(screen.getByText('Which sound matches this character?')).toBeTruthy();
  fireEvent.press(screen.getByTestId('quiz-help-button'));
  expect(screen.getByTestId('quiz-instruction')).toBeTruthy();
  expect(screen.getByTestId('story-speech-bubble')).toBeTruthy();
  expect(screen.getByTestId('speech-tail-bottom', { includeHiddenElements: true })).toBeTruthy();
  expect(screen.getByText('Look at the Baybayin character and choose its romanized equivalent.')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Isara ang mensahe ni BAYA'));
  expect(screen.queryByTestId('quiz-instruction')).toBeNull();
});
