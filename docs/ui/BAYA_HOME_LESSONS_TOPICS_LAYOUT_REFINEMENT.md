# BAYA Home, Lessons and Topics Layout Refinement

Verified on 24 November 2026. This pass implements the supplied Precision UI/UX Layout Refinement request without changing curriculum, assessment scoring, audio assets, persistence or handwriting behavior.

## Changes

- **Home:** Reduced the landscape hero, mascot, progress nodes and gaps. All three dashboard cards remain visible with their actions. Cards expand naturally for longer text; descriptions are no longer line-clamped. Compact actions retain a 44px minimum height. Narrow layouts retain scrolling rather than clipping content.
- **Lessons:** Restored comfortable row padding, 10px topic spacing, two-line titles and 44px minimum interactive rows. Quizzes and activities remain grouped with their topics. Vertical scrolling is intentional here, so module footer actions remain reachable.
- **Story topics:** At widths of 640px and above, illustration/video and text each occupy exactly half the available content width after padding and gap. Narrower layouts stack. Video keeps its 16:9 frame; long text remains scrollable.
- **Bayani:** Increased the topic mascot and removed its cropped footer presentation. It remains above navigation and opens its existing takeaway. The Home mascot uses separate compact sizing. Original artwork is unchanged.

## Measured before and after

| Check | Before | After |
| --- | --- | --- |
| Home hero at 844 × 390 | 100px | 77px |
| Home hero-to-card gap | 19px | 12px |
| Home at 768 × 320 | 241px content in 220px available space | 220px content, no vertical overflow |
| Compact dashboard cards | 114px fixed height | 124px minimum, expandable for text |
| Lesson topic separation | 3px | 10px |
| History columns at 844 × 390 | About 264px / 560px | 412px / 412px |
| History columns at 1280 × 800 | About 521px / 719px | 620px / 620px |
| Topic mascot at 844 × 390 | About 70px wide, cropped | About 122px square, full body |

The Home space savings come from the hero and gaps. Dashboard cards are slightly taller to improve text and button usability.

## Screenshots

Each before/after folder contains Home, Lessons, history video, syllabary text and character introduction captures at ten viewport sizes.

| Screen | Before | After |
| --- | --- | --- |
| Short landscape Home | [Before](../verification/precision-layout/before/home-768x320.png) | [After](../verification/precision-layout/after/home-768x320.png) |
| Landscape Lessons | [Before](../verification/precision-layout/before/lessons-844x390.png) | [After](../verification/precision-layout/after/lessons-844x390.png) |
| Landscape history | [Before](../verification/precision-layout/before/history-844x390.png) | [After](../verification/precision-layout/after/history-844x390.png) |

Additional evidence: [Tagalog with a long learner name](../verification/precision-layout/functional/tagalog-long-name-home.png), [Bayani takeaway](../verification/precision-layout/functional/bayani-takeaway.png), [reachable module footer](../verification/precision-layout/functional/lessons-footer.png), [portrait phone guidance](../verification/precision-layout/functional/phone-portrait-warning.png).

## Validation

- Jest: **88 suites, 979 tests passed**.
- TypeScript, Expo lint and production web export passed.
- Browser layout matrix: **50 after-change checks** across 320 × 568, 360 × 800, 390 × 844, 430 × 932, 768 × 320, 768 × 1024, 844 × 390, 1024 × 768, 1280 × 800 and 1440 × 900; no recorded errors.
- **10 functional checks passed:** Home Lessons action, reachable module footers, actual connected video playback, offline lesson content, offline Next navigation, long lesson scrolling, Bayani takeaway, Tagalog Home with a long name, Tagalog lesson and portrait phone landscape warning.
- **8 sequential-checkpoint checks passed**, covering 75 recognition questions, lesson-to-quiz transitions, completion-to-next-topic transitions, pronunciation playback and the final transition to writing. The two pending DE/RE items remain unscored.
- Visual inspection covered compact landscape Home, landscape Lessons, phone and desktop history, narrow stacked history and Tagalog Home.

Raw results: [layout matrix](../verification/precision-layout/after/browser-results.json), [functional checks](../verification/precision-layout/functional/browser-results.json), [sequential checkpoints](../verification/sequential-checkpoints/browser-results.json).

## Scope and limitations

Browser checks used isolated test profiles, not the learner's saved records. No physical phone interaction was verified in this pass. Portrait browser sizes test the underlying responsive layout; a phone user agent still receives the previously requested landscape guidance.

Video streaming requires a connection under the existing service-worker media bypass policy. Offline lesson text, navigation, quizzes and pronunciation playback were checked separately. This layout pass does not alter that video policy.

The tested introduction topics have no approved static illustration, so their existing illustration placeholder remains. No replacement artwork was invented; actual static-illustration coverage remains unavailable for those topics.

## Implementation files

Under `apps/mobile/components/learner/`:

- `home/ContinueLessonHero.tsx`, `home/LessonStepProgress.tsx`, `home/LearnerHomeScreen.tsx`, `home/DashboardCard.tsx`, `home/DashboardCards.tsx`
- `cards/TopicCard.tsx`, `cards/LessonCard.tsx`
- `characterActivities/ModuleAssessments.tsx`
- `story/StorybookTopicLayout.tsx`, `story/StoryContent.tsx`, `story/StoryMascotPopover.tsx`
- `story/__tests__/StorybookTopicScreen.test.tsx`

Browser verification uses `scripts/testing/precision-layout.mjs`, `scripts/testing/precision-layout-functional.mjs` and the existing `scripts/testing/sequential-checkpoints.mjs`.
