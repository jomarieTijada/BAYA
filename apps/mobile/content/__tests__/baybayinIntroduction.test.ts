import { getApprovedStorybookActivity } from '../approvedStorybook';
import { baybayinHistoryContent, baybayinHistoryReference, baybayinVideoCredit, baybayinVideoIntroduction } from '../baybayinIntroduction';
import { topic11Steps, topic11ActivityData } from '../topics/topic-1-1';
import { parseActivity } from '../parseActivity';

it('shares one invitation, historical paragraph and source across live and preview data', () => {
  const live = getApprovedStorybookActivity('topic-1-1')!;
  expect(live.video.introduction).toBe(baybayinVideoIntroduction);
  expect(topic11ActivityData.video.introduction).toBe(baybayinVideoIntroduction);
  expect(topic11Steps[0].content).toMatchObject({ introduction: baybayinVideoIntroduction });
  for (const content of [live.steps[0].content, topic11Steps[1].content]) {
    expect(content).toMatchObject(baybayinHistoryContent);
    expect(content).toHaveProperty('reference', baybayinHistoryReference);
    expect(JSON.stringify(content)).not.toMatch(/Pinagmulan ng Baybayin|Saan nagmula ang Baybayin|nagmula ang Baybayin/i);
  }
  expect(topic11Steps.map(step => [step.id, step.type])).toEqual([
    ['topic-1-1-step-1', 'video'], ['topic-1-1-step-2', 'slide'], ['topic-1-1-step-3', 'slide'],
    ['topic-1-1-step-4', 'slide'], ['topic-1-1-step-5', 'slide'],
  ]);
});

it('retains validated invitation/source metadata when content is serialized and parsed', () => {
  const parsed = parseActivity(JSON.parse(JSON.stringify(topic11ActivityData)));
  expect(parsed?.steps[0].content).toMatchObject({ introduction: baybayinVideoIntroduction });
  expect(parsed?.steps[0].content).toMatchObject({ credit: baybayinVideoCredit });
  expect(parsed?.steps[1].content).toMatchObject({ reference: baybayinHistoryReference });
  expect(parsed?.steps[1].content).toMatchObject({ videoCredit: baybayinVideoCredit });
});

it.each(['javascript:alert(1)', 'http://ncca.gov.ph/article', 'https://ncca.gov.ph.evil.test/article'])('rejects an invalid reference URL %s at the content boundary', url => {
  const payload = JSON.parse(JSON.stringify(topic11ActivityData));
  payload.steps[1].content.reference.url = url;
  expect(parseActivity(payload)).toBeNull();
});
