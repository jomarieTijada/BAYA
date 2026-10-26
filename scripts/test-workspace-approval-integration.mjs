// Real Supabase integration test. Requires a separately provisioned TEST project,
// applied migrations, anonymous Auth enabled, and two confirmed test mentors.
// Never points at the current BAYA hosted project. Test records are retained.
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';
const env = process.env;
const required = ['BAYA_TEST_URL','BAYA_TEST_PUBLISHABLE_KEY','BAYA_TEST_MENTOR_A_EMAIL','BAYA_TEST_MENTOR_A_PASSWORD','BAYA_TEST_MENTOR_B_EMAIL','BAYA_TEST_MENTOR_B_PASSWORD'];
for (const name of required) if (!env[name]) throw new Error(`Missing ${name}; use an isolated test environment.`);
if (env.BAYA_TEST_ALLOW_ISOLATED !== 'YES' || new URL(env.BAYA_TEST_URL).hostname === 'xqtsrsxhfylfldtfbuhe.supabase.co') throw new Error('Explicit isolated project required; current hosted BAYA project is blocked.');
const client = () => createClient(env.BAYA_TEST_URL, env.BAYA_TEST_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const [mentorA, mentorB, learnerA, learnerB] = [client(),client(),client(),client()];
async function rpc(c, name, args = {}) {
  const { data, error } = await c.rpc(name,args);
  if (error) throw new Error(`${name}: ${error.code}`);
  return data;
}
async function denied(c, name, args) { const { error } = await c.rpc(name,args); assert.ok(error, `${name} must be denied`); }
for (const [c, suffix] of [[mentorA,'A'],[mentorB,'B']]) {
  const { error } = await c.auth.signInWithPassword({ email: env[`BAYA_TEST_MENTOR_${suffix}_EMAIL`], password: env[`BAYA_TEST_MENTOR_${suffix}_PASSWORD`] });
  if (error) throw new Error(`Test mentor ${suffix} login failed: ${error.code}`);
}
for (const c of [learnerA,learnerB]) {
  const { error } = await c.auth.signInAnonymously({ options: { data: { display_name: 'Isolated test learner', account_type: 'learner' } } });
  if (error) throw new Error(`Test learner Auth failed: ${error.code}`);
}
const w = await rpc(mentorA,'create_workspace',{ p_name: `Approval integration ${new Date().toISOString()}` });
const request = await rpc(learnerA,'request_workspace_join',{ p_code: w.workspace_code });
assert.equal(request.kind,'request_submitted');
assert.equal((await rpc(learnerA,'list_my_memberships')).length,0);
const duplicate = await Promise.all([1,2].map(() => rpc(learnerA,'request_workspace_join',{ p_code: w.workspace_code })));
assert.ok(duplicate.every(r => r.kind === 'already_pending' && r.request.request_id === request.request.request_id));
await denied(mentorB,'review_workspace_join_request',{ p_request_id: request.request.request_id,p_decision:'approved' });
await denied(learnerA,'review_workspace_join_request',{ p_request_id: request.request.request_id,p_decision:'approved' });
const selfUpdate = await learnerA.from('workspace_join_requests').update({ status:'approved' }).eq('request_id',request.request.request_id);
assert.ok(selfUpdate.error);
const otherRequests = await learnerB.from('workspace_join_requests').select('request_id');
assert.ifError(otherRequests.error); assert.equal(otherRequests.data.length,0);
const otherProfile = await learnerB.from('profiles').select('profile_id').single();
assert.ifError(otherProfile.error);
const impersonation = await learnerA.from('workspace_join_requests').insert({ workspace_id:w.workspace_id,learner_profile_id:otherProfile.data.profile_id });
assert.ok(impersonation.error);
const insertion = await learnerA.from('workspace_memberships').insert({ workspace_id:w.workspace_id,learner_profile_id:request.request.learner_profile_id,is_active:true });
assert.ok(insertion.error);
await denied(learnerA,'sync_learning_progress',{ p_version:'version-baya-modules-1-to-3-v1',p_name:'Isolated learner',p_completed:[] });
const approvals = await Promise.all([1,2].map(() => rpc(mentorA,'review_workspace_join_request',{ p_request_id:request.request.request_id,p_decision:'approved' })));
assert.ok(approvals.every(r => r.request.status === 'approved' && r.membership.is_active));
assert.equal(approvals[0].membership.membership_id,approvals[1].membership.membership_id);
assert.equal((await rpc(mentorA,'list_workspace_members',{ p_workspace_id:w.workspace_id })).length,1);
assert.equal((await rpc(learnerA,'list_my_join_requests'))[0].status,'approved');
assert.equal((await rpc(learnerA,'list_my_memberships'))[0].membership.is_active,true);
await rpc(learnerA,'sync_learning_progress',{ p_version:'version-baya-modules-1-to-3-v1',p_name:'Isolated learner',p_completed:[] });
const second = await rpc(learnerB,'request_workspace_join',{ p_code:w.workspace_code });
await rpc(mentorA,'review_workspace_join_request',{ p_request_id:second.request.request_id,p_decision:'rejected' });
assert.equal((await rpc(learnerB,'list_my_memberships')).length,0);
assert.equal((await rpc(learnerB,'list_my_join_requests'))[0].status,'rejected');
await denied(learnerB,'request_workspace_join',{ p_code:'BAYA-000000000000' });
console.log('PASS Real Auth, requests, authorization, concurrent approval, membership, sync, and rejection. Test records retained in the isolated project.');
