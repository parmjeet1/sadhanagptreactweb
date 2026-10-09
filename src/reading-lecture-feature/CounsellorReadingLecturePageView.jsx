import React, { useState } from 'react';
import CounsellorBottomNavigation from '../components/counsellor/CounsellorBottomNavigation';
import ReadingTab from './components/ReadingTab';
import LecturesTab from './components/LecturesTab';
import ScopePicker from './components/ScopePicker';
import CustomiseOrderWindow from './components/CustomiseOrderWindow';
import MenteeStatusWindow from './components/MenteeStatusWindow';
import MenteeLecturesWindow from './components/MenteeLecturesWindow';
import LectureListEditor from './components/LectureListEditor';
import { Toast } from './components/ui';

/**
 * The counsellor's Reading & Lectures page. `store` = his own reading / lectures, `tools` = the
 * counsellor tools (groups, edit lists, mentees' progress). Each is either the mock version
 * (preview) or the real one. Used by CounsellorReadingLecturePage (mock) and
 * CounsellorReadingLivePage (real).
 */
const CounsellorReadingLecturePageView = ({ store, tools, preview = false }) => {
  const [tab, setTab] = useState('reading');
  const [lang, setLang] = useState('en');
  const [scope, setScope] = useState({ groupId: 'all', subId: 'all' });
  const [win, setWin] = useState(null); // 'order' | 'status' | 'lectures' | 'heard'
  const [winData, setWinData] = useState(null);
  const [opening, setOpening] = useState(false);
  const [note, setNote] = useState(null);

  const info = tools.scopeInfo(scope);
  const { name, count } = info;
  const isCustom = tab === 'reading' ? info.custom.reading : info.custom.lecture;
  const flash = (message) => { setNote({ message }); setTimeout(() => setNote(null), 4000); };

  // load what the window needs first, then open it
  const open = async (kind) => {
    if (opening) return;
    setOpening(true);
    const loaders = {
      order: tools.openReadingEditor,
      status: tools.loadMenteesReading,
      lectures: tools.openLectureEditor,
      heard: tools.loadMenteesLectures,
    };
    const r = await loaders[kind](scope);
    setOpening(false);
    if (!r.ok) { flash(r.message); return; }
    setWinData(r);
    setWin(kind);
  };

  // save / reset: the window stays open if it fails
  const finish = async (promise, successMessage) => {
    const r = await promise;
    if (!r.ok) { flash(r.message); return; }
    flash(successMessage);
    setWin(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-32 relative overflow-x-hidden">
      <div className="w-full max-w-md mx-auto">
        <header className="px-6 pt-10 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight leading-tight">Reading &amp; Lectures</h1>
            {preview && <p className="text-[12px] font-bold text-amber-600 mt-1">Preview - sample data, nothing is saved</p>}
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
            {tools.loading ? (
              <p className="text-[13px] font-semibold text-gray-400 py-4">Loading your groups...</p>
            ) : tools.loadError ? (
              <div className="py-2">
                <p className="text-[13px] font-semibold text-red-500 mb-3">{tools.loadError}</p>
                <button type="button" onClick={tools.reload} className="px-4 py-2 rounded-xl bg-[#1e293b] text-white font-extrabold text-[13px]">Try again</button>
              </div>
            ) : (
              <>
                <ScopePicker scope={scope} onChange={setScope} groups={tools.groups} />
                <div className="flex items-center gap-2 mt-3 mb-3">
                  <span className="text-[12px] font-bold text-gray-500">{name} · {count} mentees</span>
                  {isCustom
                    ? <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black">CUSTOM LIST</span>
                    : <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-black">DEFAULT LIST</span>}
                </div>
                {tab === 'reading' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" disabled={opening} onClick={() => open('order')} className="py-3 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[13px] active:scale-95 transition-all disabled:opacity-50">Change order</button>
                    <button type="button" disabled={opening} onClick={() => open('status')} className="py-3 rounded-2xl bg-blue-50 text-blue-600 font-extrabold text-[13px] active:scale-95 transition-all disabled:opacity-50">Mentee status</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" disabled={opening} onClick={() => open('lectures')} className="py-3 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[13px] active:scale-95 transition-all disabled:opacity-50">Edit lecture list</button>
                    <button type="button" disabled={opening} onClick={() => open('heard')} className="py-3 rounded-2xl bg-blue-50 text-blue-600 font-extrabold text-[13px] active:scale-95 transition-all disabled:opacity-50">Mentee lectures</button>
                  </div>
                )}
                {opening && <p className="text-[12px] font-semibold text-gray-400 mt-3">Opening...</p>}
              </>
            )}
          </div>

          <div>
            <h2 className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">My own {tab === 'reading' ? 'reading' : 'lectures'}</h2>
            {store.loading ? (
              <p className="text-center text-gray-400 font-semibold py-10">Loading...</p>
            ) : store.loadError ? (
              <div className="text-center py-10">
                <p className="text-[14px] font-semibold text-red-500 mb-4">{store.loadError}</p>
                <button type="button" onClick={store.reload} className="px-5 py-2.5 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[14px]">Try again</button>
              </div>
            ) : tab === 'reading' ? <ReadingTab store={store} lang={lang} /> : <LecturesTab store={store} lang={lang} />}
          </div>
        </div>
      </div>

      {win === 'order' && (
        <CustomiseOrderWindow
          scopeName={name} isCustom={winData.isCustom} initialLevels={winData.levels} library={winData.library}
          onSave={(lv) => finish(tools.saveReading(scope, lv), `Saved for ${name}. Mentees will see the new order.`)}
          onReset={() => finish(tools.resetReading(scope), `${name} now uses the default list.`)}
          onClose={() => setWin(null)}
        />
      )}
      {win === 'status' && <MenteeStatusWindow mentees={winData.mentees} books={winData.books} scopeName={name} onClose={() => setWin(null)} />}
      {win === 'lectures' && (
        <LectureListEditor
          scopeName={name} isCustom={winData.isCustom} initial={winData.list}
          onSave={(list) => finish(tools.saveLectures(scope, list), `Saved for ${name}. Mentees will see the new lectures.`)}
          onReset={() => finish(tools.resetLectures(scope), `${name} now uses the default list.`)}
          onClose={() => setWin(null)}
        />
      )}
      {win === 'heard' && <MenteeLecturesWindow mentees={winData.mentees} scopeName={name} onClose={() => setWin(null)} />}

      <Toast toast={note || store.toast} onUndo={() => store.toast?.undo?.()} />
      <CounsellorBottomNavigation />
    </div>
  );
};

export default CounsellorReadingLecturePageView;
