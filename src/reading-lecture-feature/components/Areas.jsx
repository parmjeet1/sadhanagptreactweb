import React, { useState } from 'react';
import ReadingTab from './ReadingTab';
import LecturesTab from './LecturesTab';
import MenteesReportTab from './MenteesReportTab';
import CounsellorListsBox from './CounsellorListsBox';
import { Toast } from './ui';

const LangButton = ({ lang, setLang }) => (
  <div className="flex justify-end mb-3">
    <button type="button" onClick={() => setLang((l) => (l === 'en' ? 'hi' : 'en'))} className="px-3 h-9 rounded-full bg-white shadow-sm text-[13px] font-extrabold text-[#0f172a] active:scale-90 transition-all">{lang === 'en' ? 'हिं' : 'EN'}</button>
  </div>
);

const Loading = ({ store }) => (store.loading ? (
  <p className="text-center text-gray-400 font-semibold py-16">Loading...</p>
) : (
  <div className="text-center py-16">
    <p className="text-[14px] font-semibold text-red-500 mb-4">{store.loadError}</p>
    <button type="button" onClick={store.reload} className="px-5 py-2.5 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[14px]">Try again</button>
  </div>
));

/** Student: section = 'reading' | 'hearing' (his own books / lectures). */
export const StudentArea = ({ store, section }) => {
  const [lang, setLang] = useState('en');
  const wait = store.loading || store.loadError;
  return (
    <div>
      {!wait && section === 'reading' && <LangButton lang={lang} setLang={setLang} />}
      {wait ? <Loading store={store} /> : section === 'reading' ? <ReadingTab store={store} lang={lang} /> : <LecturesTab store={store} lang={lang} />}
      <Toast toast={store.toast} onUndo={() => store.toast?.undo?.()} />
    </div>
  );
};

/** Counsellor: section = 'reading' | 'hearing' | 'mentees'. His own reading / hearing, list editing, and the Mentees Report. */
export const CounsellorArea = ({ store, tools, section }) => {
  const [lang, setLang] = useState('en');
  const [note, setNote] = useState(null);
  const flash = (message) => { setNote({ message }); setTimeout(() => setNote(null), 4000); };
  const wait = store.loading || store.loadError;

  return (
    <div className="space-y-6">
      {section === 'mentees' ? <MenteesReportTab tools={tools} /> : (
        <>
          <div>
            <h2 className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">My own {section === 'reading' ? 'reading' : 'hearing'}</h2>
            {wait ? <Loading store={store} /> : (
              <>
                {section === 'reading' && <LangButton lang={lang} setLang={setLang} />}
                {section === 'reading' ? <ReadingTab store={store} lang={lang} /> : <LecturesTab store={store} lang={lang} />}
              </>
            )}
          </div>
          {/* who sees which list (default / custom) and the buttons to change it: below the collapsed lists */}
          <CounsellorListsBox kind={section === 'reading' ? 'reading' : 'lecture'} tools={tools} flash={flash} />
        </>
      )}
      <Toast toast={note || store.toast} onUndo={() => store.toast?.undo?.()} />
    </div>
  );
};

/** Tab bar: tabs = [[key, label]]. The tabs wrap onto a second line so all of them show on a phone. */
export const TabBar = ({ tabs, value, onChange }) => (
  <div className="flex flex-wrap gap-2" role="tablist">
    {tabs.map(([k, l]) => (
      <button key={k} type="button" role="tab" aria-selected={value === k} onClick={() => onChange(k)}
        className={`px-4 py-2 rounded-full text-[13px] font-extrabold whitespace-nowrap border transition-all ${value === k ? 'bg-[#1e293b] text-white border-[#1e293b] shadow' : 'bg-white text-gray-500 border-gray-100'}`}>{l}</button>
    ))}
  </div>
);
