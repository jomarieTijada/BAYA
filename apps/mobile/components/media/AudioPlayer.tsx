import React, { useEffect, useRef, useState } from "react";
import { Button, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import type { MediaSource } from "./MediaSource";
import { useMediaSource } from "./mediaResolver";
import { MediaFallback } from "./MediaFallback";

type Props = { source?: MediaSource; title: string; onEnd?: () => void };
export function AudioPlayer({ source, title, onEnd }: Props) {
  const media = useMediaSource(source);
  if (!media.uri)
    return <MediaFallback title={`Hindi available ang audio: ${title}`} />;
  return (
    <AudioSurface key={media.uri} uri={media.uri} title={title} onEnd={onEnd} />
  );
}
function AudioSurface({
  uri,
  title,
  onEnd,
}: Omit<Props, "source"> & { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const [failed, setFailed] = useState(false);
  const completionEmitted = useRef(false);
  useEffect(() => {
    if (status.didJustFinish && !completionEmitted.current) {
      completionEmitted.current = true;
      onEnd?.();
    } else if (!status.didJustFinish) completionEmitted.current = false;
  }, [status.didJustFinish, onEnd]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!player.isLoaded) setFailed(true);
    }, 15000);
    return () => clearTimeout(timer);
  }, [player]);
  if (failed)
    return <MediaFallback title={`Hindi available ang audio: ${title}`} />;
  return (
    <View>
      <Text>{title}</Text>
      <Button
        title={status.playing ? "I-pause" : "Pakinggan"}
        disabled={!status.isLoaded}
        onPress={() => {
          try {
            if (status.playing) player.pause();
            else player.play();
          } catch {
            setFailed(true);
          }
        }}
      />
    </View>
  );
}
