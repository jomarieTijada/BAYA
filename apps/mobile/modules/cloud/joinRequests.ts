import type { JoinRequest } from './services';

/** Reject malformed receipts rather than infer that membership was approved. */
export function parseJoinRequest(value: unknown): JoinRequest {
  const r = value as JoinRequest | null;
  if (!r || !['pending', 'approved', 'rejected'].includes(r.status)
    || ![r.request_id, r.workspace_id, r.learner_profile_id, r.display_name, r.workspace_name].every(v => typeof v === 'string' && v.length > 0)
    || !Number.isFinite(Date.parse(r.requested_at))
    || (r.status === 'pending' ? r.reviewed_at !== null || r.reviewed_by !== null
      : !r.reviewed_at || !Number.isFinite(Date.parse(r.reviewed_at)) || typeof r.reviewed_by !== 'string')) {
    throw new Error('Invalid join request receipt');
  }
  return r;
}
