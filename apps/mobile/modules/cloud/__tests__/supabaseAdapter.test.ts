import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServices, cloudFailure } from '../supabaseAdapter';
import { readCloudConfig } from '../config';

const workspace = { workspace_id: 'w1', mentor_profile_id: 'm1', workspace_name: 'Class', workspace_code: 'BAYA-ABCDEF123456', status: 'active', created_at: '2026-10-21' };
const membership = { membership_id: 'j1', learner_profile_id: 'p1', workspace_id: 'w1', joined_at: '2026-10-21', last_synced_at: null, is_active: true };
const joined = { workspace, membership, alreadyJoined: false };
function mockClient() {
  const auth = {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: jest.fn().mockResolvedValue({data:{user:{id:'cloud-user',is_anonymous:true}}}), signInWithPassword: jest.fn(), signUp: jest.fn(), verifyOtp: jest.fn(),
    resend: jest.fn(), resetPasswordForEmail: jest.fn(), updateUser: jest.fn(),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    signInAnonymously: jest.fn().mockResolvedValue({ data: {session:{user:{id:'cloud-user'}}}, error: null }),
  };
  const rpc = jest.fn().mockResolvedValue({ data: joined, error: null });
  const from = jest.fn().mockReturnValue({select:()=>({eq:()=>({single:async()=>({data:{profile_id:'p1',role:'learner'}})})})});
  return { auth, rpc, from, client: { auth, rpc, from } as unknown as SupabaseClient };
}
function setup() {
  const mentor = mockClient(); const learner = mockClient(); const recovery = mockClient();
  const activeLearner = jest.fn().mockResolvedValue({ profile_id: 'local-one', display_name: 'Learner' });
  const learnerClient = jest.fn().mockReturnValue(learner.client);
  const service = createSupabaseServices({ mentor: mentor.client, learnerClient, recoveryClient: () => recovery.client, activeLearner, bindLearner: async () => {} });
  return { service, mentor, learner, recovery, activeLearner, learnerClient };
}
it('does not create anonymous users while reading memberships', async () => {
  const { service, learner } = setup();
  expect(await service.workspaces.memberships()).toEqual({ ok: true, data: [] });
  expect(learner.auth.signInAnonymously).not.toHaveBeenCalled();
  expect(learner.rpc).not.toHaveBeenCalled();
});
it('creates and verifies a device learner before authorizing a code-only join', async () => {
  const { service, learner } = setup();
  expect(await service.workspaces.join(workspace.workspace_code)).toEqual({ ok: true, data: joined });
  expect(learner.auth.signInAnonymously).toHaveBeenCalledTimes(1);
  expect(learner.auth.getUser).toHaveBeenCalled();
  expect(learner.rpc).toHaveBeenCalledWith('join_workspace', {p_code: workspace.workspace_code});
});
it('does not fall back to mentor identity when no active learner exists', async () => {
  const { service, activeLearner, learnerClient } = setup(); activeLearner.mockResolvedValue(null);
  expect(await service.workspaces.join(workspace.workspace_code)).toEqual({ ok: false, code: 'learner_required' });
  expect(learnerClient).not.toHaveBeenCalled();
});
it('resolves a separate session namespace after switching local learners', async () => {
  const { service, activeLearner, learnerClient } = setup();
  await service.workspaces.memberships();
  activeLearner.mockResolvedValue({ profile_id: 'local-two', display_name: 'Other' });
  await service.workspaces.memberships();
  expect(learnerClient.mock.calls).toEqual([['local-one'], ['local-two']]);
});
it('reuses existing learner auth and propagates denied membership', async () => {
  const { service, learner } = setup();
  learner.auth.getSession.mockResolvedValue({ data: { session: {} }, error: null });
  learner.rpc.mockResolvedValue({ error: { code: '42501' } });
  expect(await service.workspaces.join(workspace.workspace_code)).toEqual({ ok: false, code: 'unauthorized' });
  expect(learner.auth.signInAnonymously).not.toHaveBeenCalled();
});
it('uses server workspace output and rejects malformed responses', async () => {
  const { service, mentor } = setup(); mentor.rpc.mockResolvedValue({ data: { ...workspace, learnerCount: 3 }, error: null });
  expect(await service.workspaces.create(' Class ')).toEqual({ ok: true, data: { ...workspace, learnerCount: 3 } });
  expect(mentor.rpc).toHaveBeenCalledWith('create_workspace', { p_name: 'Class' });
  mentor.rpc.mockResolvedValue({ data: { workspace_code: 'fake' }, error: null });
  expect((await service.workspaces.create('Class')).ok).toBe(false);
});
it('requires a provider challenge and does not store passwords in it', async () => {
  const { service, mentor } = setup();
  mentor.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
  const result = await service.auth.register('Name', 'mentor@example.test', 'password123');
  expect(result.ok && result.data.kind).toBe('otp');
  if (!result.ok || result.data.kind !== 'otp') throw new Error('Missing challenge');
  mentor.auth.verifyOtp.mockResolvedValue({ error: null });
  expect(await service.auth.verify(result.data.challenge.id, '123456')).toEqual({ ok: true, data: { kind: 'authenticated' } });
  expect(mentor.auth.verifyOtp).toHaveBeenCalledWith({ email: 'mentor@example.test', token: '123456', type: 'email' });
  expect(await service.auth.verify(result.data.challenge.id, '123456')).toEqual({ ok: false, code: 'expired_code' });
});
it('propagates wrong-password failures without sending OTP', async () => {
  const { service, mentor } = setup(); mentor.auth.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } });
  expect(await service.auth.login('x@y.test', 'wrong')).toEqual({ ok: false, code: 'credentials' });
  expect(mentor.auth.resend).not.toHaveBeenCalled();
});
it('does not fabricate an OTP challenge for an obscured repeat signup', async () => {
  const { service, mentor } = setup();
  mentor.auth.signUp.mockResolvedValue({ data: { session: null, user: { identities: [] } }, error: null });
  expect(await service.auth.register('Name', 'mentor@example.test', 'password123')).toEqual({ ok: true, data: { kind: 'check_email' } });
  expect(mentor.auth.resend).not.toHaveBeenCalled();
});
it('returns no session for signed-out mentor and refuses anonymous mentor access', async () => {
  const { service, mentor } = setup();
  expect(await service.auth.session()).toEqual({ ok: true, data: null });
  mentor.auth.getSession.mockResolvedValue({ data: { session: {} }, error: null });
  mentor.auth.getUser.mockResolvedValue({ data: { user: { id: 'learner', is_anonymous: true } }, error: null });
  expect(await service.auth.session()).toEqual({ ok: false, code: 'unauthorized' });
  expect(mentor.from).not.toHaveBeenCalled();
});
it('uses ephemeral recovery auth, updates only after OTP, and clears recovery session', async () => {
  const { service, recovery, mentor } = setup();
  recovery.auth.verifyOtp.mockResolvedValue({ error: null }); recovery.auth.updateUser.mockResolvedValue({ error: null });
  expect(await service.auth.completePasswordReset!('x@y.test', '123456', 'new-password')).toEqual({ ok: true, data: undefined });
  expect(recovery.auth.verifyOtp).toHaveBeenCalledWith({ email: 'x@y.test', token: '123456', type: 'recovery' });
  expect(recovery.auth.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
  expect(recovery.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(mentor.auth.verifyOtp).not.toHaveBeenCalled();
});

describe('mentor profile restoration', () => {
  function authenticated() {
    const state = setup();
    state.mentor.auth.getSession.mockResolvedValue({ data: { session: {} }, error: null });
    state.mentor.auth.getUser.mockResolvedValue({ data: { user: { id: 'mentor-user', is_anonymous: false, email_confirmed_at: '2026-10-24' } }, error: null });
    const maybeSingle = jest.fn();
    const query = { select: jest.fn(), eq: jest.fn(), maybeSingle };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    state.mentor.from.mockReturnValue(query);
    return { ...state, maybeSingle };
  }
  it.each([0, 1])('fails closed when mentor profile lookup %i is empty', async index => {
    const { service, maybeSingle, mentor } = authenticated();
    if (index === 1) maybeSingle.mockResolvedValueOnce({ data: { profile_id: 'p1' }, error: null });
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    expect(await service.auth.session()).toEqual({ ok: false, code: 'mentor_profile_missing' });
    expect(maybeSingle).toHaveBeenCalledTimes(index + 1);
    expect(mentor.rpc).not.toHaveBeenCalled();
  });
  it('restores only a complete verified mentor identity', async () => {
    const { service, maybeSingle } = authenticated();
    maybeSingle.mockResolvedValueOnce({ data: { profile_id: 'p1' }, error: null });
    maybeSingle.mockResolvedValueOnce({ data: { mentor_profile_id: 'm1' }, error: null });
    expect(await service.auth.session()).toEqual({ ok: true, data: { authUserId: 'mentor-user', profileId: 'p1', mentorProfileId: 'm1' } });
  });
  it('does not disguise server failures as a missing profile', async () => {
    const { service, maybeSingle } = authenticated();
    maybeSingle.mockResolvedValueOnce({ data: null, error: { code: '42P01' } });
    expect(await service.auth.session()).toEqual({ ok: false, code: 'unavailable' });
  });
});
it('does not update a password after failed recovery verification', async () => {
  const { service, recovery } = setup(); recovery.auth.verifyOtp.mockResolvedValue({ error: { code: 'otp_expired' } });
  expect(await service.auth.completePasswordReset!('x@y.test', 'bad', 'new-password')).toEqual({ ok: false, code: 'expired_code' });
  expect(recovery.auth.updateUser).not.toHaveBeenCalled();
  expect(recovery.auth.signOut).toHaveBeenCalled();
});
it('maps safe provider failures without exposing raw messages', () => {
  expect(cloudFailure({ status: 429, message: 'private detail' })).toEqual({ ok: false, code: 'rate_limited' });
  expect(cloudFailure({ code: '42P01' })).toEqual({ ok: false, code: 'unavailable' });
  expect(cloudFailure({ code: 'P0001' })).toEqual({ ok: false, code: 'inactive' });
});
it('never replaces a bound learner identity when its session is missing', async () => {
  const { service, activeLearner, learner } = setup();
  activeLearner.mockResolvedValue({ profile_id: 'local-one', display_name: 'Learner', auth_user_id: 'original' });
  expect(await service.workspaces.join(workspace.workspace_code)).toEqual({ ok: false, code: 'learner_login_required' });
  expect(learner.auth.signInAnonymously).not.toHaveBeenCalled();
  expect(learner.rpc).not.toHaveBeenCalled();
});
it('rejects a different authenticated identity before requesting membership', async () => {
  const { service, activeLearner, learner } = setup();
  activeLearner.mockResolvedValue({ profile_id: 'local-one', auth_user_id: 'original' });
  learner.auth.getSession.mockResolvedValue({ data: { session: {} } });
  expect(await service.workspaces.join(workspace.workspace_code)).toEqual({ ok: false, code: 'account_mismatch' });
  expect(learner.rpc).not.toHaveBeenCalled();
});
it('reports disabled anonymous Auth without fabricating a membership', async () => {
  const { service, learner } = setup();
  learner.auth.signInAnonymously.mockResolvedValue({ error: { code: 'anonymous_provider_disabled' } });
  expect(await service.workspaces.requestJoin!(workspace.workspace_code)).toEqual({ ok: false, code: 'learner_auth_disabled' });
  expect(learner.rpc).not.toHaveBeenCalled();
});
const pendingRequest = { request_id: 'r1', workspace_id: 'w1', learner_profile_id: 'p1', display_name: 'Learner', workspace_name: 'Class', status: 'pending', requested_at: '2026-10-25T00:00:00Z', reviewed_at: null, reviewed_by: null };
it('submits only a code under verified learner identity, never a caller profile ID', async () => {
  const { service, learner, mentor } = setup();
  learner.rpc.mockResolvedValue({ data: { kind: 'request_submitted', request: pendingRequest } });
  const result = await service.workspaces.requestJoin!(' baya-abcdef123456 ');
  expect(result).toEqual({ ok: true, data: { kind: 'request_submitted', request: pendingRequest } });
  expect(learner.rpc).toHaveBeenCalledWith('request_workspace_join', { p_code: 'BAYA-ABCDEF123456' });
  expect(mentor.auth.signUp).not.toHaveBeenCalled();
  expect(mentor.rpc).not.toHaveBeenCalled();
});
it('checks approval receipts and does not accept approved status without an active membership', async () => {
  const { service, mentor } = setup();
  const request = { ...pendingRequest, status: 'approved', reviewed_at: '2026-10-25T01:00:00Z', reviewed_by: 'mentor' };
  mentor.rpc.mockResolvedValue({ data: { request, membership: null } });
  expect((await service.workspaces.reviewRequest!('r1', 'approved')).ok).toBe(false);
  mentor.rpc.mockResolvedValue({ data: { request, membership } });
  expect((await service.workspaces.reviewRequest!('r1', 'approved')).ok).toBe(true);
  expect(mentor.rpc).toHaveBeenCalledWith('review_workspace_join_request', { p_request_id: 'r1', p_decision: 'approved' });
});
it('does not create an anonymous identity simply to view status', async () => {
  const { service, learner } = setup();
  expect(await service.workspaces.myRequests!()).toEqual({ ok: true, data: [] });
  expect(learner.auth.signInAnonymously).not.toHaveBeenCalled();
});
it('does not show a false empty status when a bound identity has lost its session', async () => {
  const { service, activeLearner, learner } = setup();
  activeLearner.mockResolvedValue({ profile_id: 'local-one', auth_user_id: 'lost-identity' });
  expect(await service.workspaces.myRequests!()).toEqual({ ok: false, code: 'learner_login_required' });
  expect(await service.workspaces.memberships()).toEqual({ ok: false, code: 'learner_login_required' });
  expect(learner.auth.signInAnonymously).not.toHaveBeenCalled();
});
it('accepts only public credentials and fails closed when configuration is missing', () => {
  expect(readCloudConfig()).toBeNull();
  expect(readCloudConfig('https://project.supabase.co', 'sb_publishable_public')).toEqual({ url: 'https://project.supabase.co', key: 'sb_publishable_public' });
  expect(() => readCloudConfig('https://project.supabase.co', 'sb_secret_private')).toThrow();
  expect(() => readCloudConfig('http://project.supabase.co', 'sb_publishable_public')).toThrow();
  const token = `header.${btoa(JSON.stringify({ role: 'service_role' }))}.signature`;
  expect(() => readCloudConfig('https://project.supabase.co', token)).toThrow();
});
