import type { Fortune } from '../fortune';
import { categoryName, useI18n } from '../i18n/i18n';
import { COMMENTS, TIPS } from '../i18n/texts';

const SUITS = ['♠', '♥', '♦', '♣'];

export function Result({ fortune }: { fortune: Fortune }) {
  const { t, locale } = useI18n();
  return (
    <div className="result">
      <div className="tier-block">
        <b data-testid="tier">{t(`tier.${fortune.tier}`)}</b>
        <span>
          {categoryName(fortune.category, locale)} · {t('result.handPower', { hc: fortune.handClass, pct: Math.round(fortune.preflopEquity * 100) })}
        </span>
      </div>
      <p className="panel">{COMMENTS[locale][fortune.tier][fortune.commentIndex]}</p>
      <div className="panel lucky">
        <div>
          <span>{t('lucky.position')}</span>
          <b>{fortune.luckyPosition}</b>
        </div>
        <div>
          <span>{t('lucky.suit')}</span>
          <b className={`suit-${fortune.luckySuit}`}>{SUITS[fortune.luckySuit]}</b>
        </div>
        <div>
          <span>{t('lucky.size')}</span>
          <b>{fortune.luckySize}%</b>
        </div>
      </div>
      <div className="panel">
        <span className="panel-label">{t('tip.title')}</span>
        <p>{TIPS[locale][fortune.tipIndex]}</p>
      </div>
    </div>
  );
}
