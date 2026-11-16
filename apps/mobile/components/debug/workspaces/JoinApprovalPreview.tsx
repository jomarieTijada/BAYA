import React, { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { CloudServicesContext, type CloudServices, type JoinRequest } from '../../../modules/cloud/services';
import { fixtureServices, joinedFixture, workspaceFixture } from './fixtures';
import { LearnerMembershipScreen } from '../../learner/LearnerWorkspaceScreens';
import { WorkspaceManageScreen } from '../../mentor/WorkspaceManageScreen';
import { WorkspaceSelectionScreen } from '../../mentor/WorkspaceScreens';

/** Explicit development-only visual fixture. Never used by production services. */
export function JoinApprovalPreview({ screen }: { screen: string }) {
  let count;
  if (screen === 'approval-mentor-24') {
    count = 24;
  } else {
    if (screen === 'approval-mentor-10') {
      count = 10;
    } else {
      if (screen === 'approval-mentor-3') {
        count = 3;
      } else {
        count = 1;
      }
    }
  }
  const [reviews, setReviews] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [memberAccess, setMemberAccess] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<JoinRequest['status'] | 'none'>((() => {
    if (screen === 'approval-join' || screen === 'approval-empty') {
      return 'none';
    } else {
      if (screen === 'approval-approved') {
        return 'approved';
      } else {
        if (screen === 'approval-rejected') {
          return 'rejected';
        } else {
          return 'pending';
        }
      }
    }
  })());
  const services = useMemo<CloudServices>(() => {
    const workspace = { ...workspaceFixture, workspace_code: 'BAYA-FD9E06CCD69C', learnerCount: (() => {
      if (status === 'approved') {
        return 1;
      } else {
        return 0;
      }
    })(), pendingCount: (() => {
      if (status === 'pending') {
        return 1;
      } else {
        return 0;
      }
    })() };
    const request: JoinRequest = { request_id: 'ba8f503e-3ef6-4f58-8287-a34eba6cf073', workspace_id: workspaceFixture.workspace_id, learner_profile_id: 'preview-learner', display_name: 'Sample Learner', workspace_name: workspaceFixture.workspace_name, status: (() => {
      if (status === 'none') {
        return 'pending';
      } else {
        return status;
      }
    })(), requested_at: '2026-10-25T00:00:00Z', reviewed_at: (() => {
      if (status === 'approved' || status === 'rejected') {
        return '2026-10-25T01:00:00Z';
      } else {
        return null;
      }
    })(), reviewed_by: (() => {
      if (status === 'approved' || status === 'rejected') {
        return 'preview-mentor';
      } else {
        return null;
      }
    })() };
    return { ...fixtureServices, workspaces: { ...fixtureServices.workspaces,
      listOwned: async () => ({ ok: true, data: [workspace] }),
      details: async () => ({ ok: true, data: workspace }),
      myRequests: async () => {
        if (screen === 'approval-error') {
          return { ok: false, code: 'offline' };
        } else {
          return { ok: true, data: (() => {
        if (status === 'none') {
          return [];
        } else {
          return [request];
        }
      })() };
        }
      },
      memberships: async () => ({ ok: true, data: (() => {
        if (status === 'approved') {
          return [joinedFixture];
        } else {
          return [];
        }
      })() }),
      pendingRequests: async () => {
        if (screen === 'approval-mentor-error') {
          return { ok: false, code: 'offline' };
        } else {
          return { ok: true, data: (() => {
        if (status === 'pending') {
          return Array.from({ length: count }, (_, index) => ({ ...request, request_id: (() => {
        if (index) {
          return `preview-request-${index}`;
        } else {
          return request.request_id;
        }
      })(), display_name: (() => {
        if (index) {
          return `Sample Learner ${index + 1}`;
        } else {
          return request.display_name;
        }
      })() })).filter(item => !reviews[item.request_id]);
        } else {
          return [];
        }
      })() };
        }
      },
      members: async () => ({ ok: true, data: (() => {
        if (screen === 'approval-mentor-members') {
          return ['Sample Learner', 'Alexandra with a very long learner display name', 'Sample Learner 3'].map((displayName, i) => ({ profileId: `preview-member-${i}`, displayName, active: memberAccess[`preview-member-${i}`] ?? true }));
        } else {
          if (status === 'approved') {
            return [{ profileId: 'preview-learner', displayName: 'Sample Learner', active: true }];
          } else {
            return [];
          }
        }
      })() }),
      setMemberActive: async (_workspaceId, profileId, active) => { setMemberAccess(previous => ({ ...previous, [profileId]: active })); return { ok: true, data: undefined }; },
      requestJoin: async () => {
        if (screen === 'approval-error') return { ok: false, code: 'offline' };
        if (status === 'approved') return { ok: true, data: { kind: 'already_member', joined: joinedFixture } };
        setStatus('pending');
        return { ok: true, data: { kind: (() => {
          if (status === 'pending') {
            return 'already_pending';
          } else {
            return 'request_submitted';
          }
        })(), request: { ...request, status: 'pending' } } };
      },
      reviewRequest: async (id, decision) => { if (count === 1) setStatus(decision); else setReviews(previous => ({ ...previous, [id]: decision })); return { ok: true, data: { ...request, request_id: id, status: decision } }; },
    } };
  }, [status, screen, count, reviews, memberAccess]);
  return <CloudServicesContext.Provider value={services}>
    <Text style={{ backgroundColor: '#fff1b8', textAlign: 'center', padding: 6 }}>DEVELOPMENT PREVIEW · TEST DATA ONLY</Text>
    {(() => {
      if (screen === 'approval-selection') {
        return <WorkspaceSelectionScreen />;
      } else {
        if (screen.startsWith('approval-mentor') || screen === 'approval-empty') {
          return <WorkspaceManageScreen id={workspaceFixture.workspace_id} />;
        } else {
          return <LearnerMembershipScreen />;
        }
      }
    })()}
  </CloudServicesContext.Provider>;
}
