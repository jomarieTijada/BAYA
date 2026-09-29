import { approvedCurriculum } from '../../../../content/approvedCurriculum';
import { getApprovedStorybookActivity } from '../../../../content/approvedStorybook';

describe('Split Topic 1.3 storybook content', () => {
  it('registers the three approved stories as separate topics in sequence', () => {
    expect(approvedCurriculum[0].topics.slice(2)).toEqual([
      { id: 'topic-1-3', title: 'Ang 17 Simbolo ng Baybayin' },
      { id: 'topic-1-4', title: 'Magkaibang Letra, Iisang Simbolo?' },
      { id: 'topic-1-5', title: 'Paano naman ang Da at Ra?' },
    ]);
    for (const topic of approvedCurriculum[0].topics.slice(2)) {
      const activity = getApprovedStorybookActivity(topic.id);
      expect(activity?.title).toBe(topic.title);
      expect(activity?.steps).toHaveLength(1);
      expect(activity?.steps[0].content).not.toHaveProperty('illustration');
    }
  });
});
