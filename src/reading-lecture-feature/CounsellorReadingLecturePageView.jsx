import React, { useState } from 'react';
import CounsellorBottomNavigation from '../components/counsellor/CounsellorBottomNavigation';
import { CounsellorArea, TabBar } from './components/Areas';

/**
 * The counsellor's Reading, Hearing and Mentees Report page. `store` = his own reading / lectures,
 * `tools` = the counsellor tools. Each is either the mock version (preview) or the real one. Used by
 * CounsellorReadingLecturePage (mock) and CounsellorReadingLivePage (real).
 */
const CounsellorReadingLecturePageView = ({ store, tools, preview = false }) => {
  const [tab, setTab] = useState('reading');
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-32 relative overflow-x-hidden">
      <div className="w-full max-w-md mx-auto">
        <header className="px-6 pt-10 pb-4">
          <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight leading-tight">Reading, Hearing &amp; Mentees</h1>
          {preview && <p className="text-[12px] font-bold text-amber-600 mt-1">Preview - sample data, nothing is saved</p>}
        </header>
        <div className="px-6 mb-5"><TabBar tabs={[['reading', '📖 Reading'], ['hearing', '🎧 Hearing'], ['mentees', '👥 Mentees Report']]} value={tab} onChange={setTab} /></div>
        <div className="px-6"><CounsellorArea store={store} tools={tools} section={tab} /></div>
      </div>
      <CounsellorBottomNavigation />
    </div>
  );
};

export default CounsellorReadingLecturePageView;
