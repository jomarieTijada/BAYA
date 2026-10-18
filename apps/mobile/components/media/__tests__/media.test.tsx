import React from "react";
import { fireEvent, render, screen, act } from "@testing-library/react-native";
import { Platform } from "react-native";
import { Asset } from "expo-asset";
import { useAudioPlayerStatus } from "expo-audio";
import { AudioPlayer } from "../AudioPlayer";
import { useVideoPlayer } from "expo-video";
import { VideoPlayer } from "../VideoPlayer";
import { ImageViewer } from "../ImageViewer";
import { resolveStaticMediaUri } from "../mediaResolver";
import { mediaAssets } from "../../../content/mediaCatalog";
jest.mock("expo-asset", () => ({
  Asset: {
    fromModule: jest.fn((id: number) => {
      let localUri: string | null = null;
      return {
        uri: `https://bundle.test/${id}`,
        get localUri() { return localUri; },
        async downloadAsync() {
          localUri = `file:///cache/${id}.mp4`;
        },
      };
    }),
  },
}));
describe("Media resilience", () => {
  it('seeks the introductory web video once per source without autoplay or rewind resets', () => {
    const old = Platform.OS;
    Platform.OS = 'web';
    const view = render(<VideoPlayer source={{ type: 'local', source: 123 }} title="Intro" startAtSeconds={17} />);
    const media = { duration: NaN, currentTime: 0 };
    fireEvent(screen.getByLabelText('Intro'), 'loadedMetadata', { currentTarget: media });
    expect(media.currentTime).toBe(0);
    media.duration = 231;
    fireEvent(screen.getByLabelText('Intro'), 'canPlay', { currentTarget: media });
    expect(media.currentTime).toBe(17);
    media.currentTime = 4;
    view.rerender(<VideoPlayer source={{ type: 'local', source: 123 }} title="Intro" startAtSeconds={17} onPlay={() => {}} />);
    fireEvent(screen.getByLabelText('Intro'), 'play', { currentTarget: media });
    fireEvent(screen.getByLabelText('Intro'), 'canPlay', { currentTarget: media });
    expect(media.currentTime).toBe(4);
    expect(screen.getByLabelText('Intro').props.autoPlay).toBeUndefined();
    view.rerender(<VideoPlayer source={{ type: 'local', source: 456 }} title="Intro" startAtSeconds={17} />);
    media.currentTime = 0;
    fireEvent(screen.getByLabelText('Intro'), 'loadedMetadata', { currentTarget: media });
    expect(media.currentTime).toBe(17);
    view.unmount();
    Platform.OS = old;
  });
  it('waits for native metadata and preserves manual replay across callback changes', async () => {
    const old = Platform.OS;
    Platform.OS = 'ios';
    const events: Record<string, (event?: any) => void> = {};
    const player = { status: 'loading', duration: 0, currentTime: 0, addListener: (name: string, fn: (event?: any) => void) => { events[name] = fn; return { remove: jest.fn() }; } };
    (useVideoPlayer as jest.Mock).mockReturnValue(player);
    const view = render(<VideoPlayer source={{ type: 'local', source: 123 }} title="Intro" startAtSeconds={17} />);
    await act(async () => { await Promise.resolve(); });
    act(() => events.statusChange({ status: 'readyToPlay' }));
    expect(player.currentTime).toBe(0);
    player.duration = 231;
    act(() => events.sourceLoad());
    expect(player.currentTime).toBe(17);
    player.currentTime = 3;
    view.rerender(<VideoPlayer source={{ type: 'local', source: 123 }} title="Intro" startAtSeconds={17} onPlay={() => {}} />);
    act(() => { events.playingChange({ isPlaying: false }); events.playingChange({ isPlaying: true }); events.statusChange({ status: 'readyToPlay' }); });
    expect(player.currentTime).toBe(3);
    view.unmount();
    Platform.OS = old;
  });
  it("rejects missing asset IDs and unapproved remote hosts", () => {
    expect(
      resolveStaticMediaUri({ type: "asset", assetId: "missing" }),
    ).toBeNull();
    expect(
      resolveStaticMediaUri({
        type: "remote",
        source: "https://evil.test/a.mp4",
      }),
    ).toBeNull();
    render(<VideoPlayer source={null} />);
    expect(screen.getByTestId("video-player-placeholder")).toBeTruthy();
  });
  it("falls back when an image fails to decode", async () => {
    const old = Platform.OS;
    Platform.OS = "web";
    render(
      <ImageViewer
        source={{ type: "local", source: 123 }}
        label="Story illustration"
      />,
    );
    await act(async () => {
      fireEvent(screen.getByLabelText("Story illustration"), "error");
    });
    expect(screen.getByTestId("media-fallback")).toBeTruthy();
    Platform.OS = old;
  });
  it("renders bundled video through the HTML video element on web", () => {
    const old = Platform.OS;
    Platform.OS = "web";
    const view = render(
      <VideoPlayer source={{ type: "local", source: 123 }} title="Story video" />,
    );
    const video = screen.getByLabelText("Story video");
    expect(video.props.src).toBe("https://bundle.test/123");
    expect(video.props.controls).toBe(true);
    view.unmount();
    Platform.OS = old;
  });
  it("resolves the lesson asset ID and only fails on a real HTML media error", () => {
    const old = Platform.OS;
    Platform.OS = "web";
    const source = { type: "asset" as const, assetId: "baybayin-song" };
    expect(resolveStaticMediaUri(source)).toBeTruthy();
    expect(Asset.fromModule).toHaveBeenCalledWith(mediaAssets["baybayin-song"]);
    const onError = jest.fn();
    render(<VideoPlayer source={source} onError={onError} title="Lesson video" />);
    const video = screen.getByLabelText("Lesson video");
    const videoUri = video.props.src;
    expect(video.props.controls).toBe(true);
    expect(video.props.playsInline).toBe(true);
    expect(video.props.preload).toBe("metadata");
    expect(video.props.autoPlay).toBeUndefined();
    fireEvent(video, "loadedMetadata", { currentTarget: { duration: 231 } });
    fireEvent(video, "canPlay", { currentTarget: { duration: 231, currentTime: 0 } });
    expect(screen.queryByTestId("video-player-placeholder")).toBeNull();
    expect(onError).not.toHaveBeenCalled();
    fireEvent(video, "error", {
      currentTarget: {
        error: { code: 4, message: "Unsupported source" },
        networkState: 3,
        readyState: 0,
        currentSrc: "https://bundle.test/lesson.mp4",
      },
    });
    expect(screen.getByTestId("video-player-placeholder")).toBeTruthy();
    expect(onError).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByRole("button", { name: "Subukan muli" }));
    expect(screen.getByLabelText("Lesson video").props.src).toBe(videoUri);
    expect(screen.queryByTestId("video-player-placeholder")).toBeNull();
    Platform.OS = old;
  });
  it("waits for a native local asset URI before creating the player and retries", async () => {
    const old = Platform.OS;
    Platform.OS = "android";
    let finishDownload!: () => void;
    const download = new Promise<void>((resolve) => { finishDownload = resolve; });
    const asset = {
      uri: "http://localhost:8081/assets/baybayin-song.mp4",
      localUri: null as string | null,
      downloadAsync: jest.fn(() => download),
    };
    (Asset.fromModule as jest.Mock).mockReturnValue(asset);
    (useVideoPlayer as jest.Mock).mockClear();

    const view = render(
      <VideoPlayer source={{ type: "local", source: 123 }} title="Story" />,
    );
    expect(screen.getByTestId("video-player-loading")).toBeTruthy();
    expect(useVideoPlayer).not.toHaveBeenCalled();

    await act(async () => {
      asset.localUri = "file:///data/user/0/baya/cache/story.mp4";
      finishDownload();
      await download;
    });
    expect(useVideoPlayer).toHaveBeenCalledWith(
      "file:///data/user/0/baya/cache/story.mp4",
      expect.any(Function),
    );

    view.unmount();
    const failingAsset = {
      uri: "http://localhost:8081/assets/baybayin-song.mp4",
      localUri: null as string | null,
      downloadAsync: jest.fn(),
    };
    failingAsset.downloadAsync.mockImplementation(async () => {
      if (failingAsset.downloadAsync.mock.calls.length === 1)
        throw new Error("private network detail");
      failingAsset.localUri = "file:///data/user/0/baya/cache/retried.mp4";
    });
    (Asset.fromModule as jest.Mock).mockReturnValue(failingAsset);
    render(<VideoPlayer source={{ type: "local", source: 456 }} />);
    expect(await screen.findByText("Handa na ang video para sa aralin na ito.")).toBeTruthy();
    expect(screen.queryByText("private network detail")).toBeNull();
    fireEvent.press(screen.getByRole("button", { name: "Subukan muli" }));
    expect(await screen.findByTestId("video-player-media-native")).toBeTruthy();
    expect(failingAsset.downloadAsync).toHaveBeenCalledTimes(2);
    expect(useVideoPlayer).toHaveBeenLastCalledWith(
      "file:///data/user/0/baya/cache/retried.mp4",
      expect.any(Function),
    );

    (Asset.fromModule as jest.Mock).mockImplementation((id: number) => {
      let localUri: string | null = null;
      return {
        uri: `https://bundle.test/${id}`,
        get localUri() { return localUri; },
        async downloadAsync() {
          localUri = `file:///cache/${id}.mp4`;
        },
      };
    });
    Platform.OS = old;
  });

  it("uses a native end event for completion and renders learner-safe load failures", async () => {
    const old = Platform.OS;
    Platform.OS = "ios";
    const events: Record<string, (v?: unknown) => void> = {};
    const remove = jest.fn();
    (useVideoPlayer as jest.Mock).mockReturnValue({
      status: "readyToPlay",
      addListener: (name: string, fn: (v?: unknown) => void) => {
        events[name] = fn;
        return { remove };
      },
    });
    const onEnd = jest.fn();
    const view = render(
      <VideoPlayer source={{ type: "local", source: 123 }} onEnd={onEnd} />,
    );
    await act(async () => { await Promise.resolve(); });
    expect(onEnd).not.toHaveBeenCalled();
    act(() => events.playToEnd());
    expect(onEnd).toHaveBeenCalledTimes(1);
    act(() =>
      events.statusChange({ status: "error", error: { message: "failed" } }),
    );
    expect(screen.getByTestId("video-player-placeholder")).toBeTruthy();
    expect(screen.getByText("Handa na ang video para sa aralin na ito.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Subukan muli" })).toBeTruthy();
    view.unmount();
    expect(remove).toHaveBeenCalled();
    Platform.OS = old;
  });
  it("emits audio completion once even when the callback changes", async () => {
    (useAudioPlayerStatus as jest.Mock).mockReturnValue({ isLoaded: true, playing: false, didJustFinish: true });
    const first = jest.fn();
    const second = jest.fn();
    const view = render(<AudioPlayer source={{ type: 'local', source: 123 }} title="Audio" onEnd={first} />);
    await screen.findByText("Audio");
    expect(first).toHaveBeenCalledTimes(1);
    view.rerender(<AudioPlayer source={{ type: 'local', source: 123 }} title="Audio" onEnd={second} />);
    expect(second).not.toHaveBeenCalled();
    view.unmount();
  });

});
