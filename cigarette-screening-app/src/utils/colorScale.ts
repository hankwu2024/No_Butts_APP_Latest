type RGB = [number, number, number];

// green (few) -> yellow (moderate) -> red (severe), anchored to absolute counts
const STOPS: { at: number; rgb: RGB }[] = [
  { at: 0, rgb: [12, 163, 12] },
  { at: 200, rgb: [250, 178, 25] },
  { at: 500, rgb: [208, 59, 59] },
];

const toHex = (rgb: RGB) =>
  '#' + rgb.map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('');

export const getSeverityColor = (value: number): string => {
  const v = Math.max(0, value || 0);
  if (v <= STOPS[0].at) return toHex(STOPS[0].rgb);

  for (let i = 1; i < STOPS.length; i++) {
    if (v <= STOPS[i].at) {
      const prev = STOPS[i - 1];
      const cur = STOPS[i];
      const t = (v - prev.at) / (cur.at - prev.at);
      const rgb: RGB = [
        prev.rgb[0] + (cur.rgb[0] - prev.rgb[0]) * t,
        prev.rgb[1] + (cur.rgb[1] - prev.rgb[1]) * t,
        prev.rgb[2] + (cur.rgb[2] - prev.rgb[2]) * t,
      ];
      return toHex(rgb);
    }
  }
  return toHex(STOPS[STOPS.length - 1].rgb);
};

export const SEVERITY_LEGEND_STOPS = [0, 100, 200, 350, 500];

// ---- 新舊程度（單一綠色，越深＝越近期）----
const RECENT_RGB: RGB = [4, 120, 87];   // emerald-700
const OLD_RGB: RGB = [187, 230, 210];   // 淡綠，舊資料退到背景
const RECENCY_MAX_DAYS = 90;

/** 距今幾天；日期格式錯誤時當成很久以前 */
export const daysAgo = (date: string): number => {
  const d = new Date(`${date}T00:00:00`);
  if (isNaN(d.getTime())) return RECENCY_MAX_DAYS;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - d.getTime()) / 86400000));
};

export const getRecencyColor = (days: number): string => {
  const t = Math.min(Math.max(days, 0), RECENCY_MAX_DAYS) / RECENCY_MAX_DAYS;
  return toHex([
    RECENT_RGB[0] + (OLD_RGB[0] - RECENT_RGB[0]) * t,
    RECENT_RGB[1] + (OLD_RGB[1] - RECENT_RGB[1]) * t,
    RECENT_RGB[2] + (OLD_RGB[2] - RECENT_RGB[2]) * t,
  ]);
};

export const RECENCY_LEGEND_DAYS = [0, 7, 30, 60, 90];
