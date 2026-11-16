import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, View } from 'react-native';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';

/** One transaction per turn; cancellation cannot commit a stale page after dismissal. */
export function useStorybookTurn(total: number) {
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const surface = useRef<View>(null);
  const animation = useRef<Animation | null>(null);
  const [fade] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotionPreference();
  const cancel = useCallback(() => {
    generation.current++;
    animation.current?.cancel();
    fade.stopAnimation();
    lock.current = false;
  }, [fade]);
  useEffect(() => cancel, [cancel]);
  const turn = async (direction: -1 | 1) => {
    if (lock.current || page + direction < 0 || page + direction >= total) return;
    lock.current = true;
    const revision = ++generation.current;
    const target = page + direction;
    if (reduced) { setPage(target); lock.current = false; return; }
    setBusy(true);
    const element = surface.current as unknown as HTMLElement | null;
    try {
      if (Platform.OS === 'web' && element?.animate) {
        // Turn away from the reader, so the outer edge recedes rather than
        // magnifying text beyond the clipping boundary.
        const angle = direction * 28;
        const run = async (frames: Keyframe[]) => {
          const effect = element.animate(frames, { duration: 240, easing: 'ease-in-out', fill: 'forwards' });
          animation.current = effect;
          await effect.finished;
        };
        const pivot = direction === 1 ? 'left center' : 'right center';
        const incomingPivot = direction === 1 ? 'right center' : 'left center';
        await run([{ transform: 'perspective(1400px) rotateY(0deg)', opacity: 1, transformOrigin: pivot },
          { transform: `perspective(1400px) rotateY(${angle * .6}deg)`, opacity: .85, transformOrigin: pivot, offset: .65 },
          { transform: `perspective(1400px) rotateY(${angle}deg)`, opacity: 0, transformOrigin: pivot, boxShadow: '16px 8px 28px rgba(85,66,42,.12)' }]);
        if (revision !== generation.current) return;
        setPage(target);
        // Let React paint the new page while the outgoing surface is invisible.
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        if (revision !== generation.current) return;
        animation.current?.cancel();
        await run([{ transform: `perspective(1400px) rotateY(${-angle}deg)`, opacity: 0, transformOrigin: incomingPivot },
          { transform: `perspective(1400px) rotateY(${-angle * .6}deg)`, opacity: .85, transformOrigin: incomingPivot, offset: .35 },
          { transform: 'perspective(1400px) rotateY(0deg)', opacity: 1, transformOrigin: incomingPivot }]);
        animation.current?.cancel();
      } else {
        await new Promise<void>(resolve => Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => resolve()));
        if (revision !== generation.current) return;
        setPage(target);
        await new Promise<void>(resolve => Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }).start(() => resolve()));
      }
    } catch {
      // An unsupported/failed effect must not strand an invisible reading page.
      if (revision === generation.current) setPage(target);
    }
    finally {
      if (revision === generation.current) {
        animation.current?.cancel();
        fade.setValue(1);
        lock.current = false;
        setBusy(false);
      }
    }
  };
  return { page, busy, surface, fade, turn };
}
