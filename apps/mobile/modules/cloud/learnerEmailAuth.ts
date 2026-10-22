import type { SupabaseClient } from '@supabase/supabase-js';
import type { CloudServices, FailureCode, LearnerCloudSession, Result } from './services';
export type LocalCloudIdentity = { profile_id: string; display_name: string; auth_user_id?: string | null };
export function createLearnerEmailAuth({ clientFor, activeLearner, bind, failure }: {
  clientFor: (id: string) => SupabaseClient;
  activeLearner: () => Promise<LocalCloudIdentity | null>;
  bind: (localId: string, userId: string) => Promise<void>;
  failure: (e: unknown) => { ok: false; code: FailureCode };
}): NonNullable<CloudServices['learnerAuth']> {
  const challenges = new Map<string, { localId: string; email: string }>();
  let sequence = 0;
  async function run<T>(fn: () => Promise<T>): Promise<Result<T>> { try { return { ok: true, data: await fn() }; } catch (e) { return failure(e); } }
  async function identity() { const local = await activeLearner(); if (!local) throw { code: 'learner_required' }; return local; }
  async function checked(client: SupabaseClient, local: LocalCloudIdentity): Promise<LearnerCloudSession> {
    const { data, error } = await client.auth.getUser(); if (error) throw error;
    const user = data.user;
    if (!user || user.is_anonymous || !user.email_confirmed_at || !user.email) throw { code: 'learner_login_required' };
    const profile = await client.from('profiles').select('profile_id,role').eq('auth_user_id',user.id).single();
    if (profile.error) throw profile.error;
    if (profile.data.role !== 'learner' || (local.auth_user_id && local.auth_user_id !== user.id)) throw { code: 'account_mismatch' };
    await bind(local.profile_id,user.id);
    return { email: user.email, profileId: profile.data.profile_id };
  }
  return {
    session: () => run(async () => {
      const local = await activeLearner(); if (!local) return null;
      const client = clientFor(local.profile_id); const session = await client.auth.getSession();
      if (session.error) throw session.error;
      if (!session.data.session) return null;
      return checked(client,local);
    }),
    request: email => run(async () => {
      const local = await identity(); const normalized = email.trim().toLowerCase();
      const { error } = await clientFor(local.profile_id).auth.signInWithOtp({email: normalized,options:{shouldCreateUser:true,data:{account_type:'learner',display_name:local.display_name}}});
      if (error) throw error;
      const id = `learner-${++sequence}`; challenges.set(id,{localId:local.profile_id,email:normalized}); return {id,email:normalized};
    }),
    verify: (id,code) => run(async () => {
      const local = await identity(); const challenge = challenges.get(id);
      if (!challenge || challenge.localId !== local.profile_id) throw {code:'otp_expired'};
      const client = clientFor(local.profile_id);
      const verified = await client.auth.verifyOtp({email:challenge.email,token:code.trim(),type:'email'});
      if (verified.error) throw verified.error;
      try { const result = await checked(client,local); challenges.delete(id); return result; }
      catch (error) { await client.auth.signOut({scope:'local'}); throw error; }
    }),
    signOut: () => run(async () => { const local = await identity(); const {error} = await clientFor(local.profile_id).auth.signOut({scope:'local'}); if(error) throw error; }),
  };
}
