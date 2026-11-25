jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({ play: jest.fn(), pause: jest.fn(), remove: jest.fn(), addListener: jest.fn(() => ({ remove: jest.fn() })) })),
  useAudioPlayer: jest.fn(() => ({ isLoaded: true, play: jest.fn(), pause: jest.fn(), seekTo: jest.fn() })),
  useAudioPlayerStatus: jest.fn(() => ({ isLoaded: true, playing: false, didJustFinish: false })),
}));
jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({ status: 'readyToPlay', addListener: jest.fn(() => ({ remove: jest.fn() })) })),
  VideoView: 'VideoView',
}));
