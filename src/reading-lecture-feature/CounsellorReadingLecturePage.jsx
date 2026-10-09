import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import CounsellorBottomNavigation from '../components/counsellor/CounsellorBottomNavigation';
import ReadingTab from './components/ReadingTab';
import LecturesTab from './components/LecturesTab';
import ScopePicker from './components/ScopePicker';
import CustomiseOrderWindow from './components/CustomiseOrderWindow';
import MenteeStatusWindow from './components/MenteeStatusWindow';
import MenteeLecturesWindow from './components/MenteeLecturesWindow';
import LectureListEditor from './components/LectureListEditor';
import { Toast } from './components/ui';
import useMockStore from './useMockStore';
import { MOCK_LEVELS, MOCK_LECTURES } from './data/mockData';
import { scopeKey, scopeLabel, menteesInScope } from './data/mockCounsellor';

/**
 * UI PREVIEW for counsellors (mock data, nothing is saved). Opened by URL only:
 * /counsellor/reading-preview. Same two tabs as students, plus the "for mentees" tools on top.
 */
const CounsellorReadingLecturePage = () => {
  useOutletContext();
  const [tab, setTab] = useState('reading');
  const [lang, setLang] = useState('en');
  const [scope, setScope] = useState({ groupId: 'all', subId: 'all' });
  const [win, setWin] = useState(null); // 'order' | 'status' | 'lectures' | 'heard'
  const [customBooks, setCustomBooks] = useState({}); // scope key -> levels
  const [customLectures, setCustomLectures] = useState({});
  const [note, setNote] = useState(null);
  const store = useMockStore();

  const key = scopeKey(scope);
  const name = scopeLabel(scope);
  const flash = (message) => { setNote({ message }); setTimeout(() => setNote(null), 4000); };
  const count = menteesInScope(scope).length;

  const closeAnd = (fn) => (...a) => { fn(...a); setWin(null); };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-32 relative overflow-x-hidden">
      <div className="w-full max-w-md mx-auto">
        <header className="px-6 pt-10 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight leading-tight">Reading &amp; Lectures</h1>
            <p className="text-[12px] font-bold text-amber-600 mt-1">Preview - sample data, nothing is saved</p>
          </div>
          <button type="button" onClick={() => setLang((l) => (l === 'en' ? 'hi' : 'en'))} className="px-3 h-10 rounded-full bg-white shadow-sm text-[13px] font-extrabold text-[#0f172a] active:scale-90 transition-all">{lang === 'en' ? 'हिं' : 'EN'}</button>
        </header>

        <div className="px-6 mb-5">
          <div className="flex bg-slate-200/70 p-1.5 rounded-2xl shadow-inner">
            {[['reading', '📖 Reading'], ['lectures', '🎧 Lectures']].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={`flex-1 py-2.5 rounded-xl text-[14px] font-extrabold transition-all ${tab === k ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500'}`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="px-6 space-y-6">
          {/* For mentees */}
          <div className="bg-white rounded-[24px] border border-blue-100 shadow-[0_10px_30px_rgba(37,99,235,0.06)] p-5">
            <h2 className="text-[16px] font-extrabold text-[#1e293b]">{tab === 'reading' ? 'Reading Order/Status for Mentees' : 'Lectures for Mentees'}</h2>
            <p className="text-[12px] font-medium text-gray-400 mb-3">Choose who this is for, then change the list or see progress.</p>
            <ScopePicker scope={scope} onChange={setScope} />
            <div className="flex items-center gap-2 mt-3 mb-3">
              <span className="text-[12px] font-bold text-gray-500">{name} · {count} mentees</span>
              {(tab === 'reading' ? customBooks[key] : customLectures[key])
                ? <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black">CUSTOM LIST</span>
                : <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-black">DEFAULT LIST</span>}
            </div>
            {tab === 'reading' ? (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setWin('order')} className="py-3 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[13px] active:scale-95 transition-all">Change order</button>
                <button type="button" onClick={() => setWin('status')} className="py-3 rounded-2xl bg-blue-50 text-blue-600 font-extrabold text-[13px] active:scale-95 transition-all">Mentee status</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setWin('lectures')} className="py-3 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[13px] active:scale-95 transition-all">Edit lecture list</button>
                <button type="button" onClick={() => setWin('heard')} className="py-3 rounded-2xl bg-blue-50 text-blue-600 font-extrabold text-[13px] active:scale-95 transition-all">Mentee lectures</button>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">My own {tab === 'reading' ? 'reading' : 'lectures'}</h2>
            {tab === 'reading' ? <ReadingTab store={store} lang={lang} /> : <LecturesTab store={store} lang={lang} />}
          </div>
        </div>
      </div>

      {win === 'order' && (
        <CustomiseOrderWindow
          scopeName={name} isCustom={!!customBooks[key]} initialLevels={customBooks[key] || MOCK_LEVELS}
          onSave={closeAnd((lv) => { setCustomBooks((c) => ({ ...c, [key]: lv })); flash(`Saved for ${name}. Mentees will see the new order.`); })}
          onReset={closeAnd(() => { setCustomBooks((c) => { const n = { ...c }; delete n[key]; return n; }); flash(`${name} now uses the default list.`); })}
          onClose={() => setWin(null)}
        />
      )}
      {win === 'status' && <MenteeStatusWindow scope={scope} scopeName={name} onClose={() => setWin(null)} />}
      {win === 'lectures' && (
        <LectureListEditor
          scopeName={name} isCustom={!!customLectures[key]} initial={customLectures[key] || MOCK_LECTURES}
          onSave={closeAnd((list) => { setCustomLectures((c) => ({ ...c, [key]: list })); flash(`Saved for ${name}. Mentees will see the new lectures.`); })}
          onReset={closeAnd(() => { setCustomLectures((c) => { const n = { ...c }; delete n[key]; return n; }); flash(`${name} now uses the default list.`); })}
          onClose={() => setWin(null)}
        />
      )}
      {win === 'heard' && <MenteeLecturesWindow scope={scope} scopeName={name} onClose={() => setWin(null)} />}

      <Toast toast={note || store.toast} onUndo={() => store.toast?.undo?.()} />
      <CounsellorBottomNavigation />
    </div>
  );
};

export default CounsellorReadingLecturePage;
