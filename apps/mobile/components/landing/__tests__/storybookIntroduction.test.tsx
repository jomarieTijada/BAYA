import { OrientationBlockedContext } from '../../layout/OrientationVisibility';
import React, { StrictMode } from 'react';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';
import { Modal, Platform } from 'react-native';
import { createIntroductionSession, createIntroductionStorage, STORYBOOK_INTRO_KEY } from '../storybookIntroduction';
import { useStorybookIntroduction } from '../useStorybookIntroduction';
import { OriginStorybook } from '../OriginStorybook';
import { StorybookSettings } from '../StorybookSettings';
import { LocalizationProvider } from '../../../localization/LocalizationProvider';
import type { DatabaseConnection } from '../../../database/types';

jest.mock('../../../database/lifecycle', () => ({ getReadyDatabase: jest.fn() }));
jest.mock('../../../hooks/useReducedMotionPreference', () => ({ useReducedMotionPreference: () => true }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('expo-router', () => ({ useFocusEffect: (cb: () => void) => { const React = jest.requireActual('react'); React.useEffect(cb, [cb]); } }));
jest.mock('../../branding/BayaMascot', () => ({ BayaMascot: () => null }));

function fixture(seen = false) {
  const storage = { load: jest.fn(async () => seen), save: jest.fn(async () => {}) };
  return { storage, session: createIntroductionSession(storage) };
}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }

it.each([undefined, 'false', 'broken', 'true'])('reads the installation preference safely: %s', async value => {
  const db = { getFirstAsync: jest.fn(async () => value === undefined ? null : { state_value: value }), runAsync: jest.fn() };
  const storage = createIntroductionStorage(async () => db as unknown as DatabaseConnection);
  expect(await storage.load()).toBe(value === 'true');
  await storage.save();
  expect(db.getFirstAsync.mock.calls[0]).toEqual(['SELECT state_value FROM local_app_state WHERE state_key = ?;', [STORYBOOK_INTRO_KEY]]);
  expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT'), [STORYBOOK_INTRO_KEY, 'true']);
});

it('waits for storage before opening, starts once under Strict Mode, and survives remount', async () => {
  const { storage, session } = fixture(); const read = deferred<boolean>(); storage.load.mockReturnValue(read.promise);
  const first = renderHook(() => useStorybookIntroduction(true, session), { wrapper: ({ children }) => <StrictMode>{children}</StrictMode> });
  expect(first.result.current.mode).toBeNull();
  await act(async () => read.resolve(false));
  expect(first.result.current.mode).toBe('automatic');
  expect(storage.load).toHaveBeenCalledTimes(1);
  first.unmount();
  const next = renderHook(() => useStorybookIntroduction(true, session));
  await act(async () => {});
  expect(next.result.current.mode).toBeNull();
  expect(storage.save).not.toHaveBeenCalled();
});

it('suppresses acknowledged introductions across new sessions and repeated role/language renders', async () => {
  const { session, storage } = fixture(true);
  const hook = renderHook<ReturnType<typeof useStorybookIntroduction>, { active: boolean }>(({ active }) => useStorybookIntroduction(active, session), { initialProps: { active: true } });
  await act(async () => {});
  expect(hook.result.current.mode).toBeNull();
  hook.rerender({ active: false }); hook.rerender({ active: true });
  await act(async () => {});
  expect(hook.result.current.mode).toBeNull();
  expect(storage.save).not.toHaveBeenCalled();
});

it.each(['navigation', 'unmount', 'ineligible'])('cancels a late hydration result after %s', async kind => {
  const { session, storage } = fixture(); const read = deferred<boolean>(); storage.load.mockReturnValue(read.promise);
  const hook = renderHook<ReturnType<typeof useStorybookIntroduction>, { active: boolean }>(({ active }) => useStorybookIntroduction(active, session), { initialProps: { active: true } });
  if (kind === 'navigation') act(() => hook.result.current.leaveWelcome());
  if (kind === 'unmount') hook.unmount();
  if (kind === 'ineligible') hook.rerender({ active: false });
  await act(async () => read.resolve(false));
  expect(hook.result.current.mode).toBeNull();
  expect(storage.save).not.toHaveBeenCalled();
});

it('does not open automatically after a manual replay races hydration', async () => {
  const { session, storage } = fixture(); const read = deferred<boolean>(); storage.load.mockReturnValue(read.promise);
  const hook = renderHook(() => useStorybookIntroduction(true, session));
  act(() => hook.result.current.openManual()); act(() => hook.result.current.close());
  await act(async () => read.resolve(false));
  expect(hook.result.current.mode).toBeNull(); expect(storage.save).not.toHaveBeenCalled();
});

it('allows dismissal on read/write failures, logs nonpersistence, and never retries in a loop', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const { session, storage } = fixture();
    storage.load.mockRejectedValue(new Error('read blocked')); storage.save.mockRejectedValue(new Error('write blocked'));
    const hook = renderHook(() => useStorybookIntroduction(true, session));
    await waitFor(() => expect(hook.result.current.mode).toBe('automatic'));
    act(() => { hook.result.current.close(); hook.result.current.close(); });
    expect(hook.result.current.mode).toBeNull();
    expect(await session.acknowledge()).toBe(false);
    expect(storage.save).toHaveBeenCalledTimes(1); expect(session.claim()).toBe(false);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('NOT saved'), expect.any(Error));
  } finally { warning.mockRestore(); }
});

