# BAYA content architecture

## Ownership and current content

`approvedCurriculum.ts` owns the approved module/topic IDs, titles and order. The approved data currently contains Module 1 and five topics. The three sections that used to be slides in Topic 3 are now separate topic pages. The architecture has no six-module, 19-topic or numeric-ID limit; those planned counts must not be confused with approval of teaching material.

`modules/catalog.ts` derives view models from that manifest. The database seed and curriculum service use the same authority. Historical rows are retained. Adding an approved Module 7 or Topic 20 is a manifest/data change; `lessons/[id]` and `activities/[topicId]` stay data-driven. Topic 2 remains locked on the lesson map while the storybook navigation presents each topic as one page.

`topics/` preserves pre-existing teaching previews. Their original comments do not prove validator approval. The learner route uses `database/services/activityContentService.ts`. The built-in `approvedStorybook.ts` source contains the five supplied story pages, takes precedence over stored previews, and works offline.

## Runtime pipeline

Approved manifest → SQLite repositories → services → validated view models → shared screens/cards/story/media.

`activity_content` (migration 003) stores JSON payloads with validation status, source provenance, revision, and review timestamp. The seed reconciles approved curriculum rows and the five supplied story payloads. That source label records the supplied provenance; it is not an authenticated validator identity. Those supplied pages are bundled as the offline source of truth. Future topics require explicitly approved data. Unknown IDs, unavailable databases, malformed JSON, missing review metadata, drafts and unsupported activity types return an unavailable state.

The review metadata is a delivery gate, not an authentication mechanism. A future backend must authorize publication and verify its source before storing records. `ActivityContentSource` is the adapter boundary for an authenticated CMS; it returns the same records as SQLite and is passed to `createActivityContentService`. No network fetching or HTML rendering belongs in screens.

## Activity payload

Example shape (illustrative only; this is not approved curriculum):

```json
{
  "id": "topic-7-20",
  "moduleId": "module-7",
  "moduleTitle": "Validator-supplied module title",
  "title": "Validator-supplied topic title",
  "steps": [
    {
      "id": "topic-7-20-story-1",
      "type": "story",
      "title": "Validator-supplied heading",
      "content": {
        "title": "Validator-supplied heading",
        "content": "Validator-approved paragraph.",
        "storyMessage": "Validator-approved mascot message.",
        "illustration": {
          "type": "asset",
          "assetId": "reviewed-illustration-id"
        }
      }
    }
  ]
}
```

The parser bounds text length, number of steps and unique step IDs. It accepts `story`, legacy `slide`/`concept`, `video` and `audio`. Each new activity type needs one parser branch and one renderer branch, with its completion contract and tests, not a new topic screen. Practice/writing/quiz currently show an unavailable fallback; their assessment engines are outside this refactor.

Persist additional reviewed JSON using parameterized SQL into `activity_content` only after approval, with `validation_status = 'approved'`, a positive `revision`, a valid source/reviewer identifier and an ISO `reviewed_at`. `activity_id` must reference an approved seeded activity. The service derives module/topic display titles and position from the manifest. Do not mark preview content approved merely to make it visible.

## Media

Content references `{ "type": "asset", "assetId": "..." }` or `{ "type": "remote", "source": "https://..." }`. Add reviewed bundled files to `assets/` and a static entry in `mediaCatalog.ts`; the renderer does not change. Missing IDs gracefully fall back. Serialized content cannot supply a local file path, arbitrary numeric module ID, dynamic import, HTML or JavaScript.

Add an actual BAYA-controlled HTTPS origin to `mediaOrigins.ts` before enabling remote media. The list is intentionally empty until one is configured. Origins match exactly, including port; credentials, HTTP, lookalike hosts and other schemes are rejected. A new validator video or illustration on an approved origin changes only its payload. CDN redirect policy is the hosting provider's responsibility.

`VideoPlayer`, `AudioPlayer`, `ImageViewer` and `MediaFallback` share source resolution. Native playback uses Expo SDK 57 video/audio hooks, web video uses native browser controls. Missing sources, download/decode errors and video load errors show learner-facing fallback text without internal paths. Completion is emitted only by playback completion events; navigating cannot manufacture a completed video.

## Presentation

`components/ui/cards/` owns card surface, sizes, variants, theme, accessibility and header/content/footer slots. `components/learner/cards/` composes lesson, topic, activity, story and media cards. Existing lesson/topic screens and the activity renderer use those components. Thin old-path exports are temporary compatibility boundaries, not separate implementations.

`components/learner/story/StoryPage` is the single presentation template for topics and story activities. It composes StorybookTopicLayout, StoryIllustration, StoryContent and StoryGuide. Videos, approved illustrations and placeholders share the same centered 16:9 visual frame. Titles, paragraphs, optional examples and BAYA messages come from content; topic data cannot select mascot sizes or alternate layouts. Topic identity belongs in the app header. The template uses a two-column spread when both columns fit and stacks when space is narrow. New topics require approved content, not new UI components.

## Validation

Run from `apps/mobile`:

```sh
npx tsc --noEmit
npm run lint
npm test -- --runInBand
npx expo-doctor
npx expo export --platform web
```

Tests cover schema migration, payload approval, malformed content, media policy/fallback, topic state isolation, sequential video completion and responsive navigation. Native device playback still needs a device smoke test before release; test doubles verify event wiring only.
