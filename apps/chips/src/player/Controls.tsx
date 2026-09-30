import { useI18n } from '../i18n/i18n';
import { SPEEDS, VIEW_NAMES, type Settings } from '../settings';
import type { Trick } from '../tricks/types';

type Props = {
  trick: Trick;
  time: number;
  playing: boolean;
  settings: Settings;
  onToggle: () => void;
  onSeek: (t: number) => void;
  onStep: (dir: 1 | -1) => void;
  onSettings: (patch: Partial<Settings>) => void;
};

export function Controls({ trick, time, playing, settings, onToggle, onSeek, onStep, onSettings }: Props) {
  const { t } = useI18n();
  return (
    <div className="controls">
      <div className="seek">
        <input
          type="range"
          aria-label={t('player.seek')}
          min={0}
          max={trick.duration}
          step={0.01}
          value={time}
          onChange={(e) => onSeek(Number(e.target.value))}
        />
        <div className="ticks" aria-hidden="true">
          {trick.steps.slice(1).map((s) => (
            <i key={s.from} style={{ left: `${(s.from / trick.duration) * 100}%` }} />
          ))}
        </div>
      </div>
      <div className="transport">
        <button aria-label={t('player.prev')} onClick={() => onStep(-1)}>
          ⏮
        </button>
        <button className="play" aria-label={t(playing ? 'player.pause' : 'player.play')} onClick={onToggle}>
          {playing ? '⏸' : '▶'}
        </button>
        <button aria-label={t('player.next')} onClick={() => onStep(1)}>
          ⏭
        </button>
      </div>
      <div className="option-row">
        <span>{t('player.speed')}</span>
        <div className="chips">
          {SPEEDS.map((s) => (
            <button key={s} className="chip" aria-pressed={settings.speed === s} onClick={() => onSettings({ speed: s })}>
              {s}×
            </button>
          ))}
        </div>
        <span className="spacer" />
        <button className="chip" aria-pressed={settings.mirror} onClick={() => onSettings({ mirror: !settings.mirror })}>
          ⇆ {t('player.mirror')}
        </button>
      </div>
      <div className="option-row">
        <span>{t('player.view')}</span>
        <div className="chips">
          {VIEW_NAMES.map((v) => (
            <button key={v} className="chip" aria-pressed={settings.view === v} onClick={() => onSettings({ view: v })}>
              {t(`view.${v}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
