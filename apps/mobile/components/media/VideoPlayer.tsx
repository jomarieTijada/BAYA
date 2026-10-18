import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Colors, Radius, Spacing } from "../../constants/theme";
import type { VideoPlayerProps } from "./MediaSource";
import { useMediaSource } from "./mediaResolver";
import { MediaFallback } from "./MediaFallback";
import { createInitialVideoSeek } from './initialVideoSeek';

export function VideoPlayer(props: VideoPlayerProps) {
  const [retryToken, setRetryToken] = useState(0);
  const media = useMediaSource(props.source, retryToken);
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const {
    title = "Video",
    testID,
    onEnd,
    onLoad,
    onPlay,
    onError,
    startAtSeconds = 0,
  } = props;
  const sourceType = props.source?.type ?? "missing";
  useEffect(() => {
    logVideoStatus(sourceType, media.uri, media.status, media.error);
  }, [sourceType, media.uri, media.status, media.error]);

  const retry = () => {
    setFailedUri(null);
    setRetryToken((current) => current + 1);
  };
  const resolvedUri = media.uri;
  // A new source or explicit retry creates a fresh one-time initial seek.
  const { seek: seekInitially } = useMemo(() => ({ source: resolvedUri, retry: retryToken, seek: createInitialVideoSeek(startAtSeconds) }), [resolvedUri, retryToken, startAtSeconds]);
  const fail = useCallback((error: unknown) => {
    logVideoStatus(sourceType, resolvedUri, "error", error);
    if (resolvedUri) setFailedUri(resolvedUri);
    onError?.(error);
  }, [onError, sourceType, resolvedUri]);

  if (media.status === "resolving")
    return (
      <View
        accessibilityRole="progressbar"
        style={[styles.stage, styles.loading]}
        testID={testID || "video-player-loading"}
      >
        <ActivityIndicator color={Colors.accent} />
        <Text style={styles.loadingText}>Inihahanda ang video…</Text>
      </View>
    );

  if (!resolvedUri || media.status === "error" || resolvedUri === failedUri)
    return (
      <MediaFallback
        testID={testID || "video-player-placeholder"}
        title="Handa na ang video para sa aralin na ito."
        onRetry={retry}
      />
    );
  const uri = resolvedUri;
  return (
    <View
      style={[
        styles.stage,
      ]}
      testID={
        testID ||
        `video-player-media-${Platform.OS === "web" ? "web" : "native"}`
      }
      >
      {Platform.OS === "web" ? (
        <video
          key={`${uri}:${retryToken}`}
          controls
          playsInline
          preload="metadata"
          src={uri}
          aria-label={title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            backgroundColor: "#1C1510",
          }}
          onLoadStart={() => logVideoStatus(sourceType, uri, "loading")}
          onLoadedMetadata={(event) => {
            seekInitially(event.currentTarget);
            logVideoStatus(sourceType, uri, "loadedmetadata", {
              duration: event.currentTarget.duration,
            });
          }}
          onCanPlay={(event) => {
            seekInitially(event.currentTarget);
            logVideoStatus(sourceType, uri, "ready");
            onLoad?.();
          }}
          onPlay={(event) => { seekInitially(event.currentTarget); }}
          onPlaying={() => {
            logVideoStatus(sourceType, uri, "playing");
            onPlay?.();
          }}
          onEnded={() => {
            logVideoStatus(sourceType, uri, "completed");
            onEnd?.();
          }}
          onError={(event) => {
            const video = event.currentTarget;
            fail({
              code: video.error?.code ?? null,
              message: video.error?.message || "Video load failed",
              networkState: video.networkState,
              readyState: video.readyState,
              currentSrc: video.currentSrc || uri,
            });
          }}
        />
      ) : (
        <NativeVideo
          key={`${uri}:${retryToken}:${startAtSeconds}`}
          uri={uri}
          startAtSeconds={startAtSeconds}
          sourceType={sourceType}
          onEnd={onEnd}
          onLoad={onLoad}
          onPlay={onPlay}
          onError={fail}
        />
      )}
    </View>
  );
}
function NativeVideo({
  uri,
  startAtSeconds,
  sourceType,
  onEnd,
  onLoad,
  onPlay,
  onError,
}: Pick<VideoPlayerProps, "onEnd" | "onLoad" | "onPlay" | "onError"> & {
  uri: string;
  startAtSeconds: number;
  sourceType: string;
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  const seekInitially = useMemo(() => createInitialVideoSeek(startAtSeconds), [startAtSeconds]);
  useEffect(() => {
    const subscriptions = [
      player.addListener("playToEnd", () => onEnd?.()),
      player.addListener("playingChange", (event) => {
        if (event.isPlaying) {
          seekInitially(player);
          logVideoStatus(sourceType, uri, "playing");
          onPlay?.();
        }
      }),
      player.addListener("statusChange", (event) => {
        if (event.status !== "error")
          logVideoStatus(sourceType, uri, event.status, event.error);
        if (event.status === "readyToPlay") { seekInitially(player); onLoad?.(); }
        if (event.status === "error") onError?.(event.error);
      }),
      player.addListener("sourceLoad", () => { seekInitially(player); }),
    ];
    if (player.status === "error") {
      onError?.(new Error("Media unavailable"));
    } else if (player.status === "readyToPlay") {
      seekInitially(player);
      logVideoStatus(sourceType, uri, "readyToPlay");
      onLoad?.();
    }
    return () => subscriptions.forEach((s) => s.remove());
  }, [player, uri, sourceType, onEnd, onLoad, onPlay, onError, seekInitially]);
  return (
    <VideoView player={player} nativeControls style={StyleSheet.absoluteFill} />
  );
}

function logVideoStatus(
  sourceType: string,
  resolvedUri: string | null,
  status: string,
  details?: unknown,
) {
  if (!__DEV__) return;
  console.debug("[BAYA Video]", {
    source: sourceType,
    resolvedUri,
    platform: Platform.OS,
    event: status,
    ...(details instanceof Error
      ? { message: details.message }
      : details && typeof details === "object"
        ? details
        : details ? { message: String(details) } : {}),
  });
}

const styles = StyleSheet.create({
  stage: {
    flexShrink: 0,
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: Radius.lg,
    overflow: "hidden",
    zIndex: 1,
  },
  loading: {
    gap: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.optionalBackground,
  },
  loadingText: { color: Colors.textSecondary },
});
