import type { SupabaseClient } from '@supabase/supabase-js';
import { createProgressServices } from '../supabaseProgress';
import { cloudFailure } from '../../cloud/supabaseAdapter';
import type { ProgressSnapshot } from '../contracts';
const saved: ProgressSnapshot={localProfileId:'local-one',authUserId:'cloud-one',displayName:'Learner',version:'version-baya-modules-1-to-3-v1',completed:[{topicKey:'topic-1-1',completedAt:'2026-01-01T00:00:00Z'}]};
function setup() {
 const rpc=jest.fn().mockResolvedValue({data:{syncedAt:'2026-10-21T00:00:00Z'},error:null});
 const getSession=jest.fn().mockResolvedValue({data:{session:{user:{id:"cloud-one"}}},error:null});
 const client={rpc,auth:{getSession}} as unknown as SupabaseClient;
 const mentor={rpc:jest.fn()} as unknown as SupabaseClient;
 const learnerClient=jest.fn(()=>client);
 const snapshot=jest.fn(async()=>saved);
 return {rpc,getSession,mentor,learnerClient,snapshot,service:createProgressServices({mentor,learnerClient,snapshot,failure:cloudFailure})};
}
it('uploads only completion data through the learner session and requires a server receipt',async()=>{
 const {service,rpc,learnerClient,mentor}=setup();
 expect(await service.sync()).toEqual({ok:true,data:{syncedAt:'2026-10-21T00:00:00Z'}});
 expect(learnerClient).toHaveBeenCalledWith('local-one');
 expect(rpc).toHaveBeenCalledWith('sync_learning_progress',{p_version:saved.version,p_name:'Learner',p_completed:saved.completed});
 expect(mentor.rpc).not.toHaveBeenCalled();
 rpc.mockResolvedValue({data:{syncedAt:'bad'},error:null});
 expect((await service.sync()).ok).toBe(false);
});
it('does not upload without an existing learner session',async()=>{
 const {service,rpc,getSession}=setup(); getSession.mockResolvedValue({data:{session:null},error:null});
 expect(await service.sync()).toEqual({ok:false,code:'learner_login_required'});expect(rpc).not.toHaveBeenCalled();
});
it('retries the same durable snapshot after a failed upload',async()=>{
 const {service,rpc}=setup(); rpc.mockResolvedValueOnce({error:{code:'NETWORK'}});
 expect((await service.sync()).ok).toBe(false);
 expect((await service.sync()).ok).toBe(true);
 expect(rpc.mock.calls[0]).toEqual(rpc.mock.calls[1]);
});
it('coalesces simultaneous uploads for the same learner',async()=>{
 const {service,rpc}=setup();let resolve!:(value:unknown)=>void;
 rpc.mockReturnValue(new Promise(r=>{resolve=r;}));
 const a=service.sync(),b=service.sync();await new Promise(r=>setTimeout(r,0));
 expect(rpc).toHaveBeenCalledTimes(1);resolve({data:{syncedAt:'2026-10-21T00:00:00Z'},error:null});await Promise.all([a,b]);
});
it('keeps simultaneous uploads from different local profiles separate',async()=>{
 const {service,rpc,snapshot,learnerClient}=setup();let resolve!:(value:unknown)=>void;
 rpc.mockReturnValue(new Promise(r=>{resolve=r;}));
 const a=service.sync();await new Promise(r=>setTimeout(r,0));
 snapshot.mockResolvedValue({...saved,localProfileId:'local-two'});const b=service.sync();await new Promise(r=>setTimeout(r,0));
 expect(learnerClient.mock.calls).toEqual([['local-one'],['local-two']]);expect(rpc).toHaveBeenCalledTimes(2);
 resolve({data:{syncedAt:'2026-10-21T00:00:00Z'},error:null});await Promise.all([a,b]);
});
it('explains a rejected curriculum without calling it a successful sync',async()=>{
 const {service,rpc}=setup();rpc.mockResolvedValue({error:{code:'22023'}});
 expect(await service.sync()).toEqual({ok:false,code:'incompatible_progress'});
});
it('passes dashboard authorization and pagination to the mentor RPC',async()=>{
 const {service,mentor}=setup();(mentor.rpc as jest.Mock).mockResolvedValue({error:{code:'42501'}});
 expect(await service.dashboard('other-workspace',50)).toEqual({ok:false,code:'unauthorized'});
 expect(mentor.rpc).toHaveBeenCalledWith('get_progress_dashboard',{p_workspace_id:'other-workspace',p_offset:50});
});
it('rejects a malformed dashboard before it reaches a progress view',async()=>{
 const {service,mentor}=setup();(mentor.rpc as jest.Mock).mockResolvedValue({data:{learners:[{}],workspace:{},learnerCount:1},error:null});
 expect((await service.dashboard('class')).ok).toBe(false);
});

it('does not upload a saved profile through a different cloud identity', async()=>{
 const {service,rpc,getSession}=setup(); getSession.mockResolvedValue({data:{session:{user:{id:'other'}}},error:null});
 expect(await service.sync()).toEqual({ok:false,code:'account_mismatch'}); expect(rpc).not.toHaveBeenCalled();
});
