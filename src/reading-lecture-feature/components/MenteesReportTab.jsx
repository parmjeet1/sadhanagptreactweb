import React, { useState, useEffect, useCallback } from 'react';
import ScopePicker from './ScopePicker';
import MenteeWindow from './MenteeWindow';

// Dot colour from the lectures heard in the last 7 days: 3 or more green, 1-2 amber, none red
const dotOf = (n) => (n >= 3 ? { key: 'green', cls: 'bg-emerald-500', label: 'Heard 3 or more last week' } : n >= 1 ? { key: 'amber', cls: 'bg-amber-500', label: 'Heard 1 or 2 last week' } : { key: 'red', cls: 'bg-red-500', label: 'Heard none last week' });
const DOTS = [['green', 'bg-emerald-500', '3 or more'], ['amber', 'bg-amber-500', '1 or 2'], ['red', 'bg-red-500', 'None']];

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
  const [dot, setDot] = useState(null); // null = all, or 'green' | 'amber' | 'red' (tapped in the key)
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
  const all = data ? data.groups.flatMap((g) => g.subgroups.flatMap((sg) => sg.mentees.map((m) => ({ ...m, group: g.name, sub: sg.name })))) : [];
  const picked = dot ? all.filter((m) => dotOf(m.last7).key === dot).sort((a, b) => String(a.name).localeCompare(String(b.name))) : [];
  const row = (m, where) => (
                  <button key={m.id} type="button" onClick={() => openMentee(m.id)} className="w-full text-left py-3 flex items-center gap-3 active:bg-gray-50">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-indigo-50 text-indigo-600 font-black flex items-center justify-center">{String(m.name).trim().charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-[#1e293b] truncate">{m.name}</p>
                      <p className="text-[12px] font-semibold text-gray-500 flex items-center gap-1.5">
                        <span role="img" aria-label={dotOf(m.last7).label} title={dotOf(m.last7).label} className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotOf(m.last7).cls}`} />
                        Last week heard: {m.last7} · Total: {m.total}
                      </p>
                      {where && <p className="text-[11px] font-semibold text-indigo-500 truncate">{where}</p>}
                      <p className="text-[12px] font-medium text-gray-400 truncate">Reading: {m.reading.length ? m.reading.join(', ') : 'none now'}</p>
                    </div>
                    <span className="text-gray-300 font-black">{opening === m.id ? '…' : '›'}</span>
                  </button>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-5">
        <h2 className="text-[16px] font-extrabold text-[#1e293b]">Mentees Report</h2>
        <p className="text-[12px] font-medium text-gray-400 mb-3">Who heard lectures last week, and what each one is reading.</p>
        <ScopePicker scope={scope} onChange={setScope} groups={tools.groups} />
        {data && <p className="text-[12px] font-bold text-gray-500 mt-3">{data.count} mentees · {data.last7Total} lectures heard in the last 7 days</p>}
        {data && (
          <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Show mentees by last week's lectures">
            {DOTS.map(([k, cls, label]) => {
              const n = all.filter((m) => dotOf(m.last7).key === k).length;
              return (
                <button key={k} type="button" aria-pressed={dot === k} onClick={() => setDot(dot === k ? null : k)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold transition-all active:scale-95 ${dot === k ? 'bg-[#1e293b] text-white border-[#1e293b]' : 'bg-white text-gray-600 border-gray-200'}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${cls}`} />{label} · {n}
                </button>
              );
            })}
          </div>
        )}
        {data && dot && <p className="text-[11px] font-semibold text-gray-400 mt-2">Showing only this colour, A to Z. Tap it again to see everyone by group.</p>}
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
      {data && !loading && dot && (
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] px-5 py-4">
          <h3 className="text-[15px] font-extrabold text-[#1e293b]">{DOTS.find((d) => d[0] === dot)[2]} <span className="text-[12px] font-bold text-gray-400">· {picked.length}</span></h3>
          {picked.length === 0 && <p className="text-[13px] text-gray-400 py-3">Nobody in this colour.</p>}
          <div className="divide-y divide-gray-50">{picked.map((m) => row(m, [m.group, m.sub].join(' / ')))}</div>
        </div>
      )}
      {data && !loading && !dot && data.groups.map((g) => (
        <div key={String(g.id)} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] px-5 py-4">
          <h3 className="text-[15px] font-extrabold text-[#1e293b]">{g.name} <span className="text-[12px] font-bold text-gray-400">· {g.count}</span></h3>
          {g.subgroups.map((s) => (
            <div key={String(s.id)} className="mt-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">{s.name}</p>
              <div className="divide-y divide-gray-50">
                {s.mentees.map((m) => row(m))}
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
