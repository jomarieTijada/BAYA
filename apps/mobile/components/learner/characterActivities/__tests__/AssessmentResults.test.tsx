import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SetResultStage } from '../AssessmentResults';
import { characterActivities } from '../../../../content/characterActivities';
import { completionTotals } from '../../../../modules/characterActivities/completion';
import type { SetAttempt } from '../../../../modules/characterActivities/assessment';

jest.mock('../../../../localization/LocalizationProvider',()=>({useLocalization:()=>({language:'en',text:(s:string)=>s})}));
jest.mock('../../../ui/BayaDialog',()=>({BayaDialog:({completionContent}:{completionContent:React.ReactNode})=><>{completionContent}</>}));
function fixture(activityIndex=1,correct=4,pending=0){
 const set=characterActivities[activityIndex].sets[pending?1:0];
 const attempt: SetAttempt={version:1,id:'current-completed',profileId:'qa',activityId:characterActivities[activityIndex].id,setId:set.id,startedAt:'2026-11-21T00:00:00Z',updatedAt:'2026-11-21T00:00:00Z',cursor:5,failures:[],syncState:'local-only',responses:set.questions.map((q,i)=>({questionId:q.id,answer:{kind:'unavailable',reason:'recording-pending-validation'},correct:i>=5-pending?null:i<correct,answeredAt:'2026-11-21T00:00:00Z'}))};
 const next=jest.fn(),retry=jest.fn();
 render(<SetResultStage attempt={attempt} set={set} attempts={[attempt]} busy={false} onRepeat={retry} onNext={next}/>);
 return {attempt,next,retry};
}
it.each([0,1,2,3])('uses the same three-row completion and actions for activity %i',index=>{
 const {next,retry}=fixture(index);
 expect(screen.getByTestId('completion-metrics')).toBeTruthy();
 expect(screen.getByText('4 / 5')).toBeTruthy();
 fireEvent.press(screen.getByTestId('completion-next'));expect(next).toHaveBeenCalledTimes(1);
 fireEvent.press(screen.getByTestId('completion-retry'));expect(retry).toHaveBeenCalledTimes(1);
 fireEvent.press(screen.getByTestId('completion-summary'));expect(screen.getByTestId('review-attempt-current-completed')).toBeTruthy();
 fireEvent.press(screen.getByTestId('completion-summary'));expect(screen.getByTestId('completion-metrics')).toBeTruthy();
});
it('keeps pending items outside the scored denominator and practice count',()=>{
 const {attempt}=fixture(0,3,2);
 expect(completionTotals([attempt])).toEqual({scored:3,correct:3,visited:5,pending:2,practice:0,sets:1});
 expect(screen.getByText('3 / 3')).toBeTruthy();expect(screen.getByText('Awaiting Validation')).toBeTruthy();
 expect(screen.queryByText('Great Job!')).toBeNull();expect(screen.queryByText(/3 stars/i)).toBeNull();
});
it('offers encouragement without claiming a perfect result for zero correct answers',()=>{
 fixture(1,0);expect(screen.getByText('0 / 5')).toBeTruthy();expect(screen.getByText('Keep Practicing!')).toBeTruthy();
});
