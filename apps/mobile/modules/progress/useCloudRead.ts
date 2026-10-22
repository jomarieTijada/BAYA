import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Result } from '../cloud/services';

/** Focus refresh and request invalidation shared by settings and mentor views. */
export function useCloudRead<T>(read: () => Promise<Result<T>>) {
  const [result, setResult] = useState<Result<T>>();
  const [revision, setRevision] = useState(0);
  useFocusEffect(useCallback(() => {
    void revision;
    let current = true;
    setResult(undefined);
    void read().then(value => { if (current) setResult(value); }).catch(() => {
      if (current) setResult({ ok: false, code: 'network' });
    });
    return () => { current = false; };
  }, [read, revision]));
  return { result, refresh: () => setRevision(n => n + 1) };
}
