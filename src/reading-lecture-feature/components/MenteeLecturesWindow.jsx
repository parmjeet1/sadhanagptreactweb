import React, { useState } from 'react';
import { FullWindow } from './ui';
import { menteesInScope } from '../data/mockCounsellor';

/** Counsellor: lectures each mentee says they heard. */
const MenteeLecturesWindow = ({ scope, scopeName, onClose }) => {
  const [open, setOpen] = useState(null);
  const mentees = menteesInScope(scope);
  return (
    <FullWindow title="Mentees' lectures" subtitle={`${scopeName} · ${mentees.length} mentees`} onClose={onClose}>
      <div className="space-y-3">
        {mentees.map((m) => {
          const isOpen = open === m.id;
          return (
            <div key={m.id} className="bg-white rounded-[22px] border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
              <button type="button" onClick={() => setOpen(isOpen ? null : m.id)} className="w-full text-left px-4 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-bold text-[#1e293b] truncate">{m.name}</h4>
                  <p className="text-[12px] font-medium text-gray-400">{m.lectures.length} lectures heard{m.lectures[0] ? ` · last ${m.lectures[0].heardOn}` : ''}</p>
                </div>
                <span className={`text-gray-400 ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 divide-y divide-gray-50">
                  {m.lectures.length === 0 && <p className="text-[13px] text-gray-400 py-2">Nothing added yet.</p>}
                  {m.lectures.map((l, i) => (
                    <div key={i} className="py-2.5">
                      <h5 className="text-[14px] font-bold text-[#1e293b] leading-snug">{l.title}</h5>
                      <p className="text-[12px] text-gray-400">{l.speaker} · {l.heardOn}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </FullWindow>
  );
};

export default MenteeLecturesWindow;
