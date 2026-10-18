import { approvedCurriculum } from '../../../../content/approvedCurriculum';
import { createApprovedModules, defaultLessons, defaultModules, getLessonProgress } from '../lessonData';

const expected = [{
  id: 'module-1', title: 'Pagkilala sa Baybayin', topics: [
    { id: 'topic-1-1', title: 'Kasaysayan at Kahalagahan ng Baybayin' },
    { id: 'topic-1-2', title: 'Baybayin: Isang Silabaryo (Pantigan)' },
    { id: 'topic-1-3', title: 'Ang 17 Simbolo ng Baybayin' },
    { id: 'topic-1-4', title: 'Magkaibang Letra, Iisang Simbolo?' },
    { id: 'topic-1-5', title: 'Paano naman ang Da at Ra?' },
  ],
}, {
  id: 'module-2', title: 'Baybayin Characters', topics: [
    { id: 'topic-2-1', title: 'Ang mga Patinig' },
    { id: 'topic-2-2', title: 'Kilalanin ang mga Katinig' },
  ],
}, {
  id: 'module-3', title: 'Pagsusulat ng Baybayin', topics: [
    { id: 'topic-3-1', title: 'Mga Patinig' },
    { id: 'topic-3-2', title: 'Mga Katinig' },
  ],
}];
const structure = (modules: typeof defaultModules) => modules.map(({ id, title, topics }) => ({
  id, title, topics: topics.map(({ id, title }) => ({ id, title })),
}));

describe('Validator-approved curriculum', () => {
  it('contains all three supplied modules and their exact topic titles', () => {
    expect(approvedCurriculum).toEqual(expected);
    expect(structure(defaultLessons)).toEqual(expected);
    expect(structure(createApprovedModules())).toEqual(expected);
  });
  it('has no generated descriptions, materials, placeholder URLs or extra topics', () => {
    for (const module of defaultModules) {
      expect(module.purpose).toBeUndefined();
      expect(module.subtitle).toBeUndefined();
      for (const topic of module.topics) {
        expect(topic.purpose).toBeUndefined();
        expect(topic.learningPoints).toBeUndefined();
        expect(topic.videoSource).toBeUndefined();
        expect(topic.contentAvailable).toBe(true);
      }
    }
  });
  it('makes topic 1 available and the remaining topics locked without inventing completion', () => {
    expect(defaultModules[0].topics.map((topic) => topic.status)).toEqual(['available', 'locked', 'locked', 'locked', 'locked']);
    expect(defaultModules[1].topics.map((topic) => topic.status)).toEqual(['locked', 'locked']);
    expect(defaultModules[2].topics.map((topic) => topic.status)).toEqual(['locked', 'locked']);
    expect(getLessonProgress(defaultModules)).toEqual({ completedCount: 0, totalLessons: 3, completedTopicsCount: 0, totalTopicsCount: 9, percentage: 0 });
  });
  it('isolates mutable view models from subsequent loads and the approved source', () => {
    const modules = createApprovedModules();
    modules[0].topics.push({ ...modules[0].topics[0], id: 'invalid' });
    modules[0].topics[0].title = 'invalid';
    expect(structure(createApprovedModules())).toEqual(expected);
    expect(approvedCurriculum).toEqual(expected);
  });
  it('calculates progress from approved topic count and handles empty data', () => {
    const modules = createApprovedModules();
    modules[0].topics[0].completed = true;
    expect(getLessonProgress(modules).percentage).toBe(11);
    expect(getLessonProgress([]).percentage).toBe(0);
  });
});
