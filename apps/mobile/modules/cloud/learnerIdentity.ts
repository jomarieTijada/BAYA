import type { SupabaseClient } from '@supabase/supabase-js';
import type { LocalCloudIdentity } from './learnerEmailAuth';

/** Verify server Auth and role before binding; a local UUID is never authorization. */
export async function verifyLearnerIdentity(client: SupabaseClient, local: LocalCloudIdentity,
  bind: (localId: string, userId: string) => Promise<void>) {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  const user = data.user;
  if (!user || (!user.is_anonymous && !user.email_confirmed_at)) throw { code: 'learner_login_required' };
  if (local.auth_user_id && local.auth_user_id !== user.id) throw { code: 'account_mismatch' };
  const profile = await client.from('profiles').select('profile_id,role').eq('auth_user_id', user.id).single();
  if (profile.error) throw profile.error;
  if (profile.data.role !== 'learner') throw { code: 'account_mismatch' };
  await bind(local.profile_id, user.id);
  return { email: user.email ?? '', profileId: profile.data.profile_id as string };
}
