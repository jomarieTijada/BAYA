import { Platform } from 'react-native';
import { observeOfflineCompletion } from './offline';
import { recordAchievementEvent } from './service';
import { workerMessage } from '../offline/package';
import { topicCheckpoints } from '../../content/characterActivities/checkpoints';
import type { SetAttempt } from '../characterActivities/assessment';
import type { DatabaseConnection } from '../../database/types';

jest.mock('../offline/package', () => ({ workerMessage: jest.fn() }));
jest.mock('./service', () => ({ recordAchievementEvent: jest.fn() }));

describe('offline completion evidence', () => {
  const checkpoint = topicCheckpoints[0];
  const attempt: SetAttempt = {
    id: 'saved', version: 1, profileId: 'owner', activityId: checkpoint.id, setId: checkpoint.id,
    startedAt: '2026-01-01', updatedAt: '2026-01-02', cursor: checkpoint.questions.length,
    responses: checkpoint.questions.map(q => ({questionId:q.id,correct:true,answeredAt:'2026-01-02',answer:{kind:'choice',optionId:'historical'}})),
    failures: [], syncState:'local-only',
  };
  const db = {} as DatabaseConnection;
  const platform = Platform.OS;
  beforeAll(() => { Object.defineProperty(Platform, 'OS', {configurable:true,value:'web'}); });
  afterAll(() => { Object.defineProperty(Platform, 'OS', {configurable:true,value:platform}); });
  const previous = Object.getOwnPropertyDescriptor(globalThis,'navigator');
  const network = (online: boolean) => Object.defineProperty(globalThis,'navigator',{configurable:true,value:{onLine:online,serviceWorker:{controller:{}}}});
  beforeEach(() => { jest.clearAllMocks(); network(false); jest.mocked(workerMessage).mockResolvedValue({ready:true,lastVerified:'2026-01-02',version:'v'}); });
  afterEach(() => { if(previous)Object.defineProperty(globalThis,'navigator',previous);else Reflect.deleteProperty(globalThis,'navigator'); });
  it('requires verified resources even with a scored, completed checkpoint',async()=>{
    jest.mocked(workerMessage).mockResolvedValue({ready:false});
    await observeOfflineCompletion(attempt,db);
    expect(recordAchievementEvent).not.toHaveBeenCalled();
  });
  it('rejects an unfinished, technically failed or unscored attempt before probing the worker',async()=>{
    await observeOfflineCompletion({...attempt,cursor:0,responses:[],failures:[{at:'today',questionId:'one',reason:'technical'}]},db);
    await observeOfflineCompletion({...attempt,responses:attempt.responses.map(r=>({...r,correct:null}))},db);
    await observeOfflineCompletion({...attempt,cursor:1},db);
    expect(workerMessage).not.toHaveBeenCalled();
    expect(recordAchievementEvent).not.toHaveBeenCalled();
  });
  it('checks connectivity both before and after worker verification',async()=>{
    network(true);await observeOfflineCompletion(attempt,db);
    expect(workerMessage).not.toHaveBeenCalled();
    network(false);jest.mocked(workerMessage).mockImplementationOnce(async()=>{network(true);return {ready:true,version:'v',lastVerified:'today'} as never});
    await observeOfflineCompletion(attempt,db);expect(recordAchievementEvent).not.toHaveBeenCalled();
  });
  it('links a verified offline completion to the saved learner and attempt',async()=>{
    await observeOfflineCompletion(attempt,db);
    expect(recordAchievementEvent).toHaveBeenCalledWith('owner','offline','saved',db);
  });
});
