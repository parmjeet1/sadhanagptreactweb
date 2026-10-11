import React, { useState } from 'react';
import { FullWindow } from './ui';
import Ring from './Ring';
import { KINDS, KIND_ORDER } from '../kinds';
import { groupByDate } from '../dates';

const BOOK_DOT = { completed: 'bg-emerald-500', ongoing: 'bg-blue-500', skipped: 'bg-gray-300', not_started: 'bg-gray-200' };
const BOOK_TEXT = { completed: 'Completed', ongoing: 'Ongoing', skipped: 'Skipped', not_started: 'Not started' };

const Section = ({ title, hint, open, onToggle, children }) => (
  <div className="bg-white rounded-[20px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] mb-4 overflow-hidden">
    <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex items-center gap-3 px-5 py-4 text-left">
      <span className="flex-1 text-[15px] font-extrabold text-[#1e293b]">{title}</span>
      <span className="text-[12px] font-bold text-gray-400">{hint}</span>
      <span className={`text-gray-400 font-black transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
    </button>
    {open && <div className="px-5 pb-4">{children}</div>}
  </div>
);

/**
 * One mentee in a single window: two circles on top (books completed, lectures heard in the last 7 days),
 * then collapsible "Reading Books" and "Lectures" (date-wise, coloured by Srila Prabhupada / Guru / Others).
 * `report` is the result of mapMenteeReport.
 */
const MenteeWindow = ({ report, onClose }) => {
  const [open, setOpen] = useState({ books: true, lectures: true });
  const { mentee, books, lectures } = report;
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const days = groupByDate(lectures.items);
  const recent = lectures.items.filter((l) => l.heardOn >= lectures.since);
  const recentKinds = { prabhupada: 0, guru: 0, others: 0 };
  recent.forEach((l) => { recentKinds[l.kind] += 1; });
  const where = [mentee.group, mentee.sub].filter(Boolean).join(' / ') || 'Ungrouped';

  return (
    <FullWindow title={mentee.name} subtitle={where} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-[20px] border border-gray-100 p-4 flex flex-col items-center gap-2">
          <Ring size={88} stroke={9} max={books.total} segments={[{ value: books.completed, color: '#10b981' }]}>
            <span className="text-[20px] font-black text-[#1e293b]">{books.completed}<span className="text-[12px] text-gray-400">/{books.total}</span></span>
          </Ring>
          <p className="text-[12px] font-extrabold text-[#1e293b]">Books completed</p>
          <p className="text-[10px] font-bold text-gray-400 -mt-1.5">{books.listKind === 'recommended' ? "Counsellor's list" : 'Default list'}</p>
        </div>
        <div className="bg-white rounded-[20px] border border-gray-100 p-4 flex flex-col items-center gap-2">
          <Ring size={88} stroke={9} max={Math.max(lectures.last7, 1)} segments={KIND_ORDER.map((k) => ({ value: recentKinds[k], color: KINDS[k].hex }))}>
            <span className="text-[22px] font-black text-[#1e293b]">{lectures.last7}</span>
          </Ring>
          <p className="text-[12px] font-extrabold text-[#1e293b]">Lectures, last 7 days</p>
          <p className="text-[10px] font-bold text-gray-400 -mt-1.5">{lectures.total} in all</p>
        </div>
      </div>

      <Section title="Reading Books" hint={`${books.completed} done · ${books.ongoing} ongoing`} open={open.books} onToggle={() => toggle('books')}>
        {books.levels.length === 0 && <p className="text-[13px] text-gray-400">No reading list.</p>}
        {books.levels.map((lv) => {
          const done = lv.books.filter((b) => b.status === 'completed').length;
          return (
            <div key={lv.id} className="mb-3">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">{lv.name} · {done}/{lv.books.length}</p>
              {lv.books.map((b) => (
                <div key={b.id} className="flex items-center gap-2.5 py-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${BOOK_DOT[b.status]}`} />
                  <span className={`flex-1 min-w-0 text-[13px] font-semibold leading-snug ${b.status === 'not_started' || b.status === 'skipped' ? 'text-gray-400' : 'text-[#1e293b]'}`}>{b.title}</span>
                  <span className="text-[11px] font-bold text-gray-400 shrink-0">{b.status === 'ongoing' && b.days !== null && b.days !== undefined ? `${b.days} days` : BOOK_TEXT[b.status]}</span>
                </div>
              ))}
            </div>
          );
        })}
        {books.own.length > 0 && (
          <div className="mb-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Own books</p>
            {books.own.map((b) => (
              <div key={b.id} className="flex items-center gap-2.5 py-1.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${BOOK_DOT[b.status]}`} />
                <span className="flex-1 min-w-0 text-[13px] font-semibold text-[#1e293b]">{b.title}</span>
                <span className="text-[11px] font-bold text-gray-400">{BOOK_TEXT[b.status]}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Lectures" hint={`${lectures.recommendedHeard}/${lectures.recommendedTotal} recommended`} open={open.lectures} onToggle={() => toggle('lectures')}>
        <div className="flex flex-wrap gap-2 mb-2">
          {KIND_ORDER.map((k) => (
            <span key={k} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${KINDS[k].chip}`}>
              <span className={`w-2 h-2 rounded-full ${KINDS[k].dot}`} />{KINDS[k].label} {lectures.byKind[k]}
            </span>
          ))}
        </div>
        {days.length === 0 && <p className="text-[13px] text-gray-400">No lectures heard yet.</p>}
        {days.map((d) => (
          <div key={d.date} className="mt-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">{d.label}</p>
            {d.rows.map((l) => {
              const k = KINDS[l.kind];
              return (
                <div key={l.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 mb-1.5 ${k.soft}`}>
                  <span className={`w-1 self-stretch rounded-full ${k.bar}`} />
                  <button type="button" disabled={!l.link} onClick={() => window.open(l.link, '_blank', 'noopener,noreferrer')} className="flex-1 min-w-0 text-left">
                    <p className="text-[13px] font-bold text-[#1e293b] leading-snug">{l.title}</p>
                    <p className="text-[11px] font-medium text-gray-500 truncate">{l.speaker}{l.link ? ' · tap to open' : ''}</p>
                  </button>
                  {l.recommended && <span className="text-[10px] font-extrabold text-emerald-600 bg-white rounded-full px-2 py-0.5 border border-emerald-100">Recommended</span>}
                </div>
              );
            })}
          </div>
        ))}
      </Section>
    </FullWindow>
  );
};

export default MenteeWindow;