it('synchronizes another tab’s acknowledgement but preserves an explicit replay', async () => {
  const { session, storage } = fixture();
  const hook = renderHook(() => useStorybookIntroduction(true, session));
  await waitFor(() => expect(hook.result.current.mode).toBe('automatic'));
  act(() => session.acceptExternalAcknowledgement());
  expect(hook.result.current.mode).toBeNull();
  act(() => hook.result.current.openManual()); act(() => session.acceptExternalAcknowledgement());
  expect(hook.result.current.mode).toBe('manual'); expect(storage.save).not.toHaveBeenCalled();
});

it.each(['Close the story', 'Finish Reading', 'Android Back'])('%s acknowledges only intentional automatic dismissal', async action => {
  const { session, storage } = fixture();
  function Introduction() { const story = useStorybookIntroduction(true, session); return story.mode ? <OriginStorybook onClose={story.close} /> : null; }
  const view = render(<Introduction />);
  await view.findByText('Meet BAYA!');
  expect(storage.save).not.toHaveBeenCalled();
  if (action === 'Finish Reading') for (let i = 0; i < 4; i++) fireEvent.press(view.getByLabelText('Next'));
  if (action === 'Android Back') fireEvent(view.UNSAFE_getByType(Modal), 'requestClose');
  else fireEvent.press(view.getByLabelText(action));
  await waitFor(() => expect(storage.save).toHaveBeenCalledTimes(1));
  expect(view.queryByTestId('origin-storybook')).toBeNull();
});

it.each(['en', 'tl'] as const)('Settings reuses the book from page one repeatedly in %s', async language => {
  const storage = { load: async () => language, save: jest.fn() };
  const view = render(<LocalizationProvider storage={storage}><StorybookSettings /></LocalizationProvider>);
  const trigger = await view.findByTestId('storybook-settings-trigger');
  expect(trigger.props.accessibilityRole).toBe('button');
  expect(trigger.props.accessibilityLabel).toBe(language === 'en' ? 'Read BAYA’s Story' : 'Basahin ang Kuwento ng BAYA');
  for (let n = 0; n < 2; n++) {
    fireEvent.press(trigger);
    expect(view.getByText(language === 'en' ? 'Meet BAYA!' : 'Kilalanin ang BAYA!')).toBeTruthy();
    fireEvent.press(view.getByLabelText(language === 'en' ? 'Next' : 'Susunod'));
    fireEvent.press(view.getByLabelText(language === 'en' ? 'Close the story' : 'Isara ang kuwento'));
    expect(view.queryByTestId('origin-storybook')).toBeNull();
    expect(view.getByTestId('storybook-settings-trigger')).toBeTruthy();
  }
  expect(storage.save).not.toHaveBeenCalled();
});

it('handles browser close requests and destroys the watcher on unmount', () => {
  const originalPlatform = Platform.OS;
  const browser = globalThis as unknown as { window?: object };
  const originalWindow = browser.window;
  const destroy = jest.fn();
  let close: (() => void) | undefined;
  class Watcher {
    addEventListener(_event: string, handler: () => void) { close = handler; }
    removeEventListener() { close = undefined; }
    destroy = destroy;
  }
  const onClose = jest.fn();
  try {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    browser.window = { CloseWatcher: Watcher };
    // No DOM is needed for the existing heading/keyboard fallback in this renderer.
    const originalDocument = globalThis.document;
    Object.defineProperty(globalThis, 'document', { configurable: true, value: { addEventListener: jest.fn(), removeEventListener: jest.fn() } });
    try {
      const view = render(<OriginStorybook onClose={onClose} />);
      act(() => close?.()); expect(onClose).toHaveBeenCalledTimes(1);
      view.unmount(); expect(destroy).toHaveBeenCalledTimes(1); expect(close).toBeUndefined();
    } finally { Object.defineProperty(globalThis, 'document', { configurable: true, value: originalDocument }); }
  } finally {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
    browser.window = originalWindow;
  }
});


it('keeps the story behind the orientation warning without acknowledging or resetting it', async () => {
  const close=jest.fn();
  const view=render(<OrientationBlockedContext.Provider value={true}><OriginStorybook onClose={close}/></OrientationBlockedContext.Provider>);
  expect(view.UNSAFE_getByType(Modal).props.visible).toBe(false);
  view.rerender(<OrientationBlockedContext.Provider value={false}><OriginStorybook onClose={close}/></OrientationBlockedContext.Provider>);
  expect(view.UNSAFE_getByType(Modal).props.visible).toBe(true);
  view.rerender(<OrientationBlockedContext.Provider value={true}><OriginStorybook onClose={close}/></OrientationBlockedContext.Provider>);
  expect(view.UNSAFE_getByType(Modal).props.visible).toBe(false);
  expect(close).not.toHaveBeenCalled();
});
