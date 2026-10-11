import React, { useState } from 'react';
import ScopePicker from './ScopePicker';
import CustomiseOrderWindow from './CustomiseOrderWindow';
import LectureListEditor from './LectureListEditor';

/**
 * Counsellor: choose who a list is for (all / group / sub-group) and change it.
 * kind = 'reading' (Change order) or 'lecture' (Edit lecture list). `flash(message)` shows a note.
 */
const CounsellorListsBox = ({ kind, tools, flash }) => {
  const [scope, setScope] = useState({ groupId: 'all', subId: 'all' });
  const [win, setWin] = useState(null);
  const [winData, setWinData] = useState(null);
  const [opening, setOpening] = useState(false);
  const info = tools.scopeInfo(scope);
  const isCustom = kind === 'reading' ? info.custom.reading : info.custom.lecture;

  const open = async () => {
    if (opening) return;
    setOpening(true);
    const r = await (kind === 'reading' ? tools.openReadingEditor(scope) : tools.openLectureEditor(scope));
    setOpening(false);
    if (!r.ok) { flash(r.message); return; }
    setWinData(r);
    setWin(kind);
  };
  const finish = async (promise, successMessage) => {
    const r = await promise;
    if (!r.ok) { flash(r.message); return; }
    flash(successMessage);
    setWin(null);
  };

  return (
    <div className="bg-white rounded-[24px] border border-blue-100 shadow-[0_10px_30px_rgba(37,99,235,0.06)] p-5">
      <h2 className="text-[16px] font-extrabold text-[#1e293b]">{kind === 'reading' ? 'Reading order for mentees' : 'Lectures for mentees'}</h2>
      <p className="text-[12px] font-medium text-gray-400 mb-3">Choose who this is for, then change the list.</p>
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
            <span className="text-[12px] font-bold text-gray-500">{info.name} · {info.count} mentees</span>
            {isCustom
              ? <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black">CUSTOM LIST</span>
              : <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 text-[10px] font-black">DEFAULT LIST</span>}
          </div>
          <button type="button" disabled={opening} onClick={open} className="w-full py-3 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[13px] active:scale-95 transition-all disabled:opacity-50">
            {kind === 'reading' ? 'Change order' : 'Edit lecture list'}
          </button>
          {opening && <p className="text-[12px] font-semibold text-gray-400 mt-3">Opening...</p>}
        </>
      )}

      {win === 'reading' && (
        <CustomiseOrderWindow
          scopeName={info.name} isCustom={winData.isCustom} initialLevels={winData.levels} library={winData.library}
          onSave={(lv) => finish(tools.saveReading(scope, lv), `Saved for ${info.name}. Mentees will see the new order.`)}
          onReset={() => finish(tools.resetReading(scope), `${info.name} now uses the default list.`)}
          onClose={() => setWin(null)}
        />
      )}
      {win === 'lecture' && (
        <LectureListEditor
          scopeName={info.name} isCustom={winData.isCustom} initial={winData.list}
          onSave={(list) => finish(tools.saveLectures(scope, list), `Saved for ${info.name}. Mentees will see the new lectures.`)}
          onReset={() => finish(tools.resetLectures(scope), `${info.name} now uses the default list.`)}
          onClose={() => setWin(null)}
        />
      )}
    </div>
  );
};

export default CounsellorListsBox;
