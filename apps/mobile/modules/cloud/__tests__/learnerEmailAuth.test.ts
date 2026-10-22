import type { SupabaseClient } from '@supabase/supabase-js';
import {createLearnerEmailAuth} from '../learnerEmailAuth';
import {cloudFailure} from '../supabaseAdapter';
function setup(){
 const auth={getSession:jest.fn().mockResolvedValue({data:{session:null}}),getUser:jest.fn().mockResolvedValue({data:{user:{id:'cloud',email:'learner@example.test',email_confirmed_at:'2026-10-22'}}}),signInWithOtp:jest.fn().mockResolvedValue({error:null}),verifyOtp:jest.fn().mockResolvedValue({error:null}),signOut:jest.fn().mockResolvedValue({error:null})};
 const single=jest.fn().mockResolvedValue({data:{profile_id:'profile',role:'learner'}});
 const client={auth,from:()=>({select:()=>({eq:()=>({single})})})} as unknown as SupabaseClient;
 const activeLearner=jest.fn().mockResolvedValue({profile_id:'local',display_name:'Learner',auth_user_id:null});const bind=jest.fn().mockResolvedValue(undefined);
 return {auth,single,bind,activeLearner,service:createLearnerEmailAuth({clientFor:()=>client,activeLearner,bind,failure:cloudFailure})};
}
it('requests an email code with a learner role and binds only after verification',async()=>{
 const {service,auth,bind}=setup();const requested=await service.request(' Learner@Example.test ');expect(requested.ok).toBe(true);if(!requested.ok) return;
 expect(auth.signInWithOtp).toHaveBeenCalledWith({email:'learner@example.test',options:{shouldCreateUser:true,data:{account_type:'learner',display_name:'Learner'}}});expect(bind).not.toHaveBeenCalled();
 expect(await service.verify(requested.data.id,' 12345678 ')).toEqual({ok:true,data:{email:'learner@example.test',profileId:'profile'}});expect(bind).toHaveBeenCalledWith('local','cloud');
 expect(await service.verify(requested.data.id,'12345678')).toEqual({ok:false,code:'expired_code'});
});
it('rejects a challenge after switching local learners',async()=>{
 const {service,activeLearner,auth}=setup();const r=await service.request('learner@example.test');if(!r.ok) throw Error();activeLearner.mockResolvedValue({profile_id:'other'});
 expect(await service.verify(r.data.id,'12345678')).toEqual({ok:false,code:'expired_code'});expect(auth.verifyOtp).not.toHaveBeenCalled();
});
it.each(['mentor','other-account'])('rejects %s and clears the unsuitable auth session',async mode=>{
 const {service,single,activeLearner,auth,bind}=setup();if(mode==='mentor')single.mockResolvedValue({data:{profile_id:'profile',role:'mentor'}});else activeLearner.mockResolvedValue({profile_id:'local',auth_user_id:'original'});
 const r=await service.request('learner@example.test');if(!r.ok) throw Error();expect(await service.verify(r.data.id,'12345678')).toEqual({ok:false,code:'account_mismatch'});expect(bind).not.toHaveBeenCalled();expect(auth.signOut).toHaveBeenCalledWith({scope:'local'});
});
it('does not bind or report success when the OTP is wrong',async()=>{
 const {service,auth,bind}=setup();auth.verifyOtp.mockResolvedValue({error:{code:'otp_expired'}} as any);const r=await service.request('learner@example.test');if(!r.ok) throw Error();expect(await service.verify(r.data.id,'bad')).toEqual({ok:false,code:'expired_code'});expect(bind).not.toHaveBeenCalled();
});
it('does not reuse an unconfirmed or anonymous session',async()=>{
 const {service,auth,bind}=setup();auth.getSession.mockResolvedValue({data:{session:{}}} as any);auth.getUser.mockResolvedValue({data:{user:{id:'cloud',email:'learner@example.test',is_anonymous:true}}} as any);
 expect(await service.session()).toEqual({ok:false,code:'learner_login_required'});expect(bind).not.toHaveBeenCalled();
});
