import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Result, FailureCode } from '../cloud/services';

/** Focus refresh, source ownership and request invalidation shared by cloud views. */
export function useCloudRead<T>(read: () => Promise<Result<T>>, preserveOnRefresh = false) {
  const [snapshot, setSnapshot] = useState<{ read: typeof read; result?: Result<T>; refreshError?: FailureCode }>();
  const [refreshing, setRefreshing] = useState(false);
  const loader = useRef<() => Promise<Result<T> | undefined>>(async () => undefined);
  useFocusEffect(useCallback(() => {
    let current = true;
    let pending: Promise<Result<T> | undefined> | undefined;
    setSnapshot({ read });
    const load = () => {
      if (pending) return pending;
      setRefreshing(true);
      if (!preserveOnRefresh) setSnapshot({ read });
      pending = Promise.resolve().then(read).catch((): Result<T> => ({ ok: false, code: 'network' })).then(value => {
        if (!current) return undefined;
        setSnapshot(previous => {
          // Only a transient connection failure may retain an explicitly stale snapshot.
          // Revoked/expired/invalid access must remove protected results immediately.
          if (preserveOnRefresh && !value.ok && ['network', 'offline'].includes(value.code) && previous?.read === read && previous.result?.ok) {
            return { read, result: previous.result, refreshError: value.code };
          }
          return { read, result: value };
        });
        return value;
      }).finally(() => { pending = undefined; if (current) setRefreshing(false); });
      return pending;
    };
    loader.current = load;
    void load();
    return () => { current = false; loader.current = async () => undefined; };
  }, [read, preserveOnRefresh]));
  const refresh = useCallback(() => loader.current(), []);
  const ownSnapshot = snapshot?.read === read ? snapshot : undefined;
  return { result: ownSnapshot?.result, refresh, refreshing, refreshError: ownSnapshot?.refreshError };
}
