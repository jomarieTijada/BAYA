import { verifyLearnerIdentity } from './learnerIdentity';
import { parseJoinRequest } from './joinRequests';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createLearnerEmailAuth, type LocalCloudIdentity } from './learnerEmailAuth';
import { createProgressServices } from '../progress/supabaseProgress';
import type { ProgressSnapshot } from '../progress/contracts';
import type { CloudServices, Result, FailureCode, WorkspaceSummary, JoinedWorkspace, AuthOutcome, JoinRequestOutcome } from './services';

type LearnerIdentity = LocalCloudIdentity;
type Dependencies = {
  mentor: SupabaseClient;
  learnerClient: (localId: string) => SupabaseClient;
  recoveryClient: () => SupabaseClient;
  activeLearner: () => Promise<LearnerIdentity | null>;
  bindLearner?: (localId: string, userId: string) => Promise<void>;
  progressSnapshot?: () => Promise<ProgressSnapshot>;
};
const ok = <T>(data: T): Result<T> => ({ ok: true, data });
export function cloudFailure(error: unknown): { ok: false; code: FailureCode } {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, code: 'offline' };
  const e = error as { code?: string; message?: string; status?: number } | null;
  const codes: Record<string, FailureCode> = {
    '42501': 'unauthorized', 'P0002': 'not_found', 'P0001': 'inactive',
    '22023': 'invalid_code', '23505': 'conflict', invalid_credentials: 'credentials',
    otp_expired: 'expired_code', user_already_exists: 'exists',
    session_not_found: 'unauthorized', refresh_token_not_found: 'unauthorized',
    anonymous_provider_disabled: 'learner_auth_disabled', signup_disabled: 'learner_auth_disabled',
    '40001': 'already_processed',
    '42P01': 'unavailable', PGRST202: 'unavailable',
    weak_password: 'weak_password', over_email_send_rate_limit: 'rate_limited',
    over_request_rate_limit: 'rate_limited', over_sms_send_rate_limit: 'rate_limited',
    unavailable: 'unavailable', learner_required: 'learner_required',
    mentor_profile_missing: 'mentor_profile_missing', PGRST116: 'unavailable',
    learner_login_required: 'learner_login_required', account_mismatch: 'account_mismatch',
  };
  return { ok: false, code: codes[e?.code ?? ''] ?? (e?.status === 429 ? 'rate_limited' : e?.status === 401 ? 'unauthorized' : 'network') };
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid cloud response');
  return value as Record<string, unknown>;
}
function field(row: Record<string, unknown>, name: string): string {
  if (typeof row[name] !== 'string') throw new Error('Invalid cloud response');
  return row[name];
}
export function parseWorkspace(value: unknown): WorkspaceSummary {
  const row = object(value);
  return {
    workspace_id: field(row, 'workspace_id'), mentor_profile_id: field(row, 'mentor_profile_id'),
    workspace_code: field(row, 'workspace_code'), workspace_name: field(row, 'workspace_name'),
    status: field(row, 'status'), created_at: field(row, 'created_at'),
    ...(typeof row.learnerCount === 'number' ? { learnerCount: row.learnerCount } : {}),
    ...(typeof row.pendingCount === 'number' ? { pendingCount: row.pendingCount } : {}),
  };
}
function joined(value: unknown): JoinedWorkspace {
  const row = object(value); const m = object(row.membership);
  if (typeof m.is_active !== 'boolean' || typeof row.alreadyJoined !== 'boolean') throw new Error('Invalid membership');
  return { workspace: parseWorkspace(row.workspace), alreadyJoined: row.alreadyJoined,
    membership: { membership_id: field(m, 'membership_id'), learner_profile_id: field(m, 'learner_profile_id'),
      workspace_id: field(m, 'workspace_id'), joined_at: field(m, 'joined_at'),
      last_synced_at: m.last_synced_at === null ? null : field(m, 'last_synced_at'), is_active: m.is_active } };
}
function array<T>(value: unknown, parse: (v: unknown) => T): T[] {
  if (!Array.isArray(value)) throw new Error('Invalid cloud list');
  return value.map(parse);
}
async function attempt<T>(operation: () => Promise<T>): Promise<Result<T>> {
  try { return ok(await operation()); } catch (e) { return cloudFailure(e); }
}

