import { useEffect, useRef, useState, useCallback } from 'react';
import { failureMessage, type Result } from './services';
/** A synchronous lock prevents double presses before React has rendered disabled state. */
export function useOperation(messages = failureMessage) {
  const lock = useRef(false);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const run = useCallback(
    async <T>(
      operation: () => Promise<Result<T>>,
      success: (data: T) => void,
    ) => {
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      setMessage('');
      try {
        const result = await operation();
        if (!mounted.current) return;
        if (result.ok) success(result.data);
        else setMessage(messages[result.code]);
      } catch {
        if (mounted.current) setMessage(messages.network);
      } finally {
        lock.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    [messages],
  );
  return { busy, message, setMessage, run };
}
