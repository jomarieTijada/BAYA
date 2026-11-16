import type { ImageSourcePropType } from 'react-native';
import type { MessageKey } from '../../localization/en';

/** Biography sources are separate from the researchers' creative naming decision.
 * Owner supplied a collage for local integration/testing. Public redistribution remains pending.
 * Educational wording in both locales awaits subject-matter validation. */
export const bayaniPhoto: {
  status: 'local-preview'; sourceUrl: string; publisher: string;
  photographer: null; license: null; localAsset: ImageSourcePropType;
  publication: 'blocked-pending-permission';
} = {
  status: 'local-preview',
  sourceUrl: 'https://www.philippineeaglefoundation.org/post/princess-maasim-from-near-tragedy-to-conservation-legacy',
  publisher: 'Philippine Eagle Foundation',
  photographer: null,
  license: null,
  publication: 'blocked-pending-permission',
  localAsset: require('../../assets/storybook/bayani-real/bayani_pic.jpg'),
};

export const miniGavinoPhoto = require('../../assets/storybook/acknowledgements/ms-mini-gavino.jpg');

export const acknowledgementArtwork = [
  { name: 'Baybayin Buhayin', url: 'https://www.facebook.com/baybayinbuhayin/', source: require('../../assets/storybook/acknowledgements/baybayin_buhayin_logo.jpg') },
  { name: 'GINHAWA Baybayin Creativity Workshops', url: 'https://ginhawa.net/programs.html', source: require('../../assets/storybook/acknowledgements/baybayin_creativity_workshops_classes_logo.jpg') },
] as const;

export const originSources = {
  family: bayaniPhoto.sourceUrl,
  birth: 'https://pia.gov.ph/news/help-needed-to-complete-philippine-eagle-breeding-facility/',
  naming: 'https://www.philstar.com/headlines/2026/03/10/2513328/philippine-eagle-foundation-announces-new-chick-bayani',
  projectNaming: 'CHAP_2_draft_2_101226 (LATEST) (1).docx â€” Operational Definition of Terms: BAYA; researcher implementation brief',
  validation: 'pending-subject-matter-review',
} as const;

export const originSteps: readonly { id: string; title: MessageKey; paragraphs: readonly MessageKey[] }[] = [
  { id: 'bayani', title: 'origin.meetTitle', paragraphs: ['origin.meetBody', 'origin.meaning'] },
  { id: 'story', title: 'origin.storyTitle', paragraphs: ['origin.storyBody', 'origin.nameBody'] },
  { id: 'inspiration', title: 'origin.bridgeTitle', paragraphs: ['origin.bridgeBody', 'origin.heritage'] },
  { id: 'baya', title: 'origin.mascotTitle', paragraphs: ['origin.mascotBody'] },
];
