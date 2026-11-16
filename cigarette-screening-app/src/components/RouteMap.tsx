import React, { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import type { ScreeningData } from '../types';
import { getSeverityColor, SEVERITY_LEGEND_STOPS, getRecencyColor, RECENCY_LEGEND_DAYS, daysAgo } from '../utils/colorScale';
import { useLang } from '../i18n';

export type MapMode = 'actualPickedCount' | 'screenedCount' | 'recency';

interface RouteMapProps {
  data: ScreeningData[];
  mode: MapMode;
}

const AGGREGATE_ZOOM_THRESHOLD = 14;
const CLUSTER_CELL_PX = 64;

const RouteMap: React.FC<RouteMapProps> = ({ data, mode }) => {
  const { t } = useLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const routesRef = useRef<ScreeningData[]>([]);
  const modeRef = useRef(mode);
  // 地圖在 effect 裡畫，用 ref 拿到當下的語言
  const tRef = useRef(t);
  const renderRef = useRef<() => void>(() => {});

  const routes = useMemo(() => data.filter(d => d.path && d.path.length > 1), [data]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // canvas renderer keeps zooming smooth; the grey basemap keeps the colors readable
    const map = L.map(containerRef.current, { preferCanvas: true }).setView([23.6978, 120.9605], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      className: 'muted-tiles',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;

    const doRender = () => {
      const currentMap = mapRef.current;
      const currentLayer = layerRef.current;
      if (!currentMap || !currentLayer) return;
      currentLayer.clearLayers();

      const currentRoutes = routesRef.current;
      const m = modeRef.current;
      const tr = tRef.current;
      const unit = tr('根', 'butts');
      if (currentRoutes.length === 0) return;

      const zoom = currentMap.getZoom();

      if (zoom >= AGGREGATE_ZOOM_THRESHOLD) {
        currentRoutes.forEach(r => {
          const latlngs = r.path!.map(p => [p.lat, p.lng] as [number, number]);
          const color = m === 'recency' ? getRecencyColor(daysAgo(r.date)) : getSeverityColor(r[m] || 0);
          const tip = m === 'recency'
            ? `${r.recordId}：${r.date}`
            : `${r.recordId}：${r[m] || 0} ${unit}`;
          L.polyline(latlngs, { color, weight: 5, opacity: 0.9 }).bindTooltip(tip).addTo(currentLayer);
        });
      } else {
        // cluster routes within roughly CLUSTER_CELL_PX screen pixels of each other
        const cellSizeDeg = (CLUSTER_CELL_PX * 360) / (256 * Math.pow(2, zoom));
        const cells = new Map<string, { count: number; sum: number; lat: number; lng: number; newest: number }>();

        currentRoutes.forEach(r => {
          const pts = r.path!;
          const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
          const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
          const key = `${Math.floor(lat / cellSizeDeg)}_${Math.floor(lng / cellSizeDeg)}`;

          if (!cells.has(key)) cells.set(key, { count: 0, sum: 0, lat: 0, lng: 0, newest: Infinity });
          const cell = cells.get(key)!;
          cell.count += 1;
          if (m !== 'recency') cell.sum += r[m] || 0;
          cell.newest = Math.min(cell.newest, daysAgo(r.date));
          cell.lat += lat;
          cell.lng += lng;
        });

        // one circle per cell, placed at the centre of its routes and sized by route count
        cells.forEach(cell => {
          const avg = cell.sum / cell.count;
          const color = m === 'recency' ? getRecencyColor(cell.newest) : getSeverityColor(avg);
          const routesLabel = tr(`${cell.count} 筆路線`, `${cell.count} route${cell.count === 1 ? '' : 's'}`);
          const tip = m === 'recency'
            ? tr(`最近一次：${cell.newest} 天前（${routesLabel}）`, `Latest: ${cell.newest} days ago (${routesLabel})`)
            : tr(`區域平均：${avg.toFixed(0)} ${unit}（${routesLabel}）`, `Area average: ${avg.toFixed(0)} ${unit} (${routesLabel})`);
          L.circleMarker([cell.lat / cell.count, cell.lng / cell.count], {
            radius: Math.min(10 + Math.sqrt(cell.count) * 5, 28),
            color: '#ffffff',
            weight: 2,
            fillColor: color,
            fillOpacity: 0.9,
          })
            .bindTooltip(tip)
            .addTo(currentLayer);
        });
      }
    };

    renderRef.current = doRender;
    map.on('zoomend', doRender);
    doRender();

    return () => {
      map.off('zoomend', doRender);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const fittedRef = useRef(false);

  useEffect(() => {
    routesRef.current = routes;
    modeRef.current = mode;
    tRef.current = t;

    if (!fittedRef.current && routes.length > 0 && mapRef.current) {
      const allPoints = routes.flatMap(r => r.path!.map(p => [p.lat, p.lng] as [number, number]));
      fittedRef.current = true;
      // fitBounds fires zoomend, which renders; render directly too in case the zoom doesn't change
      mapRef.current.fitBounds(L.latLngBounds(allPoints), { padding: [30, 30], maxZoom: 16 });
    }
    renderRef.current();
  }, [routes, mode, t]);

  const isRecency = mode === 'recency';
  const stops = isRecency ? RECENCY_LEGEND_DAYS : SEVERITY_LEGEND_STOPS;
  const colorOf = (v: number) => (isRecency ? getRecencyColor(v) : getSeverityColor(v));

  return (
    <div>
      <div ref={containerRef} className="w-full h-72 relative z-0 isolate" />
      <div className="px-3 pt-2 flex items-center gap-2">
        <span className="text-[10px] text-slate-500 shrink-0">
          {isRecency ? t('近', 'New') : t('少', 'Few')}
        </span>
        <div
          className="flex-1 h-2 rounded-full"
          style={{ background: `linear-gradient(to right, ${stops.map(colorOf).join(', ')})` }}
        />
        <span className="text-[10px] text-slate-500 shrink-0">
          {isRecency ? t('久', 'Old') : t('多', 'Many')}
        </span>
      </div>
      <div className="px-3 pb-2 flex justify-between">
        {stops.map(v => (
          <span key={v} className="text-[9px] text-slate-400">
            {isRecency
              ? (v === 0 ? t('今天', 'today') : t(`${v} 天`, `${v}d`))
              : `${v}${t('根', '')}`}
          </span>
        ))}
      </div>
      <p className="px-3 pb-3 text-[10px] text-slate-400 leading-relaxed">
        {isRecency
          ? t(
              '顏色越深＝越近期的路線，可以看出最近大家都在哪裡行動。縮小地圖會把鄰近路線合併成圓點（顏色＝該區最近一次、大小＝路線筆數）。',
              'Darker = more recent, so you can see where people have been active lately. Zoom out and nearby routes merge into circles (color = latest visit, size = number of routes).'
            )
          : t(
              '縮小地圖會自動把鄰近路線合併成圓點（顏色＝平均數量、大小＝路線筆數）；滑鼠移到路線或色塊上可看到詳細數字。',
              'Zoom out and nearby routes merge into circles (color = average count, size = number of routes). Hover over a route or circle for details.'
            )}
      </p>
    </div>
  );
};

export default RouteMap;
