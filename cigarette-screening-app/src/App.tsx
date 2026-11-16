import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { getUserId } from './config/pocketbase';
import { LOGO_URL } from './constants';
import { useLang, LangToggle } from './i18n';
import LoginScreen from './components/LoginScreen';
import ScreeningForm from './components/ScreeningForm';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'dashboard' | 'admin'>('form');
  const [imageError, setImageError] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const userId = getUserId();
  const { t } = useLang();

  if (!hasStarted) {
    return <LoginScreen onLogin={() => setHasStarted(true)} />;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 font-sans text-slate-900 relative shadow-2xl">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm ${imageError ? 'bg-emerald-600' : 'bg-white'}`}>
             {!imageError ? (
               <img
                 src={LOGO_URL}
                 alt="Logo"
                 className="w-full h-full object-contain"
                 onError={() => setImageError(true)}
               />
             ) : (
               <ClipboardList className="w-5 h-5 text-white" />
             )}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-800 leading-tight whitespace-nowrap">{t('菸蒂快篩', 'Butt Screening')}</h1>
            <a href="../index.html" className="text-[11px] text-slate-400 hover:text-emerald-600 whitespace-nowrap">{t('← 回個人網站', '← Back to site')}</a>
          </div>
        </div>
        <LangToggle className="shrink-0 whitespace-nowrap" />
        </div>

        <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setActiveTab('form')} className={`py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'form' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500'}`}>{t('快篩填報', 'Report')}</button>
          <button onClick={() => setActiveTab('dashboard')} className={`py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500'}`}>{t('數據中心', 'Data')}</button>
          <button onClick={() => setActiveTab('admin')} className={`py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'admin' ? 'bg-slate-700 shadow-sm text-white' : 'text-slate-500'}`}>{t('後台管理', 'Admin')}</button>
        </div>
      </div>
      <div className="p-4">
        {activeTab === 'form' && <ScreeningForm userId={userId} onSubmitSuccess={() => setActiveTab('dashboard')} />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'admin' && <AdminPanel userId={userId} />}
      </div>
    </div>
  );
}
