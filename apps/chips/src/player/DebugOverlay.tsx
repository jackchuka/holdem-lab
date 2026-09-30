import { keyWindow, stepAt, wrap } from '../timeline/timeline';
import type { Key, Trick } from '../tricks/types';

export function DebugOverlay({ trick, time }: { trick: Trick; time: number }) {
  const u = wrap(time, trick.duration);
  const row = <P,>(id: string, keys: Key<P>[]) => {
    const { prev, next } = keyWindow(keys, u);
    return `${id}: #${prev} ${keys[prev].t.toFixed(2)}s → #${next} ${keys[next].t.toFixed(2)}s`;
  };
  const rows = [
    ...Object.entries(trick.tracks.chips).map(([id, keys]) => row(id, keys)),
    ...Object.entries(trick.tracks.fingers).flatMap(([id, keys]) => (keys ? [row(id, keys)] : [])),
  ];
  return <pre className="debug">{[`t=${u.toFixed(3)}s step=${stepAt(trick, u) + 1}`, ...rows].join('\n')}</pre>;
}
