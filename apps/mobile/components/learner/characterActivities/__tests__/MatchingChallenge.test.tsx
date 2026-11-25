import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { MatchingChallenge } from '../MatchingChallenge';
import { matchingBoards } from '../../../../content/characterActivities/matching';
import type { SetAttempt } from '../../../../modules/characterActivities/assessment';
import { characterActivityService as service } from '../../../../database/services/characterActivityService';
jest.mock('../../../../database/services/characterActivityService',()=>({characterActivityService:{submit:jest.fn(),advance:jest.fn()}}));
jest.mock('../../../../localization/LocalizationProvider',()=>({useLocalization:()=>({language:'en',text:(s:string)=>s})}));
jest.mock('../../../../modules/audio/usePronunciation',()=>({usePronunciation:()=>({phase:'ready',pronounce:jest.fn()})}));
const id='checkpoint-v1-topic-2-1',board=matchingBoards(id)[0];
const a:SetAttempt={version:1,id:'test',profileId:'p',activityId:id,setId:id,cursor:0,responses:[],failures:[],startedAt:'2026-11-24T00:00:00Z',updatedAt:'2026-11-24T00:00:00Z',syncState:'local-only'};
function mount(attempt=a){return render(<MatchingChallenge board={board} attempt={attempt} onChange={jest.fn()}/>);}
function give(i:number){fireEvent.press(screen.getByTestId('match-source-'+board.pairs[i].id));fireEvent.press(screen.getByTestId('baya-drop-target'));}
beforeEach(()=>{jest.clearAllMocks();(service.submit as jest.Mock).mockResolvedValue(a);});
it('asks for one character using the shared speech bubble',()=>{mount();expect(screen.getByText('Can you find A?')).toBeTruthy();expect(screen.getByTestId('story-speech-bubble')).toBeTruthy();expect(screen.queryAllByRole('radio')).toHaveLength(0);});
it('selecting a card alone does not grade it',()=>{mount();fireEvent.press(screen.getByTestId('match-source-'+board.pairs[0].id));expect(service.submit).not.toHaveBeenCalled();});
it('gives immediate wrong feedback when given the wrong card',async()=>{mount();give(1);await waitFor(()=>expect(screen.getByText('Not quite. Try again.')).toBeTruthy());expect(service.submit).toHaveBeenCalledWith(a,board.pairs[0].id,expect.objectContaining({kind:'mascot-match-v3',targetQuestionId:board.pairs[1].id}));});
it('correct match enters collection without a Next button',async()=>{mount();give(0);await waitFor(()=>expect(screen.getByText('Correct match!')).toBeTruthy());expect(screen.getByText('A')).toBeTruthy();expect(screen.queryByLabelText('Next')).toBeNull();expect(screen.getByText('Correct!')).toBeTruthy();});
it('practice retry does not overwrite a saved incorrect answer',async()=>{const saved={...a,responses:[{questionId:board.pairs[0].id,answer:{kind:'mascot-match-v3' as const,boardId:board.id,boardStart:0,targetQuestionId:board.pairs[1].id},correct:false,answeredAt:a.startedAt}]};mount(saved);give(0);await waitFor(()=>expect(screen.getByText('Correct match!')).toBeTruthy());expect(service.submit).not.toHaveBeenCalled();});
it('restores correct response without requiring another match',()=>{mount({...a,responses:[{questionId:board.pairs[0].id,answer:{kind:'mascot-match-v3',boardId:board.id,boardStart:0,targetQuestionId:board.pairs[0].id},correct:true,answeredAt:a.startedAt}]});expect(screen.queryByLabelText('Next')).toBeNull();expect(screen.getByText('Correct!')).toBeTruthy();});

it('advances automatically once after correct feedback',async()=>{
 jest.useFakeTimers();
 (service.advance as jest.Mock).mockResolvedValue({...a,cursor:1});
 mount({...a,responses:[{questionId:board.pairs[0].id,answer:{kind:'mascot-match-v3',boardId:board.id,boardStart:0,targetQuestionId:board.pairs[0].id},correct:true,answeredAt:a.startedAt}]});
 expect(service.advance).not.toHaveBeenCalled();
 await act(async()=>{jest.advanceTimersByTime(1800);});
 expect(service.advance).toHaveBeenCalledTimes(1);
 jest.useRealTimers();
});
it('switches cards without submitting an answer',()=>{mount();fireEvent.press(screen.getByLabelText('Switch card'));expect(service.submit).not.toHaveBeenCalled();});

it('keeps the speaker inside the shared speech bubble',()=>{
 const audioBoard={...board,pairs:board.pairs.map(p=>({...p,interaction:1}))};
 render(<MatchingChallenge board={audioBoard} attempt={a} onChange={jest.fn()}/>);
 expect(within(screen.getByTestId('story-speech-bubble')).getByLabelText('Play sound 1')).toBeTruthy();
});
it('blocks repeated switches until the front card returns behind the stack',async()=>{
 jest.useFakeTimers();mount();
 await act(async()=>{});
 fireEvent.press(screen.getByLabelText('Switch card'));
 expect(screen.getByLabelText('Switch card')).toBeDisabled();
 await act(async()=>{jest.advanceTimersByTime(600);});
 expect(screen.getByLabelText('Switch card')).toBeEnabled();
 expect(service.submit).not.toHaveBeenCalled();
 jest.useRealTimers();
});
