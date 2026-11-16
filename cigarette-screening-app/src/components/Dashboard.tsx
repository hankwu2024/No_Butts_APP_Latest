import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, BarChart3, AlertTriangle, Building2, TrendingUp, Trophy, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { pb } from '../config/pocketbase';
import { cityName } from '../constants';
import type { ScreeningData, FilterState, SortState } from '../types';
import { useLang } from '../i18n';
import FilterSortBar from './FilterSortBar';
import RouteMap, { type MapMode } from './RouteMap';
import Tower101Progress from './Tower101Progress';
import TrendChart, { type TrendBucket } from './TrendChart';

type Range = 7 | 30 | 90 | 'all';

// ---- 日期小工具（一律用本地時間的 YYYY-MM-DD）----
const toYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const mondayOf = (d: Date) => {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
const shortLabel = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

/** 英雄榜只露出部分名字：王小明 → 王○明、Hank Wu → Hank W. */
const maskName = (name: string) => {
  const n = name.trim();
  if (!n) return '';
  if (/^[\x20-\x7e]+$/.test(n)) {
    const parts = n.split(/\s+/);
    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
  }
  const chars = Array.from(n);
  if (chars.length <= 1) return n;
  if (chars.length === 2) return `${chars[0]}○`;
  return chars[0] + '○'.repeat(chars.length - 2) + chars[chars.length - 1];
};

const sumPicked = (rows: ScreeningData[]) => rows.reduce((s, r) => s + (r.actualPickedCount || 0), 0);
const sumScreened = (rows: ScreeningData[]) => rows.reduce((s, r) => s + (r.screenedCount || 0), 0);
const sumHotspots = (rows: ScreeningData[]) => rows.reduce((s, r) => s + (r.hotspots?.length || 0), 0);

const Dashboard: React.FC = () => {
  const { t, lang } = useLang();
  const [data, setData] = useState<ScreeningData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const [filter, setFilter] = useState<FilterState>({ city: '', dateStart: '', dateEnd: '', address: '', recordId: '', personnel: '' });
  const [sort, setSort] = useState<SortState>({ field: 'recordId', direction: 'desc' });
  const [range, setRange] = useState<Range>(30);
  const [granularity, setGranularity] = useState<'day' | 'week'>('day');
  const [mapMode, setMapMode] = useState<MapMode>('actualPickedCount');

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setup = async () => {
      try {
        const records = await pb.collection('screenings').getFullList<ScreeningData>({ sort: '-created' });
        setData(records);
        setUpdatedAt(new Date());
        setLoading(false);

        unsubscribe = await pb.collection('screenings').subscribe<ScreeningData>('*', (e) => {
          setData(prev => {
            if (e.action === 'create') return [e.record, ...prev];
            if (e.action === 'delete') return prev.filter(r => r.id !== e.record.id);
            if (e.action === 'update') return prev.map(r => r.id === e.record.id ? e.record : r);
            return prev;
          });
          setUpdatedAt(new Date());
        });
      } catch (err) {
        console.error("PocketBase connection error:", err);
        setLoading(false);
      }
    };

    setup();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 篩選列的條件（不含上方的時間區間）
  const filteredSortedData = useMemo(() => {
    let res = [...data];
    if (filter.city) res = res.filter(r => r.cityCode === filter.city);
    if (filter.dateStart) res = res.filter(r => r.date >= filter.dateStart);
    if (filter.dateEnd) res = res.filter(r => r.date <= filter.dateEnd);
    if (filter.recordId) {
      const lower = filter.recordId.toLowerCase();
      res = res.filter(r => r.recordId.toLowerCase().includes(lower));
    }
    if (filter.address) {
      const lower = filter.address.toLowerCase();
      res = res.filter(r =>
        r.startAddress.includes(lower) ||
        (r.endAddress && r.endAddress.includes(lower))
      );
    }
    if (filter.personnel) {
      const lower = filter.personnel.toLowerCase();
      res = res.filter(r =>
        (r.recorderName && r.recorderName.toLowerCase().includes(lower)) ||
        (r.screenerName && r.screenerName.toLowerCase().includes(lower)) ||
        (r.photographerName && r.photographerName.toLowerCase().includes(lower))
      );
    }

    res.sort((a, b) => {
      const valA = a[sort.field];
      const valB = b[sort.field];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      const diff = Number(valA) - Number(valB);
      return sort.direction === 'asc' ? diff : -diff;
    });
    return res;
  }, [data, filter, sort]);

  // 時間區間：本期與前一期（同樣長度），用來算「比上一期」
  const { current, previous } = useMemo(() => {
    if (range === 'all') return { current: filteredSortedData, previous: null as ScreeningData[] | null };
    const today = startOfToday();
    const curStart = toYmd(addDays(today, -(range - 1)));
    const prevStart = toYmd(addDays(today, -(range * 2 - 1)));
    const todayStr = toYmd(today);
    return {
      current: filteredSortedData.filter(r => r.date >= curStart && r.date <= todayStr),
      previous: filteredSortedData.filter(r => r.date >= prevStart && r.date < curStart),
    };
  }, [filteredSortedData, range]);

  const kpis = useMemo(() => {
    const mk = (fn: (rows: ScreeningData[]) => number) => ({
      value: fn(current),
      prev: previous ? fn(previous) : null,
    });
    return {
      picked: mk(sumPicked),
      screened: mk(sumScreened),
      reports: mk(rows => rows.length),
      hotspots: mk(sumHotspots),
    };
  }, [current, previous]);

  const trend = useMemo<TrendBucket[]>(() => {
    const today = startOfToday();
    const buckets: TrendBucket[] = [];
    if (granularity === 'day') {
      const days = range === 'all' ? 90 : range;
      for (let i = days - 1; i >= 0; i--) {
        const d = addDays(today, -i);
        buckets.push({ start: toYmd(d), label: shortLabel(d), picked: 0, reports: 0 });
      }
    } else {
      let first: Date;
      if (range === 'all') {
        const earliest = current.reduce<string | null>((m, r) => (!m || r.date < m ? r.date : m), null);
        first = earliest ? new Date(`${earliest}T00:00:00`) : addDays(today, -7 * 11);
        // 最多畫一年，避免長條細到點不到
        const limit = addDays(today, -7 * 51);
        if (first < limit) first = limit;
      } else {
        first = addDays(today, -(range - 1));
      }
      for (let d = mondayOf(first); d <= today; d = addDays(d, 7)) {
        buckets.push({ start: toYmd(d), label: shortLabel(d), picked: 0, reports: 0 });
      }
    }
    // 依起始日把每筆資料放進對應的格子（早於第一格或晚於今天的不算）
    const todayStr = toYmd(today);
    current.forEach(r => {
      if (r.date > todayStr) return;
      for (let i = buckets.length - 1; i >= 0; i--) {
        if (r.date >= buckets[i].start) {
          buckets[i].picked += r.actualPickedCount || 0;
          buckets[i].reports += 1;
          break;
        }
      }
    });
    return buckets;
  }, [current, granularity, range]);

  const cityStats = useMemo(() => {
    const map = new Map<string, { reports: number; picked: number }>();
    current.forEach(r => {
      const s = map.get(r.cityCode) || { reports: 0, picked: 0 };
      s.reports += 1;
      s.picked += r.actualPickedCount || 0;
      map.set(r.cityCode, s);
    });
    const total = sumPicked(current) || 1;
    return Array.from(map.entries())
      .map(([code, s]) => ({ code, name: cityName(code, lang), ...s, share: s.picked / total }))
      .sort((a, b) => b.picked - a.picked);
  }, [current, lang]);

  const heroes = useMemo(() => {
    const map = new Map<string, { picked: number; reports: number }>();
    current.forEach(r => {
      const name = (r.recorderName || '').trim();
      if (!name) return;
      const s = map.get(name) || { picked: 0, reports: 0 };
      s.picked += r.actualPickedCount || 0;
      s.reports += 1;
      map.set(name, s);
    });
    return Array.from(map.entries())
      .map(([name, s]) => ({ name: maskName(name), ...s }))
      .sort((a, b) => b.picked - a.picked)
      .slice(0, 5);
  }, [current]);

  const latest = useMemo(
    () => [...current].sort((a, b) => (b.date + (b.created || '')).localeCompare(a.date + (a.created || ''))).slice(0, 5),
    [current]
  );

  // 101 進度看的是全部資料，篩選時大樓不會「掉下去」
  const grandTotalPicked = useMemo(() => sumPicked(data), [data]);

  if (loading) return <div className="p-8 text-center text-slate-500">{t('載入數據中...', 'Loading data...')}</div>;

  const rangeOptions: { value: Range; label: string }[] = [
    { value: 7, label: t('近 7 天', '7 days') },
    { value: 30, label: t('近 30 天', '30 days') },
    { value: 90, label: t('近 90 天', '90 days') },
    { value: 'all', label: t('全部', 'All') },
  ];
  const prevLabel = range === 'all' ? '' : t(`比前 ${range} 天`, `vs prev. ${range} days`);
  const mapModes: { value: MapMode; label: string }[] = [
    { value: 'actualPickedCount', label: t('實際撿拾', 'Picked up') },
    { value: 'screenedCount', label: t('快篩估計', 'Estimated') },
    { value: 'recency', label: t('新舊', 'Recency') },
  ];
  const timeStr = updatedAt
    ? updatedAt.toLocaleTimeString(lang === 'en' ? 'en-US' : 'zh-TW', { hour: '2-digit', minute: '2-digit' })
    : '';
  const routeCount = current.filter(d => d.path && d.path.length > 1).length;

  return (
    <div className="pb-20 -mx-4 -mt-4">
      {/* 標題與資料新鮮度 */}
      <div className="bg-emerald-600 text-white px-5 pt-5 pb-6 rounded-b-3xl mb-4 shadow-lg">
        <h2 className="text-xl font-bold mb-1">{t('公部門決策儀表板', 'Public Decision Dashboard')}</h2>
        <p className="text-emerald-100 text-sm">{t('環境部 / 衛生局 數據參考', 'Reference data for environment & health agencies')}</p>
        <p className="mt-2 text-[11px] text-emerald-50 flex items-center gap-1.5">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-white opacity-60 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-white" />
          </span>
          {t(`即時更新 · 截至 ${timeStr}`, `Live · updated ${timeStr}`)}
        </p>
      </div>

      {/* 時間區間：下面所有區塊一起跟著變 */}
      <div className="px-4 mb-3">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {rangeOptions.map(o => (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => setRange(o.value)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${range === o.value ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mb-4">
         <FilterSortBar filter={filter} setFilter={setFilter} sort={sort} setSort={setSort}
            onReset={() => {
              setFilter({ city: '', dateStart: '', dateEnd: '', address: '', recordId: '', personnel: '' });
              setSort({ field: 'recordId', direction: 'desc' });
            }}
         />
      </div>

      {/* 核心數字 */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-6">
        <KpiTile label={t('實際撿拾 (根)', 'Butts picked up')} value={kpis.picked.value} prev={kpis.picked.prev} prevLabel={prevLabel} valueClass="text-blue-600" />
        <KpiTile label={t('快篩估計 (根)', 'Butts estimated')} value={kpis.screened.value} prev={kpis.screened.prev} prevLabel={prevLabel} valueClass="text-emerald-600" />
        <KpiTile label={t('回報筆數', 'Reports')} value={kpis.reports.value} prev={kpis.reports.prev} prevLabel={prevLabel} valueClass="text-slate-700" />
        <KpiTile
          label={t('熱點數 (>50根/m²)', 'Hotspots (>50/m²)')}
          value={kpis.hotspots.value}
          prev={kpis.hotspots.prev}
          prevLabel={prevLabel}
          valueClass="text-orange-600"
          icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
          upIsBad
        />
      </div>

      {/* 趨勢 */}
      <Section
        icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
        title={t('撿拾量趨勢', 'Pickup trend')}
        action={
          <Segmented
            value={granularity}
            onChange={setGranularity}
            options={[{ value: 'day', label: t('依日', 'Daily') }, { value: 'week', label: t('依週', 'Weekly') }]}
          />
        }
      >
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 pt-3">
          <TrendChart buckets={trend} granularity={granularity} />
          {range === 'all' && granularity === 'day' && (
            <p className="text-[10px] text-slate-400 mt-2">{t('依日只顯示最近 90 天；看更久請切到「依週」。', 'Daily view shows the last 90 days. Switch to Weekly for longer.')}</p>
          )}
        </div>
      </Section>

      {/* 地圖 */}
      <Section icon={<MapPin className="w-5 h-5 text-emerald-600" />} title={t('路線分佈地圖', 'Route map')}>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center justify-between gap-2">
            <Segmented value={mapMode} onChange={setMapMode} options={mapModes} />
            <span className="text-[10px] text-slate-400 shrink-0">
              {routeCount} {t('筆路線', routeCount === 1 ? 'route' : 'routes')}
            </span>
          </div>
          <RouteMap data={current} mode={mapMode} />
        </div>
      </Section>

      {/* 縣市分區統計 */}
      <Section icon={<BarChart3 className="w-5 h-5 text-emerald-600" />} title={t('各縣市實際撿拾量', 'Butts picked up by city')}>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {cityStats.length > 0 && (
            <div className="grid grid-cols-[1.5rem_1fr_3.5rem_3.5rem] gap-2 px-3 py-2 text-[10px] font-bold text-slate-400 border-b border-slate-100">
              <span>#</span>
              <span>{t('縣市', 'City')}</span>
              <span className="text-right">{t('撿拾', 'Picked')}</span>
              <span className="text-right">{t('佔比', 'Share')}</span>
            </div>
          )}
          {cityStats.map((c, idx) => (
            <div key={c.code} className="px-3 py-2.5 border-b border-slate-50 last:border-0">
              <div className="grid grid-cols-[1.5rem_1fr_3.5rem_3.5rem] gap-2 items-center">
                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${idx < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                  {idx + 1}
                </span>
                <span className="text-sm text-slate-700 font-medium truncate">
                  {c.name}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">{c.reports} {t('筆', c.reports === 1 ? 'report' : 'reports')}</span>
                </span>
                <span className="text-right font-mono text-sm text-slate-800 font-bold tabular-nums">{c.picked.toLocaleString()}</span>
                <span className="text-right text-xs text-slate-500 tabular-nums">{(c.share * 100).toFixed(1)}%</span>
              </div>
              <div className="ml-7 mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(c.share * 100, 1)}%` }} />
              </div>
            </div>
          ))}
          {cityStats.length === 0 && <div className="p-4 text-center text-sm text-slate-400">{t('這段期間沒有資料（或被篩選過濾）', 'No data in this period (or filtered out)')}</div>}
        </div>
      </Section>

      {/* 英雄榜 */}
      <Section icon={<Trophy className="w-5 h-5 text-emerald-600" />} title={t('撿拾英雄榜', 'Top volunteers')}>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {heroes.map((h, idx) => (
            <div key={h.name + idx} className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-center text-lg leading-none">{['🥇', '🥈', '🥉'][idx] ?? <span className="text-xs font-bold text-slate-400">{idx + 1}</span>}</span>
                <span className="text-sm font-medium text-slate-700 truncate">{h.name}</span>
              </div>
              <span className="text-xs text-slate-500 tabular-nums shrink-0">
                <b className="text-sm text-slate-800">{h.picked.toLocaleString()}</b> {t('根', 'butts')} · {h.reports} {t('筆', h.reports === 1 ? 'report' : 'reports')}
              </span>
            </div>
          ))}
          {heroes.length === 0 && <div className="p-4 text-center text-sm text-slate-400">{t('這段期間還沒有人上榜', 'No one on the board for this period yet')}</div>}
          <p className="px-3 py-2 text-[10px] text-slate-400 bg-slate-50">{t('依「紀錄人員」統計；為保護隱私，名字只顯示部分。', 'Based on the recorder field. Names are partly hidden for privacy.')}</p>
        </div>
      </Section>

      {/* 最新回報 */}
      <Section icon={<Clock className="w-5 h-5 text-emerald-600" />} title={t('最新回報', 'Latest reports')}>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {latest.map(r => (
            <div key={r.id ?? r.recordId} className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-slate-50 last:border-0">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-700">{cityName(r.cityCode, lang)}</div>
                <div className="text-[10px] text-slate-400 font-mono">{r.date} · {r.recordId}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-slate-800 tabular-nums">{(r.actualPickedCount || 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{t('根', 'butts')}</span></div>
                {(r.hotspots?.length || 0) > 0 && (
                  <div className="text-[10px] text-orange-600 flex items-center justify-end gap-0.5">
                    <AlertTriangle className="w-3 h-3" />{r.hotspots.length} {t('個熱點', r.hotspots.length === 1 ? 'hotspot' : 'hotspots')}
                  </div>
                )}
              </div>
            </div>
          ))}
          {latest.length === 0 && <div className="p-4 text-center text-sm text-slate-400">{t('這段期間沒有回報', 'No reports in this period')}</div>}
        </div>
      </Section>

      <Section icon={<Building2 className="w-5 h-5 text-emerald-600" />} title={t('菸蒂疊疊樂', 'Butt Tower Challenge')}>
        <Tower101Progress total={grandTotalPicked} />
      </Section>
    </div>
  );
};

// ---- 小元件 ----

const Section: React.FC<{ icon: React.ReactNode; title: string; action?: React.ReactNode; children: React.ReactNode }> = ({ icon, title, action, children }) => (
  <div className="px-4 mb-6">
    <div className="flex items-center justify-between gap-2 mb-3">
      <h3 className="font-bold text-slate-700 flex items-center gap-2">{icon}{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex bg-slate-100 p-0.5 rounded-lg">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors ${value === o.value ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const KpiTile: React.FC<{
  label: string;
  value: number;
  prev: number | null;
  prevLabel: string;
  valueClass: string;
  icon?: React.ReactNode;
  /** 熱點變多是壞事，箭頭顏色反過來 */
  upIsBad?: boolean;
}> = ({ label, value, prev, prevLabel, valueClass, icon, upIsBad }) => {
  const { t } = useLang();
  let delta: React.ReactNode = null;
  if (prev !== null) {
    if (prev === 0) {
      delta = <span className="text-slate-400">{value > 0 ? t('上一期為 0', 'Was 0 last period') : t('與上一期相同', 'Same as last period')}</span>;
    } else {
      const pct = Math.round(((value - prev) / prev) * 100);
      const good = pct === 0 ? null : (pct > 0) !== !!upIsBad;
      const color = good === null ? 'text-slate-400' : good ? 'text-emerald-600' : 'text-red-500';
      delta = (
        <span className={`inline-flex items-center gap-0.5 ${color}`}>
          {pct > 0 ? <ArrowUp className="w-3 h-3" /> : pct < 0 ? <ArrowDown className="w-3 h-3" /> : null}
          {Math.abs(pct)}% <span className="text-slate-400 ml-0.5">{prevLabel}</span>
        </span>
      );
    }
  }
  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-bold">{label}</span>
        {icon}
      </div>
      <div className={`text-2xl font-bold tabular-nums mt-1 ${valueClass}`}>{value.toLocaleString()}</div>
      <div className="text-[10px] mt-0.5 min-h-[1rem]">{delta}</div>
    </div>
  );
};

export default Dashboard;
