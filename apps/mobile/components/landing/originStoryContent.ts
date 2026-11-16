import type { MessageKey } from '../../localization/en';

/** Biography sources are separate from the researchers' creative naming decision.
 * Photo permission has NOT been established. Do not add a remote image or cache it.
 * Educational wording in both locales awaits subject-matter validation. */
export const bayaniPhoto = {
  status: 'awaiting-authorization',
  sourceUrl: 'https://www.philippineeaglefoundation.org/post/princess-maasim-from-near-tragedy-to-conservation-legacy',
  publisher: 'Philippine Eagle Foundation',
  photographer: null,
  license: null,
  localAsset: null,
} as const;

export const originSources = {
  family: bayaniPhoto.sourceUrl,
  birth: 'https://pia.gov.ph/news/help-needed-to-complete-philippine-eagle-breeding-facility/',
  naming: 'https://www.philstar.com/headlines/2026/03/10/2513328/philippine-eagle-foundation-announces-new-chick-bayani',
  projectNaming: 'CHAP_2_draft_2_101226 (LATEST) (1).docx — Operational Definition of Terms: BAYA; researcher implementation brief',
  validation: 'pending-subject-matter-review',
} as const;

export const originSteps: readonly { id: string; title: MessageKey; paragraphs: readonly MessageKey[] }[] = [
  { id: 'bayani', title: 'origin.meetTitle', paragraphs: ['origin.meetBody', 'origin.meaning'] },
  { id: 'story', title: 'origin.storyTitle', paragraphs: ['origin.storyBody', 'origin.nameBody'] },
  { id: 'inspiration', title: 'origin.bridgeTitle', paragraphs: ['origin.bridgeBody', 'origin.heritage'] },
  { id: 'baya', title: 'origin.mascotTitle', paragraphs: ['origin.mascotBody'] },
];
