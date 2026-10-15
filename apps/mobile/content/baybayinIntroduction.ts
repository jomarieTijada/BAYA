import type { LessonReference, SlideStepContent, VideoCredit, VideoIntroduction } from './types';

/** Validator-requested copy shared by the live storybook and activity previews. */
export const baybayinVideoIntroduction: VideoIntroduction = {
  title: 'Kilalanin natin ang Baybayin!',
  body: 'Panoorin ang maikling video at tuklasin ang Baybayin—isang sinaunang paraan ng pagsulat sa Pilipinas. Pagkatapos, sabay nating kilalanin, basahin, at isulat ang mga karakter nito!',
};

export const baybayinHistoryReference: LessonReference = {
  organization: 'National Commission for Culture and the Arts',
  abbreviation: 'NCCA',
  title: 'Early Philippine Literature',
  author: 'Lilia Quindoza-Santiago',
  url: 'https://ncca.gov.ph/about-ncca-3/subcommissions/subcommission-on-the-arts-sca/literary-arts/early-philippine-literature/',
};

export const baybayinVideoCredit: VideoCredit = {
  label: 'Video Gawa ng: GINHAWA Inc',
  url: 'https://www.ginhawa.net/',
};

export const baybayinHistoryContent: Pick<SlideStepContent, 'title' | 'content' | 'storyMessage' | 'reference' | 'videoCredit'> = {
  title: 'Baybayin sa Kasaysayan',
  content: 'Ang Baybayin ay isa sa mga sinaunang paraan ng pagsulat sa Pilipinas. Sa mga tala ng kasaysayan, iniuugnay ito sa mga sinaunang Tagalog. Bahagi ito ng ating kultura at pamana bilang mga Pilipino.',
  storyMessage: 'Ito ay mahalagang bahagi ng pagkatao natin.',
  reference: baybayinHistoryReference,
  videoCredit: baybayinVideoCredit,
};
