import React, { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { CloudServicesContext, type CloudServices, type JoinRequest } from '../../../modules/cloud/services';
import { fixtureServices, joinedFixture, workspaceFixture } from './fixtures';
import { LearnerMembershipScreen } from '../../learner/LearnerWorkspaceScreens';
import { WorkspaceManageScreen } from '../../mentor/WorkspaceManageScreen';
import { WorkspaceSelectionScreen } from '../../mentor/WorkspaceScreens';

/** Explicit development-only visual fixture. Never used by production services. */
export function JoinApprovalPreview({ screen }: { screen: string }) {
  const count = screen === 'approval-mentor-24' ? 24 : screen === 'approval-mentor-10' ? 10 : screen === 'approval-mentor-3' ? 3 : 1;
  const [reviews, setReviews] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [memberAccess, setMemberAccess] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<JoinRequest['status'] | 'none'>(screen === 'approval-join' || screen === 'approval-empty' ? 'none' : screen === 'approval-approved' ? 'approved' : screen === 'approval-rejected' ? 'rejected' : 'pending');
  const services = useMemo<CloudServices>(() => {
    const workspace = { ...workspaceFixture, workspace_code: 'BAYA-FD9E06CCD69C', learnerCount: status === 'approved' ? 1 : 0, pendingCount: status === 'pending' ? 1 : 0 };
    const request: JoinRequest = { request_id: 'ba8f503e-3ef6-4f58-8287-a34eba6cf073', workspace_id: workspaceFixture.workspace_id, learner_profile_id: 'preview-learner', display_name: 'Sample Learner', workspace_name: workspaceFixture.workspace_name, status: status === 'none' ? 'pending' : status, requested_at: '2026-10-25T00:00:00Z', reviewed_at: status === 'approved' || status === 'rejected' ? '2026-10-25T01:00:00Z' : null, reviewed_by: status === 'approved' || status === 'rejected' ? 'preview-mentor' : null };
    return { ...fixtureServices, workspaces: { ...fixtureServices.workspaces,
      listOwned: async () => ({ ok: true, data: [workspace] }),
      details: async () => ({ ok: true, data: workspace }),
      myRequests: async () => screen === 'approval-error' ? { ok: false, code: 'offline' } : { ok: true, data: status === 'none' ? [] : [request] },
      memberships: async () => ({ ok: true, data: status === 'approved' ? [joinedFixture] : [] }),
      pendingRequests: async () => screen === 'approval-mentor-error' ? { ok: false, code: 'offline' } : { ok: true, data: status === 'pending' ? Array.from({ length: count }, (_, index) => ({ ...request, request_id: index ? `preview-request-${index}` : request.request_id, display_name: index ? `Sample Learner ${index + 1}` : request.display_name })).filter(item => !reviews[item.request_id]) : [] },
      members: async () => ({ ok: true, data: screen === 'approval-mentor-members' ? ['Sample Learner', 'Alexandra with a very long learner display name', 'Sample Learner 3'].map((displayName, i) => ({ profileId: `preview-member-${i}`, displayName, active: memberAccess[`preview-member-${i}`] ?? true })) : status === 'approved' ? [{ profileId: 'preview-learner', displayName: 'Sample Learner', active: true }] : [] }),
      setMemberActive: async (_workspaceId, profileId, active) => { setMemberAccess(previous => ({ ...previous, [profileId]: active })); return { ok: true, data: undefined }; },
      requestJoin: async () => {
        if (screen === 'approval-error') return { ok: false, code: 'offline' };
        if (status === 'approved') return { ok: true, data: { kind: 'already_member', joined: joinedFixture } };
        setStatus('pending');
        return { ok: true, data: { kind: status === 'pending' ? 'already_pending' : 'request_submitted', request: { ...request, status: 'pending' } } };
      },
      reviewRequest: async (id, decision) => { if (count === 1) setStatus(decision); else setReviews(previous => ({ ...previous, [id]: decision })); return { ok: true, data: { ...request, request_id: id, status: decision } }; },
    } };
  }, [status, screen, count, reviews, memberAccess]);
  return <CloudServicesContext.Provider value={services}>
    <Text style={{ backgroundColor: '#fff1b8', textAlign: 'center', padding: 6 }}>DEVELOPMENT PREVIEW · TEST DATA ONLY</Text>
    {screen === 'approval-selection' ? <WorkspaceSelectionScreen /> : screen.startsWith('approval-mentor') || screen === 'approval-empty' ? <WorkspaceManageScreen id={workspaceFixture.workspace_id} /> : <LearnerMembershipScreen />}
  </CloudServicesContext.Provider>;
}
