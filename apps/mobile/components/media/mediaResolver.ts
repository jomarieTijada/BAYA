import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Asset } from "expo-asset";
import { mediaAssets } from "../../content/mediaCatalog";
import { isValidRemoteUrl } from "../../content/mediaPolicy";
import type { MediaSource } from "./MediaSource";
export { isValidRemoteUrl } from "../../content/mediaPolicy";

export interface ResolvedMediaState {
  error?: string;
  isLocal: boolean;
  status: "idle" | "resolving" | "ready" | "error";
  uri: string | null;
}

function localModule(source: MediaSource | undefined): number | null {
  if (source?.type === "asset")
    return Object.hasOwn(mediaAssets, source.assetId)
      ? mediaAssets[source.assetId]
      : null;
  return source?.type === "local" && typeof source.source === "number"
    ? source.source
    : null;
}

export function resolveStaticMediaUri(
  source: MediaSource | undefined,
): string | null {
  if (!source) return null;
  if (source.type === "remote")
    return isValidRemoteUrl(source.source) ? source.source : null;
  const module = localModule(source);
  if (module === null) return null;
  try {
    return Asset.fromModule(module).uri || null;
  } catch {
    return null;
  }
}

export function useMediaSource(
  source: MediaSource | undefined,
  retryToken = 0,
): ResolvedMediaState {
  const sourceKey = JSON.stringify(source ?? null);
  const requestKey = `${sourceKey}:${retryToken}`;
  const [resolved, setResolved] = useState<{
    key: string;
    value: ResolvedMediaState;
  } | null>(null);
  const module = localModule(source);
  const requiresDeviceUri = module !== null && Platform.OS !== "web";
  // Resolve bundled media to a cached device file before native playback.
  const initialUri = requiresDeviceUri ? null : resolveStaticMediaUri(source);
  const initial: ResolvedMediaState = {
    uri: initialUri,
    isLocal: !!source && source.type !== "remote",
    status: !source
      ? "idle"
      : requiresDeviceUri
        ? "resolving"
        : initialUri
          ? "ready"
          : "error",
  };
  useEffect(() => {
    let active = true;
    if (module !== null && Platform.OS !== "web") {
      let asset: Asset;
      try {
        asset = Asset.fromModule(module);
      } catch (error) {
        if (__DEV__) console.debug('[BAYA VIDEO DEBUG]', { platform: Platform.OS, source: sourceKey, status: 'asset-error', error: String(error) });
        Promise.resolve().then(() => {
          if (active)
            setResolved({
              key: requestKey,
              value: {
                status: "error",
                uri: null,
                isLocal: true,
                error: "Unable to create local asset",
              },
            });
        });
        return () => {
          active = false;
        };
      }
      if (__DEV__) console.debug('[BAYA VIDEO DEBUG]', {
        platform: Platform.OS, source: sourceKey, assetPath: asset.uri,
        resolvedUri: asset.localUri, status: 'downloading',
      });
      asset
        .downloadAsync()
        .then(() => {
          // downloadAsync guarantees localUri for a downloaded file. Never pass
          // the Metro/Expo server URI to a native video player as a fallback.
          if (active && asset.localUri)
            setResolved({
              key: requestKey,
              value: {
                status: "ready",
                uri: asset.localUri,
                isLocal: true,
              },
            });
          else if (active)
            setResolved({
              key: requestKey,
              value: {
                status: "error",
                uri: null,
                isLocal: true,
                error: "Local asset URI unavailable after download",
              },
            });
        })
        .catch((error: unknown) => {
          if (__DEV__) console.debug('[BAYA VIDEO DEBUG]', {
            platform: Platform.OS, source: sourceKey, assetPath: asset.uri,
            resolvedUri: asset.localUri, status: 'download-error', error: String(error),
          });
          if (active)
            setResolved({
              key: requestKey,
              value: {
                status: "error",
                uri: null,
                isLocal: true,
                error: error instanceof Error ? error.message : String(error),
              },
            });
        });
    }
    return () => {
      active = false;
    };
  }, [module, requestKey, sourceKey]);
  // Never display the previous topic's media while a new source resolves.
  return resolved?.key === requestKey ? resolved.value : initial;
}
