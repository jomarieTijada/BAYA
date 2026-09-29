import { createActivityContentService } from '../services/activityContentService';
import type { ContentRecord } from '../repositories/activityContentRepository';
const payload = { id: 'topic-1-1', moduleId: 'module-1', title: 'Original title', moduleTitle: 'Original module', steps: [{ id: 's1', title: 'Story', type: 'story', content: { title: 'Reviewed story', content: 'Reviewed text' } }] };
const row: ContentRecord = { activity_id: 'topic-1-1', revision: 1, validation_status: 'approved', reviewed_by: 'validator-1', reviewed_at: '2026-09-01T00:00:00Z', payload_json: JSON.stringify(payload) };
const service = (value: ContentRecord | null) => createActivityContentService({ getByTopicId: async () => value });
describe('Reviewed activity delivery', () => {
  it('loads approved data and derives title/position from the approved manifest', async () => {
    expect(await service(row).getByTopicId('topic-1-1')).toMatchObject({ id: 'topic-1-1', moduleTitle: 'Pagkilala sa Baybayin', title: 'Ang Kasaysayan at Kahalagahan', totalActivitiesInModule: 5 });
  });
  it.each([null, { ...row, validation_status: 'draft' }, { ...row, reviewed_by: null }, { ...row, reviewed_at: 'invalid' }, { ...row, revision: 0 }, { ...row, payload_json: '{oops' }, { ...row, payload_json: JSON.stringify({ ...payload, moduleId: 'module-other' }) }])('falls back for absent, unreviewed or malformed records', async value => expect(await service(value).getByTopicId('topic-1-1')).toBeNull());
  it('handles an offline source without throwing', async () => {
    const offline = createActivityContentService({ getByTopicId: async () => { throw new Error('offline'); } });
    expect(await offline.getByTopicId('topic-1-1')).toBeNull();
  });
  it('does not query a source for an unapproved topic', async () => {
    const getByTopicId = jest.fn();
    expect(await createActivityContentService({ getByTopicId }).getByTopicId('unapproved')).toBeNull();
    expect(getByTopicId).not.toHaveBeenCalled();
  });
});
