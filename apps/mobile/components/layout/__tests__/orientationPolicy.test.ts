import { installLandscapeLock, isMobileBrowser } from '../orientationPolicy';

it.each([
  ['Android', 'Linux armv8l', 5, true],
  ['iPhone', 'iPhone', 5, true],
  ['iPad', 'iPad', 5, true],
  ['Macintosh', 'MacIntel', 5, true],
  ['Macintosh', 'MacIntel', 0, false],
  ['Windows', 'Win32', 10, false],
])('detects device %s/%s with %i touch points', (userAgent, platform, maxTouchPoints, expected) => {
  expect(isMobileBrowser({ userAgent, platform, maxTouchPoints })).toBe(expected);
});

function browserFixture(standalone = false) {
  const displayMode = { matches: standalone, addEventListener: jest.fn(), removeEventListener: jest.fn() };
  const lock = jest.fn(async () => {});
  const browser = {
    navigator: { userAgent: 'Android', platform: 'Linux', maxTouchPoints: 5 },
    matchMedia: () => displayMode,
    screen: { orientation: { lock } },
    document: { fullscreenElement: null as unknown, addEventListener: jest.fn(), removeEventListener: jest.fn() },
  };
  return { browser, lock, displayMode, install: () => installLandscapeLock(browser as unknown as Window) };
}

it('leaves ordinary browser tabs alone and attempts once when fullscreen becomes eligible', () => {
  const { browser, lock, install } = browserFixture();
  const cleanup = install();
  expect(lock).not.toHaveBeenCalled();
  const change = browser.document.addEventListener.mock.calls[0][1];
  browser.document.fullscreenElement = {};
  change(); change();
  expect(lock).toHaveBeenCalledTimes(1);
  expect(lock).toHaveBeenCalledWith('landscape');
  cleanup();
  expect(browser.document.removeEventListener).toHaveBeenCalledWith('fullscreenchange', change);
});

it('tolerates unavailable APIs and rejected installed-app locks without a retry loop', async () => {
  const fixture = browserFixture(true);
  fixture.lock.mockRejectedValue(new Error('Not supported'));
  fixture.install();
  await Promise.resolve();
  fixture.displayMode.addEventListener.mock.calls[0][1]();
  expect(fixture.lock).toHaveBeenCalledTimes(1);
  (fixture.browser.screen as any).orientation = undefined;
  expect(fixture.install).not.toThrow();
});
