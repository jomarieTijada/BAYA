/**
 * Production-Ready Media Source Abstraction for BAYA.
 * Standardizes local assets and remote CDN endpoints.
 */

/** Serialized content uses asset IDs, never file paths or executable imports. */
export type MediaSource =
  | { type: "asset"; assetId: string }
  | { type: "local"; source: number }
  | { type: "remote"; source: string }
  | null;
export type VideoSource = MediaSource;

export interface VideoMetadata {
  cdnPath?: string;
  durationSeconds?: number;
  mimeType?: string;
  originalFilename?: string;
}

export type VideoPlayState =
  "idle" | "resolving" | "ready" | "playing" | "completed" | "error";

export interface VideoPlayerProps {
  /** Initial position only; never reapplied after manual seeking or pause/resume. */
  startAtSeconds?: number;
  compact?: boolean;
  isLandscapeCompact?: boolean;
  metadata?: VideoMetadata;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
  onLoad?: () => void;
  onPlay?: () => void;
  source: VideoSource | null | undefined;
  testID?: string;
  title?: string;
}
