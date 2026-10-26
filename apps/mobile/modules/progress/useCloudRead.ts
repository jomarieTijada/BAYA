import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Result } from '../cloud/services';

/** Focus refresh and request invalidation shared by settings and mentor views. */
export function useCloudRead<T>(read: () => Promise<Result<T>>, preserveOnRefresh = false) {
  const [result, setResult] = useState<Result<T>>();
  const [refreshing, setRefreshing] = useState(false);
  const loader = useRef<() => Promise<Result<T> | undefined>>(async () => undefined);
  useFocusEffect(useCallback(() => {
    let current = true;
    let pending: Promise<Result<T> | undefined> | undefined;
    setResult(undefined);
    const load = () => {
      if (pending) return pending;
      setRefreshing(true);
      if (!preserveOnRefresh) setResult(undefined);
      pending = Promise.resolve().then(read).catch((): Result<T> => ({ ok: false, code: 'network' })).then(value => {
        if (!current) return undefined;
        setResult(previous => preserveOnRefresh && !value.ok && previous?.ok ? previous : value);
        return value;
      }).finally(() => { pending = undefined; if (current) setRefreshing(false); });
      return pending;
    };
    loader.current = load;
    void load();
    return () => { current = false; loader.current = async () => undefined; };
  }, [read, preserveOnRefresh]));
  const refresh = useCallback(() => loader.current(), []);
  return { result, refresh, refreshing };
}
