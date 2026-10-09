import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import BottomNavigation from '../components/student/BottomNavigation';
import ReadingTab from './components/ReadingTab';
import LecturesTab from './components/LecturesTab';
import { Toast } from './components/ui';
import useMockStore from './useMockStore';

/**
 * UI PREVIEW (mock data, nothing is saved). Opened by URL only: /student/reading-preview
 * It is not linked from any menu yet.
 */
const ReadingLecturePage = () => {
  useOutletContext();
  const [tab, setTab] = useState('reading');
  const [lang, setLang] = useState('en');
  const store = useMockStore();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-32 relative overflow-x-hidden">
      <div className="w-full max-w-md mx-auto">
        <header className="px-6 pt-10 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight leading-tight">Reading &amp; Lectures</h1>
            <p className="text-[12px] font-bold text-amber-600 mt-1">Preview - sample data, nothing is saved</p>
          </div>
          <button
            type="button"
            onClick={() => setLang((l) => (l === 'en' ? 'hi' : 'en'))}
            className="px-3 h-10 rounded-full bg-white shadow-sm text-[13px] font-extrabold text-[#0f172a] active:scale-90 transition-all"
          >
            {lang === 'en' ? 'हिं' : 'EN'}
          </button>
        </header>

        <div className="px-6 mb-6">
          <div className="flex bg-slate-200/70 p-1.5 rounded-2xl shadow-inner">
            {[['reading', '📖 Reading'], ['lectures', '🎧 Lectures']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex-1 py-2.5 rounded-xl text-[14px] font-extrabold transition-all ${tab === key ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6">
          {tab === 'reading' ? <ReadingTab store={store} lang={lang} /> : <LecturesTab store={store} lang={lang} />}
        </div>
      </div>
      <Toast toast={store.toast} onUndo={() => store.toast?.undo?.()} />
      <BottomNavigation />
    </div>
  );
};

export default ReadingLecturePage;
