import React, { useState } from 'react';
import { useLang } from '../i18n';

export interface TrendBucket {
  /** 這一格的起始日 YYYY-MM-DD */
  start: string;
  /** 顯示用標籤，例如 11/10 */
  label: string;
  picked: number;
  reports: number;
}

interface TrendChartProps {
  buckets: TrendBucket[];
  granularity: 'day' | 'week';
}

/** 單一數列長條圖：實際撿拾量隨時間變化；點或滑過長條看細節 */
const TrendChart: React.FC<TrendChartProps> = ({ buckets, granularity }) => {
  const { t } = useLang();
  const [active, setActive] = useState<number | null>(null);

  const max = Math.max(1, ...buckets.map(b => b.picked));
  const total = buckets.reduce((s, b) => s + b.picked, 0);
  // 預設顯示最後一格（最新），讓手機使用者不用先點就看得到數字
  const shownIdx = active ?? buckets.length - 1;
  const shown = buckets[shownIdx];

  if (buckets.length === 0) {
    return <div className="h-40 flex items-center justify-center text-sm text-slate-400">{t('這段期間沒有資料', 'No data in this period')}</div>;
  }

  const periodLabel = (b: TrendBucket) =>
    granularity === 'week' ? t(`${b.label} 那週`, `Week of ${b.label}`) : b.label;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2 min-h-[2.5rem]">
        {shown && (
          <div>
            <div className="text-[11px] text-slate-500">{periodLabel(shown)}</div>
            <div className="text-lg font-bold text-slate-800 tabular-nums">
              {shown.picked.toLocaleString()} <span className="text-xs font-medium text-slate-500">{t('根', 'butts')}</span>
              <span className="text-xs font-medium text-slate-500 ml-2">· {shown.reports} {t('筆回報', shown.reports === 1 ? 'report' : 'reports')}</span>
            </div>
          </div>
        )}
        <div className="text-right text-[11px] text-slate-500 tabular-nums">
          {t('期間合計', 'Period total')}<br />
          <b className="text-slate-700">{total.toLocaleString()}</b>
        </div>
      </div>

      <div className="relative h-32" onMouseLeave={() => setActive(null)}>
        {/* 最大值參考線 */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-200" />
        <span className="absolute right-0 -top-3.5 text-[9px] text-slate-400 bg-white pl-1 tabular-nums">{max.toLocaleString()}</span>
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {buckets.map((b, i) => {
            const h = b.picked > 0 ? Math.max(3, (b.picked / max) * 100) : 0;
            const isActive = i === shownIdx;
            return (
              <button
                key={b.start}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-label={`${periodLabel(b)}: ${b.picked} ${t('根', 'butts')}`}
                className="flex-1 h-full flex items-end min-w-0 cursor-pointer"
              >
                <span
                  className={`w-full rounded-t-[4px] transition-colors ${isActive ? 'bg-emerald-700' : 'bg-emerald-400'}`}
                  style={{ height: `${h}%` }}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div className="border-t border-slate-300" />
      <div className="flex justify-between text-[10px] text-slate-400 mt-1 tabular-nums">
        <span>{buckets[0].label}</span>
        {buckets.length > 2 && <span>{buckets[Math.floor(buckets.length / 2)].label}</span>}
        <span>{buckets[buckets.length - 1].label}</span>
      </div>
    </div>
  );
};

export default TrendChart;
