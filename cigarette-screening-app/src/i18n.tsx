import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Lang = 'zh' | 'en';

const STORAGE_KEY = 'screeningLang';
// 個人網站跟 APP 在同一個網域，沒選過語言時沿用網站上選的語言
const SITE_KEY = 'siteLang';

const readInitialLang = (): Lang => {
  try {
    const own = localStorage.getItem(STORAGE_KEY);
    if (own === 'zh' || own === 'en') return own;
    if (localStorage.getItem(SITE_KEY) === 'en') return 'en';
  } catch {
    // 無痕模式等情況讀不到 localStorage，用預設中文
  }
  return 'zh';
};

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** 依目前語言回傳中文或英文 */
  t: (zh: string, en: string) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'zh',
  setLang: () => {},
  t: (zh) => zh,
});

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';
    document.title = lang === 'en' ? 'Cigarette Butt Screening' : '菸蒂快篩';
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 存不了就只在這次使用中生效
    }
  }, []);

  const t = useCallback((zh: string, en: string) => (lang === 'en' ? en : zh), [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLang = () => useContext(LangContext);

/** 中 / EN 切換按鈕 */
export const LangToggle: React.FC<{ small?: boolean; className?: string }> = ({ small = false, className = '' }) => {
  const { lang, setLang } = useLang();
  const size = small ? 'px-1.5 text-[10px] leading-4' : 'px-3 py-1.5 text-xs';
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
      className={`${size} font-bold rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors ${className}`}
      title={lang === 'en' ? '切換成中文' : 'Switch to English'}
      aria-label={lang === 'en' ? '切換成中文' : 'Switch to English'}
    >
      {lang === 'en' ? '中文' : 'EN'}
    </button>
  );
};
