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
