import React, { useState } from 'react';
import { FullWindow, StatusChip } from './ui';
import { MOCK_LEVELS, STATUS_LABEL } from '../data/mockData';
import { menteesInScope } from '../data/mockCounsellor';

const allBooks = MOCK_LEVELS.flatMap((l) => l.books);
const doneCount = (m) => Object.values(m.status).filter((s) => s === 'completed').length + m.own.filter((o) => o.status === 'completed').length;
const nowReading = (m) => { const id = Object.keys(m.status).find((k) => m.status[k] === 'ongoing'); return allBooks.find((b) => String(b.id) === id); };
const staleDays = (m) => Math.max(0, ...Object.values(m.ongoingDays));

/** Counsellor: books completed and status for each mentee (or for each book). */
const MenteeStatusWindow = ({ scope, scopeName, onClose }) => {
  const [view, setView] = useState('mentee');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);
  const mentees = menteesInScope(scope);
  const shown = mentees.filter((m) => {
    if (filter === 'ongoing') return !!nowReading(m);
    if (filter === 'none') return doneCount(m) === 0 && !nowReading(m);
    if (filter === 'stale') return staleDays(m) >= 30;
    return true;
  });
  const chips = [['all', 'All'], ['ongoing', 'Reading now'], ['stale', 'Ongoing 30+ days'], ['none', 'Not started']];

  return (
    <FullWindow title="Mentees' reading" subtitle={`${scopeName} · ${mentees.length} mentees`} onClose={onClose}>
      <div className="flex bg-slate-200/70 p-1 rounded-2xl mb-4">
        {[['mentee', 'By mentee'], ['book', 'By book']].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setView(k)} className={`flex-1 py-2 rounded-xl text-[13px] font-extrabold ${view === k ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}>{l}</button>
        ))}
      </div>

      {view === 'mentee' ? (
        <>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-1" style={{ scrollbarWidth: 'none' }}>
            {chips.map(([k, l]) => (
              <button key={k} type="button" onClick={() => setFilter(k)} className={`px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap border ${filter === k ? 'bg-[#1e293b] text-white border-[#1e293b]' : 'bg-white text-gray-500 border-gray-100'}`}>{l}</button>
            ))}
          </div>
          {shown.length === 0 && <p className="text-center text-gray-400 py-10 text-[14px]">No mentees match.</p>}
          <div className="space-y-3">
            {shown.map((m) => {
              const nr = nowReading(m);
              const isOpen = open === m.id;
              return (
                <div key={m.id} className="bg-white rounded-[22px] border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
                  <button type="button" onClick={() => setOpen(isOpen ? null : m.id)} className="w-full text-left px-4 py-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-bold flex items-center justify-center">{m.name.slice(-1)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[15px] font-bold text-[#1e293b] truncate">{m.name}</h4>
                      <p className="text-[12px] font-medium text-gray-400 truncate">{doneCount(m)} completed{nr ? ` · reading ${nr.title}` : ''}</p>
                    </div>
                    {staleDays(m) >= 30 && <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-black">{staleDays(m)}d</span>}
                    <span className={`text-gray-400 ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 divide-y divide-gray-50">
                      {allBooks.map((b) => (
                        <div key={b.id} className="flex items-center justify-between gap-3 py-2">
                          <span className="text-[13px] font-semibold text-[#1e293b] flex-1 min-w-0 truncate">{b.title}</span>
                          <StatusChip status={m.status[b.id] || 'not_started'} onClick={() => {}} disabled />
                        </div>
                      ))}
                      {m.own.map((o, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 py-2">
                          <span className="text-[13px] font-semibold text-[#1e293b] flex-1 min-w-0 truncate">{o.title} <span className="text-[10px] text-indigo-500 font-black">THEIR OWN</span></span>
                          <StatusChip status={o.status} onClick={() => {}} disabled />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {allBooks.map((b) => {
            const count = (st) => mentees.filter((m) => (m.status[b.id] || 'not_started') === st).length;
            return (
              <div key={b.id} className="bg-white rounded-[22px] border border-gray-100 px-4 py-3.5">
                <h4 className="text-[15px] font-bold text-[#1e293b] mb-2">{b.title}</h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {['completed', 'ongoing', 'not_started', 'skipped'].map((st) => (
                    <div key={st} className="rounded-xl bg-gray-50 py-2">
                      <div className="text-[18px] font-black text-[#1e293b]">{count(st)}</div>
                      <div className="text-[10px] font-bold text-gray-400">{STATUS_LABEL[st].en}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </FullWindow>
  );
};

export default MenteeStatusWindow;
