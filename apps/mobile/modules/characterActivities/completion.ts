import { getAssessmentSet } from '../../content/characterActivities/checkpoints';
import { attemptedCount, score, type SetAttempt } from './assessment';

/** Presentation aggregates persisted responses without new correctness or reward rules. */
export function completionTotals(attempts: readonly SetAttempt[]) {
  const scored=attempts.reduce((n,a)=>n+attemptedCount(a),0);
  const correct=attempts.reduce((n,a)=>n+score(a),0);
  const visited=attempts.reduce((n,a)=>n+a.responses.length,0);
  return {scored,correct,visited,pending:visited-scored,practice:scored-correct,sets:attempts.filter(a=>a.cursor===getAssessmentSet(a.setId).set.questions.length).length};
}
