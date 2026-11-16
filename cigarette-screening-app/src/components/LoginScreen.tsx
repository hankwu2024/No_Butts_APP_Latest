import React, { useState } from 'react';
import { MapPin, ClipboardList, Loader2, Navigation } from 'lucide-react';
import { LOGO_URL } from '../constants';
import { useLang, LangToggle } from '../i18n';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [imageError, setImageError] = useState(false);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'error'>('idle');
  // 存錯誤代碼而不是文字，切換語言時訊息才會跟著換
  const [errorCode, setErrorCode] = useState<number | 'unsupported'>(0);
  const { t } = useLang();

  const errorMessages: Record<string, string> = {
    unsupported: t('您的裝置不支援 GPS 定位，請更換裝置。', "Your device doesn't support GPS. Please try another device."),
    1: t('您已「拒絕」定位權限。\n\n如需使用自動填入 GPS 功能，請至瀏覽器設定開啟權限。', 'Location permission was denied.\n\nTo use GPS auto-fill, allow location access in your browser settings.'),
    2: t('無法偵測目前位置 (訊號不良)。', "Can't detect your location (weak signal)."),
    3: t('定位請求逾時，請重試。', 'Location request timed out. Please try again.'),
  };
  const errorMsg = errorMessages[String(errorCode)] ?? t('定位失敗', 'Location failed');

  const handleStart = () => {
    setStatus('requesting');

    if (!navigator.geolocation) {
      setErrorCode('unsupported');
      setStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setTimeout(() => onLogin(), 600);
      },
      (error) => {
        console.warn("Location error:", error);
        setErrorCode(error.code);
        setStatus('error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-emerald-50 p-6 text-center">
      <LangToggle className="absolute top-4 right-4" />
      {status === 'error' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{t('無法取得位置', "Can't get your location")}</h3>
            <p className="text-slate-600 mb-6 text-sm whitespace-pre-wrap leading-relaxed">{errorMsg}</p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleStart}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
              >
                {t('再試一次', 'Try again')}
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors"
              >
                {t('仍要進入 (無GPS功能)', 'Continue without GPS')}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-6 shadow-xl overflow-hidden ${imageError ? 'bg-emerald-600' : ''}`}>
        {!imageError ? (
          <img
            src={LOGO_URL}
            alt="Logo"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <ClipboardList className="w-12 h-12 text-white" />
        )}
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('菸蒂快篩公民科學', 'Cigarette Butt Screening')}</h1>
      <p className="text-slate-600 mb-8 max-w-sm">
        {t('杜絕菸害，不留餘地。', 'Citizen science against cigarette-butt pollution.')}
      </p>

      <button
        type="button"
        onClick={handleStart}
        disabled={status === 'requesting'}
        className={`bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-full shadow-md transition-all transform hover:scale-105 flex items-center gap-2 ${status === 'requesting' ? 'opacity-75 cursor-not-allowed' : ''}`}
      >
        {status === 'requesting' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('正在請求定位...', 'Requesting location...')}
          </>
        ) : (
          <>
            <Navigation className="w-5 h-5" />
            {t('開啟定位並進入', 'Enable location & start')}
          </>
        )}
      </button>

      <p className="mt-8 text-xs text-slate-400">Environment Protection & Citizen Science</p>
    </div>
  );
};

export default LoginScreen;
