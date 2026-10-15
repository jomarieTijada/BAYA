import type {
  ActivityStep,
  LessonReference,
  VideoIntroduction,
  VideoCredit,
  SlideStepContent,
  TopicActivityData,
  VideoStepContent,
} from "./types";
import type { MediaSource } from "../components/media/MediaSource";
import { isValidRemoteUrl } from "./mediaPolicy";

type RecordValue = Record<string, unknown>;
const record = (v: unknown): v is RecordValue =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown, max = 20000): v is string =>
  typeof v === "string" && v.length <= max;
const optionalText = (v: unknown) => v === undefined || text(v);
const validIntroduction = (v: unknown) => record(v) && text(v.title, 300) && text(v.body, 2000);
const validVideoCredit = (v: unknown) => record(v) && text(v.label, 300) && v.label.length > 0
  && text(v.url, 2048) && isValidRemoteUrl(v.url, ['https://www.ginhawa.net']);
const validReference = (v: unknown) => record(v)
  && ['organization', 'abbreviation', 'title', 'author'].every(key => text(v[key], 500) && v[key].length > 0)
  && text(v.url, 2048) && isValidRemoteUrl(v.url, ['https://ncca.gov.ph']);
function media(v: unknown): MediaSource | undefined {
  if (v === null || v === undefined) return null;
  if (!record(v)) return undefined;
  if (v.type === "asset" && text(v.assetId, 128))
    return { type: "asset", assetId: v.assetId };
  if (v.type === "remote" && text(v.source, 2048) && isValidRemoteUrl(v.source))
    return { type: "remote", source: v.source };
  return undefined;
}

/** Data, never HTML/JS. Reject malformed content before it reaches a component. */
export function parseActivity(
  value: unknown,
  expectedId?: string,
): TopicActivityData | null {
  if (
    !record(value) ||
    !text(value.id, 128) ||
    !value.id ||
    (expectedId && value.id !== expectedId) ||
    !text(value.moduleId, 128) ||
    !text(value.moduleTitle, 300) ||
    !text(value.title, 300) ||
    !Array.isArray(value.steps) ||
    value.steps.length === 0 ||
    value.steps.length > 500
  )
    return null;
  const ids = new Set<string>();
  const steps: ActivityStep[] = [];
  for (const raw of value.steps) {
    if (
      !record(raw) ||
      !text(raw.id, 128) ||
      !raw.id ||
      ids.has(raw.id) ||
      !text(raw.title, 300) ||
      !record(raw.content)
    )
      return null;
    ids.add(raw.id);
    const c = raw.content;
    let content: VideoStepContent | SlideStepContent;
    if (raw.type === "video" || raw.type === "audio") {
      const source = media(c.source);
      if (
        source === undefined ||
        !text(c.title, 300) ||
        !optionalText(c.badge) ||
        !optionalText(c.description)
        || (c.introduction !== undefined && !validIntroduction(c.introduction))
        || (c.credit !== undefined && !validVideoCredit(c.credit))
      )
        return null;
      content = {
        title: c.title,
        source,
        badge: c.badge as string | undefined,
        description: c.description as string | undefined,
        introduction: c.introduction as VideoIntroduction | undefined,
        credit: c.credit as VideoCredit | undefined,
      };
    } else if (
      raw.type === "story" ||
      raw.type === "slide" ||
      raw.type === "concept"
    ) {
      if (
        !text(c.title, 300) ||
        !text(c.content) ||
        ![
          "badge",
          "examples",
          "examplesLabel",
          "subtitle",
          "openingNarration",
          "storyHighlight",
          "storyMessage",
          "illustrationPlaceholder",
          "illustrationTheme",
        ].every((k) => optionalText(c[k]))
      )
        return null;
      if (
        c.highlightWords !== undefined &&
        (!Array.isArray(c.highlightWords) ||
          c.highlightWords.length > 100 ||
          !c.highlightWords.every((w) => text(w, 100)))
      )
        return null;
      const source = media(c.illustration ?? c.imageSource);
      if (source === undefined) return null;
      if (c.reference !== undefined && !validReference(c.reference)) return null;
      if (c.videoCredit !== undefined && !validVideoCredit(c.videoCredit)) return null;
      content = {
        title: c.title,
        content: c.content,
        reference: c.reference as LessonReference | undefined,
        videoCredit: c.videoCredit as VideoCredit | undefined,
        number: steps.length + 1,
        totalInDeck: value.steps.length,
        examples: c.examples as string | undefined,
        examplesLabel: c.examplesLabel as string | undefined,
        badge: c.badge as string | undefined,
        subtitle: c.subtitle as string | undefined,
        openingNarration: c.openingNarration as string | undefined,
        storyHighlight: c.storyHighlight as string | undefined,
        storyMessage: c.storyMessage as string | undefined,
        illustrationPlaceholder: c.illustrationPlaceholder as
          string | undefined,
        illustrationTheme: c.illustrationTheme as any,
        highlightWords: c.highlightWords as string[] | undefined,
        illustration: source,
      };
    } else {
      // New types require an explicit renderer + validator before publication.
      return null;
    }
    steps.push({
      id: raw.id,
      title: raw.title,
      type: raw.type,
      content,
      requiresCompletion: raw.requiresCompletion === true,
    });
  }
  return {
    id: value.id,
    moduleId: value.moduleId,
    moduleTitle: value.moduleTitle,
    title: value.title,
    type: steps[0].type,
    activityIndex: 1,
    totalActivitiesInModule: 1,
    steps,
    slides: [],
    video: { title: "", source: null, isAvailable: false },
  };
}
