import React, { useState } from 'react';
import BottomNavigation from '../components/student/BottomNavigation';
import { StudentArea, TabBar } from './components/Areas';

/**
 * The student's Reading & Hearing page. `store` is either the mock store (preview) or the real
 * one; `preview` shows the "sample data" line. Used by ReadingLecturePage (mock) and
 * ReadingLectureLivePage (real).
 */
const ReadingLecturePageView = ({ store, preview = false }) => {
  const [tab, setTab] = useState('reading');
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-32 relative overflow-x-hidden">
      <div className="w-full max-w-md mx-auto">
        <header className="px-6 pt-10 pb-4">
          <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight leading-tight">Reading &amp; Hearing</h1>
          {preview && <p className="text-[12px] font-bold text-amber-600 mt-1">Preview - sample data, nothing is saved</p>}
        </header>
        <div className="px-6 mb-5"><TabBar tabs={[['reading', '📖 Reading'], ['hearing', '🎧 Hearing']]} value={tab} onChange={setTab} /></div>
        <div className="px-6"><StudentArea store={store} section={tab} /></div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default ReadingLecturePageView;
