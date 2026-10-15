import type {
  VideoMetadata,
  VideoSource,
} from "../components/media/MediaSource";
import type { AppIconName } from "../components/ui/AppIcon";

export type { VideoMetadata, VideoSource };

export type ActivityStepType =
  | "video"
  | "story"
  | "audio"
  | "slide"
  | "quiz"
  | "writing"
  | "practice"
  | "concept";

export interface VideoIntroduction { title: string; body: string }
export interface VideoCredit { label: string; url: string }
export interface LessonReference {
  organization: string;
  abbreviation: string;
  title: string;
  author: string;
  url: string;
}

export interface VideoStepContent {
  credit?: VideoCredit;
  introduction?: VideoIntroduction;
  badge?: string;
  description?: string;
  durationText?: string;
  isAvailable?: boolean;
  metadata?: VideoMetadata;
  source?: VideoSource;
  title: string;
}

export interface StoryCardChunk {
  badge: string;
  badgeColor?: "orange" | "amber" | "green" | "purple";
  highlightWords?: string[];
  iconName?: AppIconName;
  id: string;
  nativeScript?: string;
  text: string;
}

export interface SlideStepContent {
  videoCredit?: VideoCredit;
  reference?: LessonReference;
  examples?: string;
  examplesLabel?: string;
  /** Reserved for future validator-approved artwork; currently always a placeholder. */
  imageSource?: import("../components/media/MediaSource").MediaSource;
  badge?: string;
  content: string;
  highlightWords?: string[];
  illustration?: import("../components/media/MediaSource").MediaSource;
  illustrationPlaceholder?: string;
  illustrationTheme?:
    | "origin"
    | "tools"
    | "identity"
    | "practice"
    | "syllabary"
    | "seventeen-symbols"
    | "allophone"
    | "da-ra";
  number: number;
  openingNarration?: string;
  storyCards?: StoryCardChunk[];
  storyHighlight?: string;
  storyMessage?: string;
  subtitle?: string;
  title: string;
  totalInDeck: number;
}

export interface ActivityStep {
  content?: VideoStepContent | SlideStepContent;
  ctaLabel?: string;
  id: string;
  requiresCompletion?: boolean;
  title: string;
  type: ActivityStepType;
}

export interface SlideItem {
  /** Reserved for future validator-approved artwork; currently always a placeholder. */
  imageSource?: import("../components/media/MediaSource").MediaSource;
  content: string;
  highlightWords?: string[];
  id: string;
  illustration?: import("../components/media/MediaSource").MediaSource;
  illustrationPlaceholder?: string;
  illustrationTheme?:
    | "origin"
    | "tools"
    | "identity"
    | "practice"
    | "syllabary"
    | "seventeen-symbols"
    | "allophone"
    | "da-ra";
  number: number;
  openingNarration?: string;
  storyCards?: StoryCardChunk[];
  storyHighlight?: string;
  storyMessage?: string;
  subtitle?: string;
  title: string;
}

export interface VideoData {
  introduction?: VideoIntroduction;
  durationText?: string;
  isAvailable?: boolean;
  metadata?: VideoMetadata;
  source?: VideoSource;
  title: string;
}

export interface TopicActivityData {
  activityIndex: number;
  id: string;
  moduleId: string;
  moduleTitle: string;
  slides: SlideItem[];
  steps: ActivityStep[];
  title: string;
  totalActivitiesInModule: number;
  type: string;
  video: VideoData;
}
