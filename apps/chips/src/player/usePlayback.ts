import { useCallback, useEffect, useState } from 'react';
import { advance, clampSeek } from './playback';

export function usePlayback(duration: number, speed: number, autoplay: boolean) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(autoplay);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let id = requestAnimationFrame(function frame(now) {
      const dt = (now - last) / 1000;
      last = now;
      setTime((t) => advance(t, dt, speed, duration));
      id = requestAnimationFrame(frame);
    });
    return () => cancelAnimationFrame(id);
  }, [playing, speed, duration]);

  const seek = useCallback(
    (x: number) => {
      setPlaying(false);
      setTime(clampSeek(x, duration));
    },
    [duration],
  );
  const reset = useCallback(() => setTime(0), []);
  return { time, playing, setPlaying, seek, reset };
}