export function createSupabaseServices({ mentor, learnerClient, recoveryClient, activeLearner, progressSnapshot, bindLearner }: Dependencies): CloudServices {
  const challenges = new Map<string, string>();
  const learnerAuth = createLearnerEmailAuth({ clientFor: learnerClient, activeLearner, bind: bindLearner ?? (async () => { throw { code: 'unavailable' }; }), failure: cloudFailure });
  let sequence = 0;
  function challenge(email: string): AuthOutcome {
    const id = `signup-${++sequence}`;
    challenges.set(id, email);
    return { kind: 'otp', challenge: { id, email } };
  }
  async function rpc<T>(client: SupabaseClient, name: string, args: Record<string, unknown>, parse: (v: unknown) => T) {
    const { data, error } = await client.rpc(name, args);
    if (error) throw error;
    return parse(data);
  }
  const identityRequests = new Map<string, Promise<SupabaseClient | null>>();
  // Resolving a local identity never authorizes a cloud row. Only its separate Auth session does.
  async function learner(create: boolean): Promise<SupabaseClient | null> {
    const identity = await activeLearner();
    if (!identity) { if (!create) return null; throw { code: 'learner_required' }; }
    const key = `${identity.profile_id}:${create}`;
    const existing = identityRequests.get(key);
    if (existing) return existing;
    const task = (async () => {
      const client = learnerClient(identity.profile_id);
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) {
        // Never replace a lost identity: doing so would orphan existing memberships.
        if (identity.auth_user_id) throw { code: 'learner_login_required' };
        if (!create) return null;
        const created = await client.auth.signInAnonymously({ options: { data: { display_name: identity.display_name, account_type: 'learner' } } });
        if (created.error) throw created.error;
        if (!created.data.session) throw { code: 'learner_login_required' };
      }
      await verifyLearnerIdentity(client, identity, bindLearner ?? (async () => { throw { code: 'unavailable' }; }));
      return client;
    })().finally(() => identityRequests.delete(key));
    identityRequests.set(key, task);
    return task;
  }
  return {
    learnerAuth,
    progress: createProgressServices({ mentor, learnerClient, snapshot: progressSnapshot ?? (async () => { throw { code: 'PGRST202' }; }), failure: cloudFailure }),
    policy: {
      passwordError: p => p.length < 8 ? 'Use at least 8 characters.' : undefined,
      workspaceNameError: n => n.length > 100 ? 'Use 100 characters or fewer.' : undefined,
      workspaceCodeError: c => /^BAYA-[A-F0-9]{12}$/.test(c) ? undefined : 'Enter the full workspace code from your mentor.',
    },
    auth: {
      session: () => attempt(async () => {
        const existing = await mentor.auth.getSession();
        if (existing.error) throw existing.error;
        if (!existing.data.session) return null;
        const { data, error } = await mentor.auth.getUser();
        if (error) throw error;
        if (!data.user || data.user.is_anonymous || !data.user.email_confirmed_at) throw { code: '42501' };
        // Missing/invisible profiles are an account setup failure, not a network
        // outage. Optional reads avoid a singular-response 406 for zero rows.
        const profile = await mentor.from('profiles').select('profile_id').eq('auth_user_id', data.user.id).eq('role', 'mentor').maybeSingle();
        if (profile.error) throw profile.error;
        if (!profile.data) throw { code: 'mentor_profile_missing' };
        const own = await mentor.from('mentor_profiles').select('mentor_profile_id').eq('profile_id', profile.data.profile_id).maybeSingle();
        if (own.error) throw own.error;
        if (!own.data) throw { code: 'mentor_profile_missing' };
        return { authUserId: data.user.id, profileId: field(object(profile.data), 'profile_id'), mentorProfileId: field(object(own.data), 'mentor_profile_id') };
      }),
      login: (email, password) => attempt(async () => {
        const { error } = await mentor.auth.signInWithPassword({ email, password });
        if (error?.code === 'email_not_confirmed') {
          const resent = await mentor.auth.resend({ type: 'signup', email });
          if (resent.error) throw resent.error;
          return challenge(email);
        }
        if (error) throw error;
        return { kind: 'authenticated' as const };
      }),
      register: (name, email, password) => attempt(async () => {
        const { data, error } = await mentor.auth.signUp({ email, password, options: { data: { display_name: name } } });
        if (error) throw error;
        if (data.session) return { kind: 'authenticated' as const };
        // Auth can deliberately obscure a repeated signup. Such a response
        // is not evidence that a new verification email was requested.
        if (data.user?.identities?.length === 0) return { kind: 'check_email' as const };
        return challenge(email);
      }),
      verify: (id, code) => attempt(async () => {
        const email = challenges.get(id);
        if (!email) throw { code: 'otp_expired' };
        const { error } = await mentor.auth.verifyOtp({ email, token: code, type: 'email' });
        if (error) throw error;
        challenges.delete(id);
        return { kind: 'authenticated' as const };
      }),
      resend: id => attempt(async () => {
        const email = challenges.get(id);
        if (!email) throw { code: 'otp_expired' };
        const { error } = await mentor.auth.resend({ type: 'signup', email });
        if (error) throw error;
        return { id, email };
      }),
      resetPassword: email => attempt(async () => {
        const { error } = await mentor.auth.resetPasswordForEmail(email);
        if (error) throw error;
      }),
      completePasswordReset: (email, code, password) => attempt(async () => {
        // Recovery session is ephemeral and cannot replace the mentor's stored session.
        const client = recoveryClient();
        try {
          const verified = await client.auth.verifyOtp({ email, token: code, type: 'recovery' });
          if (verified.error) throw verified.error;
          const updated = await client.auth.updateUser({ password });
          if (updated.error) throw updated.error;
        } finally { await client.auth.signOut({ scope: 'local' }); }
      }),
      signOut: () => attempt(async () => {
        const { error } = await mentor.auth.signOut({ scope: 'local' });
        if (error) throw error;
      }),
    },
    workspaces: {
      requestJoin: code => attempt(async (): Promise<JoinRequestOutcome> => rpc((await learner(true))!, 'request_workspace_join', { p_code: code.trim().toUpperCase() }, value => {
        const r = object(value);
        if (r.kind === 'already_member') {
          const member = joined(r.joined);
          if (!member.membership.is_active || member.workspace.status !== 'active') throw new Error('Inactive membership receipt');
          return { kind: r.kind, joined: member };
        }
        if (r.kind !== 'request_submitted' && r.kind !== 'already_pending') throw new Error('Invalid request outcome');
        const request = parseJoinRequest(r.request);
        if (request.status !== 'pending') throw new Error('Invalid pending receipt');
        return { kind: r.kind, request };
      })),
      myRequests: () => attempt(async () => {
        const client = await learner(false);
        return client ? rpc(client, 'list_my_join_requests', {}, v => array(v, parseJoinRequest)) : [];
      }),
      pendingRequests: id => attempt(() => rpc(mentor, 'list_workspace_join_requests', { p_workspace_id: id }, v => array(v, parseJoinRequest))),
      reviewRequest: (id, decision) => attempt(() => rpc(mentor, 'review_workspace_join_request', { p_request_id: id, p_decision: decision }, v => {
        const row = object(v); const request = parseJoinRequest(row.request);
        if (request.status !== decision) throw new Error('Invalid review receipt');
        if (decision === 'approved') {
          const m = object(row.membership);
          if (m.is_active !== true || m.learner_profile_id !== request.learner_profile_id || m.workspace_id !== request.workspace_id) throw new Error('Missing approved membership');
        }
        return request;
      })),
      update: (id, name, status) => attempt(() => rpc(mentor, 'update_workspace', { p_workspace_id: id, p_name: name.trim(), p_status: status }, parseWorkspace)),
      members: id => attempt(() => rpc(mentor, 'list_workspace_members', { p_workspace_id: id }, v => array(v, item => {
        const row = object(item);
        if (typeof row.active !== 'boolean') throw new Error('Invalid member');
        return { profileId: field(row, 'profileId'), displayName: field(row, 'displayName'), active: row.active };
      }))),
      setMemberActive: (id, profileId, active) => attempt(() => rpc(mentor, 'set_workspace_member_active', { p_workspace_id: id, p_profile_id: profileId, p_active: active }, () => undefined)),
      listOwned: () => attempt(() => rpc(mentor, 'list_owned_workspaces', {}, v => array(v, parseWorkspace))),
      create: name => attempt(() => rpc(mentor, 'create_workspace', { p_name: name.trim() }, parseWorkspace)),
      details: id => attempt(() => rpc(mentor, 'get_workspace_details', { p_workspace_id: id }, parseWorkspace)),
      join: code => attempt(async () => rpc((await learner(true))!, 'join_workspace', { p_code: code.trim().toUpperCase() }, joined)),
      memberships: () => attempt(async () => {
        const client = await learner(false);
        return client ? rpc(client, 'list_my_memberships', {}, v => array(v, joined)) : [];
      }),
    },
  };
}
