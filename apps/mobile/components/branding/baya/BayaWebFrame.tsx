import React, { useEffect, useRef, type CSSProperties } from 'react';

/** Swap already-decoded DOM images atomically, retaining the previous frame while loading. */
export function BayaWebFrame({ uri, style }: { uri: string; style: CSSProperties }) {
  const host = useRef<HTMLDivElement>(null);
  const frames = useRef(new Map<string, HTMLImageElement>());
  const latestStyle = useRef(style);
  useEffect(() => { latestStyle.current = style; }, [style]);

  useEffect(() => {
    let active = true;
    let frame = frames.current.get(uri);
    if (!frame) {
      frame = new window.Image();
      frame.alt = '';
      frame.setAttribute('aria-hidden', 'true');
      frame.draggable = false;
      frame.decoding = 'sync';
      frame.src = uri;
      frames.current.set(uri, frame);
    }
    const decodedFrame = frame;
    const show = () => {
      if (!active || !host.current) return;
      Object.assign(decodedFrame.style, latestStyle.current);
      host.current.replaceChildren(decodedFrame);
    };
    void decodedFrame.decode().then(show).catch(() => {
      // Preserve the last valid frame, and allow a later attempt to retry this URI.
      frames.current.delete(uri);
    });
    return () => { active = false; };
  }, [uri]);

  useEffect(() => {
    const frame = host.current?.firstElementChild as HTMLImageElement | null;
    if (frame) Object.assign(frame.style, style);
  }, [style]);

  return <div ref={host} aria-hidden="true" style={{ position: 'absolute', inset: 0 }} />;
}
