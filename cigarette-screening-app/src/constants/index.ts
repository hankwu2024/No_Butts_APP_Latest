export const CITY_CODES = [
  { code: 'A', name: '臺北市', en: 'Taipei City' },
  { code: 'B', name: '臺中市', en: 'Taichung City' },
  { code: 'C', name: '基隆市', en: 'Keelung City' },
  { code: 'D', name: '臺南市', en: 'Tainan City' },
  { code: 'E', name: '高雄市', en: 'Kaohsiung City' },
  { code: 'F', name: '新北市', en: 'New Taipei City' },
  { code: 'G', name: '宜蘭縣', en: 'Yilan County' },
  { code: 'H', name: '桃園市', en: 'Taoyuan City' },
  { code: 'I', name: '嘉義市', en: 'Chiayi City' },
  { code: 'J', name: '新竹縣', en: 'Hsinchu County' },
  { code: 'K', name: '苗栗縣', en: 'Miaoli County' },
  { code: 'M', name: '南投縣', en: 'Nantou County' },
  { code: 'N', name: '彰化縣', en: 'Changhua County' },
  { code: 'O', name: '新竹市', en: 'Hsinchu City' },
  { code: 'P', name: '雲林縣', en: 'Yunlin County' },
  { code: 'Q', name: '嘉義縣', en: 'Chiayi County' },
  { code: 'T', name: '屏東縣', en: 'Pingtung County' },
  { code: 'U', name: '花蓮縣', en: 'Hualien County' },
  { code: 'V', name: '臺東縣', en: 'Taitung County' },
  { code: 'W', name: '金門縣', en: 'Kinmen County' },
  { code: 'X', name: '澎湖縣', en: 'Penghu County' },
  { code: 'Y', name: '陽明山(範例/其它)', en: 'Yangmingshan (sample/other)' },
  { code: 'Z', name: '連江縣', en: 'Lienchiang County' },
];

/** 依語言取縣市名稱；找不到代碼就原樣回傳 */
export const cityName = (code: string, lang: 'zh' | 'en') => {
  const c = CITY_CODES.find(x => x.code === code);
  if (!c) return code;
  return lang === 'en' ? c.en : c.name;
};

// 用 BASE_URL 開頭，部署在 /screening/ 底下時路徑才不會錯
export const LOGO_URL = `${import.meta.env.BASE_URL}app-icon.png`;
export const LOGO_SMALL_URL = `${import.meta.env.BASE_URL}app-icon-192.png`;
export const APP_ID = import.meta.env.VITE_APP_ID || 'default-app-id';
