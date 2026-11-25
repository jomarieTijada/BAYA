import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ModuleAssessments } from '../ModuleAssessments';
import { createApprovedModules } from '../../../../content/modules/catalog';
import type { SetAttempt } from '../../../../modules/characterActivities/assessment';
const mockPush=jest.fn();
jest.mock('expo-router',()=>({useLocalSearchParams:()=>({}),useRouter:()=>({push:mockPush})}));
jest.mock('../../../ui/AppIcon',()=>({AppIcon:()=>null}));
jest.mock('../AssessmentResults',()=>({AttemptReview:()=>null}));
jest.mock('../../../ui/CompletionDialog',()=>({CompletionDialog:()=>null}));
const id='checkpoint-v1-topic-2-1';
function modules(completed:boolean) {
  const m=createApprovedModules();
  m.flatMap(m=>m.topics).slice(0,6).forEach(t=>{t.completed=completed;});
  return m;
}
function attempt(cursor:number):SetAttempt {return {version:1,id:'saved',profileId:'owner',activityId:id,setId:id,cursor,responses:[],failures:[],startedAt:'2026-11-22T00:00:00Z',updatedAt:'2026-11-22T00:00:00Z',syncState:'local-only'};}
test('an incomplete topic cannot open its checkpoint; completing it opens the exact subset route',()=>{
 const r=render(<ModuleAssessments topicId="topic-2-1" modules={modules(false)} attempts={[]}/>);
 const row=screen.getByTestId('checkpoint-topic-2-1');
 expect(row.props.accessibilityState.disabled).toBe(true);fireEvent.press(row);expect(mockPush).not.toHaveBeenCalled();
 r.rerender(<ModuleAssessments topicId="topic-2-1" modules={modules(true)} attempts={[]}/>);
 fireEvent.press(screen.getByTestId('checkpoint-topic-2-1'));
 expect(mockPush).toHaveBeenCalledWith({pathname:'/learner/character-activities',params:{checkpointId:id}});
});
test('resume and completed rows keep details accessible without visible counts',()=>{
 const r=render(<ModuleAssessments topicId="topic-2-1" modules={modules(true)} attempts={[attempt(1)]}/>);
 expect(screen.queryByText(/1\/3/)).toBeNull();
 expect(screen.getByTestId('checkpoint-topic-2-1').props.accessibilityLabel).toMatch(/Continue|Magpatuloy/);
 r.rerender(<ModuleAssessments topicId="topic-2-1" modules={modules(true)} attempts={[attempt(3)]}/>);
 expect(screen.queryByText(/3\/3/)).toBeNull();
 expect(screen.getByTestId('checkpoint-topic-2-1').props.accessibilityLabel).toMatch(/Review|Balikan/);
 expect(screen.queryByText(/5\/5/)).toBeNull();
});
test('topics without source questions do not receive fabricated checkpoints',()=>{
 render(<ModuleAssessments topicId="topic-3-1" modules={modules(true)} attempts={[]}/>);
 expect(screen.queryByTestId(/checkpoint-/)).toBeNull();
});
