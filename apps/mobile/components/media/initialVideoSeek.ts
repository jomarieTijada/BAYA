type SeekableVideo = { currentTime: number; duration: number };

/** One successful seek per mounted source. A metadata delay or failed setter can retry. */
export function createInitialVideoSeek(startAtSeconds: number) {
  let applied = !(Number.isFinite(startAtSeconds) && startAtSeconds > 0);
  return (video: SeekableVideo) => {
    if (applied) return true;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return false;
    if (video.duration <= startAtSeconds) { applied = true; return false; }
    try {
      video.currentTime = startAtSeconds;
      applied = true;
      return true;
    } catch { return false; }
  };
}
