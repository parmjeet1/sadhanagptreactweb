import React, { useState, useEffect, useCallback } from 'react';
import ScopePicker from './ScopePicker';
import MenteeWindow from './MenteeWindow';

/**
 * Counsellor: the Mentees Report. Group / sub-group selectors on top, then the mentees arranged
 * group -> sub-group (Ungrouped last), most heard in the last 7 days first. Tap a mentee for his window.
 * `tools` has groups, loadMenteesReportList(scope) and loadMenteeReport(userId).
 */
const MenteesReportTab = ({ tools }) => {
  const [scope, setScope] = useState({ groupId: 'all', subId: 'all' });
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [report, setReport] = useState(null);
  const [opening, setOpening] = useState('');
  const [note, setNote] = useState('');
  const load = tools.loadMenteesReportList;

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    const r = await load(scope);
    setState(r.ok ? { loading: false, error: '', data: r } : { loading: false, error: r.message, data: null });
  }, [load, scope]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [scope.groupId, scope.subId]);

  const openMentee = async (id) => {
    if (opening) return;
    setOpening(id);
    setNote('');
    const r = await tools.loadMenteeReport(id);
    setOpening('');
    if (!r.ok) { setNote(r.message); return; }
    setReport(r);
  };

  const { loading, error, data } = state;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-5">
        <h2 className="text-[16px] font-extrabold text-[#1e293b]">Mentees Report</h2>
        <p className="text-[12px] font-medium text-gray-400 mb-3">Who heard lectures last week, and what each one is reading.</p>
        <ScopePicker scope={scope} onChange={setScope} groups={tools.groups} />
        {data && <p className="text-[12px] font-bold text-gray-500 mt-3">{data.count} mentees · {data.last7Total} lectures heard in the last 7 days</p>}
      </div>

      {note && <p className="text-[13px] font-semibold text-red-500 px-1">{note}</p>}
      {loading && <p className="text-center text-gray-400 font-semibold py-8">Loading...</p>}
      {error && (
        <div className="text-center py-6">
          <p className="text-[13px] font-semibold text-red-500 mb-3">{error}</p>
          <button type="button" onClick={run} className="px-4 py-2 rounded-xl bg-[#1e293b] text-white font-extrabold text-[13px]">Try again</button>
        </div>
      )}
      {data && !loading && data.groups.length === 0 && <p className="text-center text-gray-400 py-8 text-[14px]">No mentees here.</p>}
      {data && !loading && data.groups.map((g) => (
        <div key={String(g.id)} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] px-5 py-4">
          <h3 className="text-[15px] font-extrabold text-[#1e293b]">{g.name} <span className="text-[12px] font-bold text-gray-400">· {g.count}</span></h3>
          {g.subgroups.map((s) => (
            <div key={String(s.id)} className="mt-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">{s.name}</p>
              <div className="divide-y divide-gray-50">
                {s.mentees.map((m) => (
                  <button key={m.id} type="button" onClick={() => openMentee(m.id)} className="w-full text-left py-3 flex items-center gap-3 active:bg-gray-50">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-indigo-50 text-indigo-600 font-black flex items-center justify-center">{String(m.name).trim().charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-[#1e293b] truncate">{m.name}</p>
                      <p className="text-[12px] font-semibold text-gray-500">Last week heard: {m.last7} · Total: {m.total}</p>
                      <p className="text-[12px] font-medium text-gray-400 truncate">Reading: {m.reading.length ? m.reading.join(', ') : 'none now'}</p>
                    </div>
                    <span className="text-gray-300 font-black">{opening === m.id ? '…' : '›'}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
      {report && <MenteeWindow report={report} onClose={() => setReport(null)} />}
    </div>
  );
};

export default MenteesReportTab;
