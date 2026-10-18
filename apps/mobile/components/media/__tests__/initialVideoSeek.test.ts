import { createInitialVideoSeek } from '../initialVideoSeek';

describe('initial video position', () => {
  it('waits for metadata, seeks once, then preserves rewinding and resuming', () => {
    const seek = createInitialVideoSeek(17);
    const video = { duration: NaN, currentTime: 0 };
    expect(seek(video)).toBe(false);
    video.duration = 231;
    expect(seek(video)).toBe(true);
    expect(video.currentTime).toBe(17);
    video.currentTime = 3;
    seek(video);
    expect(video.currentTime).toBe(3);
    video.currentTime = 40;
    seek(video);
    expect(video.currentTime).toBe(40);
  });
  it('retries a temporarily unavailable native/web seek', () => {
    const seek = createInitialVideoSeek(17);
    let ready = false;
    let time = 0;
    const video = { duration: 231, get currentTime() { return time; }, set currentTime(value) { if (!ready) throw Error('loading'); time = value; } };
    expect(seek(video)).toBe(false);
    ready = true;
    expect(seek(video)).toBe(true);
    expect(time).toBe(17);
  });
  it('leaves other videos at zero and avoids seeking beyond the source', () => {
    for (const start of [0, -1, NaN, 17]) {
      const video = { duration: 10, currentTime: 0 };
      createInitialVideoSeek(start)(video);
      expect(video.currentTime).toBe(0);
    }
  });
});
