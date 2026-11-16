import React from 'react';
import { act, render } from '@testing-library/react-native';
import { NavigationContext } from 'expo-router/react-navigation';
import { useDialogBack } from '../useDialogBack';
jest.mock('expo-router/react-navigation', () => ({ NavigationContext: require('react').createContext(undefined) }));
function Dialog({ visible = true, busy = false, close }: { visible?: boolean; busy?: boolean; close: () => void }) { useDialogBack(visible, close, busy); return null; }
it('consumes only the topmost overlay, blocks busy dismissal and cleans listeners', () => {
  const listeners = new Set<(event: any) => void>();
  const navigation = { addListener: (_: string, fn: (event: any) => void) => { listeners.add(fn); return () => listeners.delete(fn); } };
  const first = jest.fn(), second = jest.fn();
  const tree = (busy: boolean, secondVisible = true) => <NavigationContext.Provider value={navigation as any}><Dialog close={first} /><Dialog visible={secondVisible} busy={busy} close={second} /></NavigationContext.Provider>;
  const view = render(tree(false));
  const event = { data: { action: { type: 'GO_BACK' } }, preventDefault: jest.fn() };
  act(() => listeners.forEach(fn => fn(event)));
  expect(second).toHaveBeenCalledTimes(1); expect(first).not.toHaveBeenCalled(); expect(event.preventDefault).toHaveBeenCalledTimes(1);
  view.rerender(tree(true)); act(() => listeners.forEach(fn => fn(event))); expect(second).toHaveBeenCalledTimes(1);
  view.rerender(tree(false, false)); act(() => listeners.forEach(fn => fn(event))); expect(first).toHaveBeenCalledTimes(1);
  view.unmount(); expect(listeners.size).toBe(0);
});
it('lets explicit replacement proceed after a dialog action', () => {
  let handler: (event: any) => void = () => {};
  const close = jest.fn(), preventDefault = jest.fn();
  const navigation = { addListener: (_: string, fn: typeof handler) => { handler = fn; return () => {}; } };
  render(<NavigationContext.Provider value={navigation as any}><Dialog close={close} /></NavigationContext.Provider>);
  act(() => handler({ data: { action: { type: 'REPLACE' } }, preventDefault }));
  expect(preventDefault).not.toHaveBeenCalled(); expect(close).not.toHaveBeenCalled();
});
