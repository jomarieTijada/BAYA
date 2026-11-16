import { useContext, useEffect, useRef } from 'react';
import { NavigationContext } from 'expo-router/react-navigation';

const dialogs: symbol[] = [];
/** Navigation removal belongs to the topmost dialog before its underlying route. */
export function useDialogBack(visible: boolean, dismiss: (() => void) | undefined, busy: boolean) {
  const navigation = useContext(NavigationContext);
  const id = useRef(Symbol('dialog'));
  const action = useRef({ dismiss, busy });
  action.current = { dismiss, busy };
  useEffect(() => {
    if (!visible) return;
    const token = id.current;
    dialogs.push(token);
    // Cancel a browser traversal before Expo receives popstate. No synthetic
    // history entries, URL rewrites, or compensating history.go() calls.
    const browserNavigation = typeof window === 'undefined' ? undefined : (window as unknown as { navigation?: EventTarget }).navigation;
    const onNavigate = (event: Event) => {
      if (dialogs.at(-1) !== token || (event as Event & { navigationType?: string }).navigationType !== 'traverse' || !event.cancelable) return;
      event.preventDefault();
      if (!action.current.busy) action.current.dismiss?.();
    };
    browserNavigation?.addEventListener('navigate', onNavigate);
    const unsubscribe = navigation?.addListener('beforeRemove', event => {
      if (dialogs.at(-1) !== token || event.data.action.type === 'REPLACE') return;
      event.preventDefault();
      if (!action.current.busy) action.current.dismiss?.();
    });
    return () => { browserNavigation?.removeEventListener('navigate', onNavigate); unsubscribe?.(); const index = dialogs.indexOf(token); if (index >= 0) dialogs.splice(index, 1); };
  }, [visible, navigation]);
}
