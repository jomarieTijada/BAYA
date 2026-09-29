import React, { useState } from "react";
import { Image, type ImageStyle, type StyleProp } from "react-native";
import type { MediaSource } from "./MediaSource";
import { useMediaSource } from "./mediaResolver";
import { MediaFallback } from "./MediaFallback";

export function ImageViewer({
  source,
  label,
  style,
}: {
  source?: MediaSource;
  label: string;
  style?: StyleProp<ImageStyle>;
}) {
  const media = useMediaSource(source);
  const [failedUri, setFailedUri] = useState<string | null>(null);
  if (!media.uri || failedUri === media.uri)
    return <MediaFallback title={label} />;
  return (
    <Image
      accessibilityLabel={label}
      resizeMode="contain"
      source={{ uri: media.uri }}
      style={[{ width: "100%", height: "100%", minHeight: 120 }, style]}
      onError={() => setFailedUri(media.uri)}
    />
  );
}
