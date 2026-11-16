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
    {
      if (Object.hasOwn(mediaAssets, source.assetId)) {
        return mediaAssets[source.assetId];
      } else {
        return null;
      }
    }
  if (source?.type === "local" && typeof source.source === "number") {
    return source.source;
  } else {
    return null;
  }
}

export function resolveStaticMediaUri(
  source: MediaSource | undefined,
): string | null {
  if (!source) return null;
  if (source.type === "remote")
    {
      if (isValidRemoteUrl(source.source)) {
        return source.source;
      } else {
        return null;
      }
    }
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
  let initialUri;
  if (requiresDeviceUri) {
    initialUri = null;
  } else {
    initialUri = resolveStaticMediaUri(source);
  }
  const initial: ResolvedMediaState = {
    uri: initialUri,
    isLocal: !!source && source.type !== "remote",
    status: (() => {
      if (!source) {
        return "idle";
      } else {
        if (requiresDeviceUri) {
          return "resolving";
        } else {
          if (initialUri) {
            return "ready";
          } else {
            return "error";
          }
        }
      }
    })(),
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
                error: (() => {
                  if (error instanceof Error) {
                    return error.message;
                  } else {
                    return String(error);
                  }
                })(),
              },
            });
        });
    }
    return () => {
      active = false;
    };
  }, [module, requestKey, sourceKey]);
  // Never display the previous topic's media while a new source resolves.
  if (resolved?.key === requestKey) {
    return resolved.value;
  } else {
    return initial;
  }
}
