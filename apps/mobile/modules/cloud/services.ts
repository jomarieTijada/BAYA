import { createContext, useContext } from 'react';
import type { Workspace, WorkspaceMembership } from '../../database/types';
import type { ProgressServices } from '../progress/contracts';

export type FailureCode =
  | 'unavailable'
  | 'learner_auth_disabled'
  | 'already_processed'
  | 'offline'
  | 'unauthorized'
  | 'credentials'
  | 'exists'
  | 'invalid_code'
  | 'expired_code'
  | 'not_found'
  | 'inactive'
  | 'conflict'
  | 'rate_limited'
  | 'weak_password'
  | 'learner_required'
  | 'mentor_profile_missing'
  | 'learner_login_required'
  | 'account_mismatch'
  | 'incompatible_progress'
  | 'network';
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; code: FailureCode };
export type MentorSession = {
  authUserId: string;
  /** The mentor's own PROFILES row, never a learner membership identity. */
  profileId: string;
  mentorProfileId: string;
};
export type Challenge = { id: string; email: string };
export type AuthOutcome =
  | { kind: 'authenticated' }
  | { kind: 'otp'; challenge: Challenge }
  | { kind: 'check_email' };
export type WorkspaceSummary = Workspace & {
  learnerCount?: number;
  pendingCount?: number;
  lastSyncedAt?: string;
};
export type JoinedWorkspace = {
  workspace: WorkspaceSummary;
  membership: Omit<WorkspaceMembership, 'is_active'> & { is_active: boolean };
  alreadyJoined: boolean;
};
export type WorkspaceMember = { profileId: string; displayName: string; active: boolean };
export type JoinRequest = {
  request_id: string; workspace_id: string; learner_profile_id: string;
  display_name: string; workspace_name: string;
  status: 'pending' | 'approved' | 'rejected'; requested_at: string;
  reviewed_at: string | null; reviewed_by: string | null;
};
export type JoinRequestOutcome =
  | { kind: 'request_submitted' | 'already_pending'; request: JoinRequest }
  | { kind: 'already_member'; joined: JoinedWorkspace };
export type LearnerCloudSession = { email: string; profileId: string };
/** Adapters must resolve identity from their authenticated session, never from caller-supplied profile IDs. */
export interface CloudServices {
  learnerAuth?: {
    session(): Promise<Result<LearnerCloudSession | null>>;
    request(email: string): Promise<Result<Challenge>>;
    verify(id: string, code: string): Promise<Result<LearnerCloudSession>>;
    signOut(): Promise<Result<void>>;
  };
  progress: ProgressServices;
  policy: {
    passwordError?: (password: string) => string | undefined;
    workspaceNameError?: (name: string) => string | undefined;
    workspaceCodeError?: (code: string) => string | undefined;
  };
  auth: {
    session(): Promise<Result<MentorSession | null>>;
    login(email: string, password: string): Promise<Result<AuthOutcome>>;
    register(
      name: string,
      email: string,
      password: string,
    ): Promise<Result<AuthOutcome>>;
    verify(challengeId: string, code: string): Promise<Result<AuthOutcome>>;
    resend(challengeId: string): Promise<Result<Challenge>>;
    resetPassword(email: string): Promise<Result<void>>;
    completePasswordReset?(email: string, code: string, password: string): Promise<Result<void>>;
    signOut?(): Promise<Result<void>>;
  };
  workspaces: {
    requestJoin?(code: string): Promise<Result<JoinRequestOutcome>>;
    myRequests?(): Promise<Result<JoinRequest[]>>;
    pendingRequests?(id: string): Promise<Result<JoinRequest[]>>;
    reviewRequest?(id: string, decision: 'approved' | 'rejected'): Promise<Result<JoinRequest>>;
    update?(id: string, name: string, status: 'active' | 'archived'): Promise<Result<WorkspaceSummary>>;
    members?(id: string): Promise<Result<WorkspaceMember[]>>;
    setMemberActive?(id: string, profileId: string, active: boolean): Promise<Result<void>>;
    listOwned(): Promise<Result<WorkspaceSummary[]>>;
    create(name: string): Promise<Result<WorkspaceSummary>>;
    details(workspaceId: string): Promise<Result<WorkspaceSummary>>;
    join(code: string): Promise<Result<JoinedWorkspace>>;
    memberships(): Promise<Result<JoinedWorkspace[]>>;
  };
}
const unavailable = async (): Promise<{ ok: false; code: 'unavailable' }> => ({
  ok: false,
  code: 'unavailable',
});
/** Deliberately no fake session, persistence, codes, or success responses. */
export const pendingCloudServices: CloudServices = {
  progress: { sync: unavailable, dashboard: unavailable, learner: unavailable },
  policy: {},
  auth: {
    session: unavailable,
    login: unavailable,
    register: unavailable,
    verify: unavailable,
    resend: unavailable,
    resetPassword: unavailable,
  },
  workspaces: {
    requestJoin: unavailable,
    myRequests: unavailable,
    pendingRequests: unavailable,
    reviewRequest: unavailable,
    listOwned: unavailable,
    create: unavailable,
    details: unavailable,
    join: unavailable,
    memberships: unavailable,
  },
};
export const CloudServicesContext =
  createContext<CloudServices>(pendingCloudServices);
export const useCloudServices = () => useContext(CloudServicesContext);
export const failureMessage: Record<FailureCode, string> = {
  learner_auth_disabled: 'Joining is not ready yet. Ask your mentor for help. You can keep learning.',
  already_processed: 'This request has already been reviewed. Refresh to see its current status.',
  unavailable:
    'Online workspace services are not available yet. Please try again later.',
  offline: 'You’re offline. Connect to the internet and try again.',
  unauthorized:
    'Please log in again to continue. Your session may have expired.',
  credentials: 'The email or password is incorrect. Please try again.',
  exists: 'This account may already exist. Try logging in.',
  invalid_code: 'That code is not valid. Check it and try again.',
  expired_code: 'That code has expired. Request a new code.',
  not_found:
    'We couldn’t find that workspace. Check the code with your mentor.',
  inactive: 'This workspace is no longer active. Ask your mentor for help.',
  conflict: 'The workspace could not be created. Please try again.',
  rate_limited: 'Too many requests. Please wait a moment before trying again.',
  weak_password: 'Choose a stronger password with at least 8 characters.',
  learner_required: 'Choose or create your learner profile before joining a workspace.',
  mentor_profile_missing: 'This account does not have an accessible mentor profile. Sign in with your mentor account. If this is your mentor account, ask the administrator to check its profile setup.',
  learner_login_required: 'We couldn’t verify this learner’s saved cloud identity. Ask your mentor for help. Your learning is still saved on this device.',
  account_mismatch: 'This device profile is linked to a different learner identity. Restore the original learner account to continue.',
  incompatible_progress: 'This progress could not be synchronized. Update the app or ask your mentor for help. Your learning is still saved on this device.',
  network: 'We couldn’t connect. Please try again.',
};
