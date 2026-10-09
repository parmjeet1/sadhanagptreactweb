import React, { useState } from 'react';
import BottomNavigation from '../components/student/BottomNavigation';
import ReadingTab from './components/ReadingTab';
import LecturesTab from './components/LecturesTab';
import { Toast } from './components/ui';

/**
 * The student's Reading & Lectures page. `store` is either the mock store (preview) or the real
 * one; `preview` shows the "sample data" line. Used by ReadingLecturePage (mock) and
 * ReadingLectureLivePage (real).
 */
const ReadingLecturePageView = ({ store, preview = false }) => {
  const [tab, setTab] = useState('reading');
  const [lang, setLang] = useState('en');

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-32 relative overflow-x-hidden">
      <div className="w-full max-w-md mx-auto">
        <header className="px-6 pt-10 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight leading-tight">Reading &amp; Lectures</h1>
            {preview && <p className="text-[12px] font-bold text-amber-600 mt-1">Preview - sample data, nothing is saved</p>}
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
          {store.loading ? (
            <p className="text-center text-gray-400 font-semibold py-16">Loading...</p>
          ) : store.loadError ? (
            <div className="text-center py-16">
              <p className="text-[14px] font-semibold text-red-500 mb-4">{store.loadError}</p>
              <button type="button" onClick={store.reload} className="px-5 py-2.5 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[14px]">Try again</button>
            </div>
          ) : tab === 'reading' ? <ReadingTab store={store} lang={lang} /> : <LecturesTab store={store} lang={lang} />}
        </div>
      </div>
      <Toast toast={store.toast} onUndo={() => store.toast?.undo?.()} />
      <BottomNavigation />
    </div>
  );
};

export default ReadingLecturePageView;
