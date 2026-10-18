/** iPadOS may identify as a Mac. Touch-enabled desktop Windows is still desktop. */
export function isMobileBrowser(navigatorInfo: Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'>) {
  return /Android|iPhone|iPad|iPod/i.test(navigatorInfo.userAgent)
    || (navigatorInfo.platform === 'MacIntel' && navigatorInfo.maxTouchPoints > 1);
}

/** Attempt only in installed/fullscreen contexts. Rejections use the visible fallback. */
export function installLandscapeLock(browser: Window) {
  if (!isMobileBrowser(browser.navigator)) return () => {};
  const displayMode = browser.matchMedia?.('(display-mode: standalone)');
  let wasEligible = false;
  const request = () => {
    const eligible = Boolean(displayMode?.matches
      || (browser.navigator as Navigator & { standalone?: boolean }).standalone
      || browser.document.fullscreenElement);
    if (eligible && !wasEligible) {
      const orientation = browser.screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
      try { void orientation?.lock?.('landscape').catch(() => {}); } catch { /* Unsupported environments keep the rotate prompt. */ }
    }
    wasEligible = eligible;
  };
  request();
  displayMode?.addEventListener?.('change', request);
  browser.document.addEventListener('fullscreenchange', request);
  return () => {
    displayMode?.removeEventListener?.('change', request);
    browser.document.removeEventListener('fullscreenchange', request);
  };
}
