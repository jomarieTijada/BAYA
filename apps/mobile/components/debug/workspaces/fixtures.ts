import {
  pendingCloudServices,
  type CloudServices,
  type WorkspaceSummary,
  type JoinedWorkspace,
} from '../../../modules/cloud/services';
export const workspaceFixture: WorkspaceSummary = {
  workspace_id: '4ea0b7f8-1d5d-4cc5-b659-a9e75b9b2708',
  mentor_profile_id: 'test-mentor',
  workspace_name: 'Baybayin Workshop A',
  workspace_code: 'BAYA-7K2P',
  status: 'active',
  created_at: '2026-10-20T00:00:00Z',
  learnerCount: 3,
};
export const joinedFixture: JoinedWorkspace = {
  workspace: workspaceFixture,
  alreadyJoined: false,
  membership: {
    membership_id: 'test-membership',
    learner_profile_id: 'test-learner',
    workspace_id: workspaceFixture.workspace_id,
    joined_at: '2026-10-20T00:00:00Z',
    last_synced_at: null,
    is_active: true,
  },
};
export const fixtureServices: CloudServices = {
  ...pendingCloudServices,
  learnerAuth: {
    session: async () => ({ ok: true, data: {email:'learner@example.test',profileId:'test-learner'} }),
    request: async email => ({ok:true,data:{id:'test-learner-code',email}}),
    verify: async () => ({ok:true,data:{email:'learner@example.test',profileId:'test-learner'}}),
    signOut: async () => ({ok:true,data:undefined}),
  },
  auth: {
    ...pendingCloudServices.auth,
    session: async () => ({
      ok: true,
      data: {
        authUserId: 'test-auth',
        profileId: 'test-profile',
        mentorProfileId: 'test-mentor',
      },
    }),
    login: async () => ({
      ok: true,
      data: {
        kind: 'otp',
        challenge: { id: 'test-challenge', email: 'mentor@example.test' },
      },
    }),
    verify: async () => ({ ok: true, data: { kind: 'authenticated' } }),
  },
  workspaces: {
    listOwned: async () => ({
      ok: true,
      data: [
        workspaceFixture,
        {
          ...workspaceFixture,
          workspace_id: '585927c3-2cf7-4d76-96a8-489fab1314cc',
          workspace_name: 'Beginner Baybayin Group',
          workspace_code: 'BAYA-4M8Q',
          learnerCount: 8,
        },
      ],
    }),
    create: async () => ({ ok: true, data: workspaceFixture }),
    details: async () => ({ ok: true, data: workspaceFixture }),
    join: async () => ({ ok: true, data: joinedFixture }),
    memberships: async () => ({ ok: true, data: [joinedFixture] }),
  },
};
