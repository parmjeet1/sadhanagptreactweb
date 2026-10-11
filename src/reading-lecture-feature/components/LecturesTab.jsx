import React, { useState } from 'react';
import { NewBadge, BottomSheet, Field, inputCls } from './ui';
import Ring from './Ring';
import { KINDS, KIND_ORDER, SPEAKER_OPTIONS, speakerFromChoice } from '../kinds';
import { groupByDate, localToday } from '../dates';
import { summarizeHearing } from '../mappers';

const looksLikeUrl = (v) => !v || /^https?:\/\/\S+\.\S+/i.test(v.trim());
const blank = () => ({ title: '', option: 'Srila Prabhupada', other: '', link: '', heardOn: localToday() });

/** Opens the lecture link in a new tab when there is one */
const openLink = (link) => { if (link) window.open(link, '_blank', 'noopener,noreferrer'); };

/** The Hearing tab: circles, lectures recommended by the counsellor, and the date-wise history. */
const LecturesTab = ({ store, lang }) => {
  const { lectures, heardIds, heard, markHeard, unmarkHeard, addHeard, removeHeard } = store;
  const [sheet, setSheet] = useState(false);
  const [form, setForm] = useState(blank());
  const [error, setError] = useState('');
  const s = summarizeHearing(lectures, heard, heardIds);
  const days = groupByDate(heard);

  const submit = () => {
    if (!form.title.trim()) { setError('Please enter the lecture title.'); return; }
    if (!looksLikeUrl(form.link)) { setError('The link should start with http:// or https://'); return; }
    addHeard({ title: form.title.trim(), speaker: speakerFromChoice(form.option, form.other), link: form.link.trim(), heardOn: form.heardOn });
    setForm(blank());
    setError('');
    setSheet(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[24px] p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
        <p className="text-indigo-100 font-semibold text-[12px] uppercase tracking-wider mb-3">My Hearing</p>
        <div className="flex items-center justify-around gap-3">
          <div className="flex flex-col items-center gap-1.5">
            <Ring size={92} stroke={10} max={s.total} track="rgba(255,255,255,0.25)" segments={[{ value: s.byKind.prabhupada, color: KINDS.prabhupada.hex }]}>
              <span className="text-[26px] font-black">{s.byKind.prabhupada}</span>
            </Ring>
            <span className="text-[11px] font-bold text-indigo-100">Srila Prabhupada</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Ring size={92} stroke={10} max={s.recommended} track="rgba(255,255,255,0.25)" segments={[{ value: s.recommendedHeard, color: '#34d399' }]}>
              <span className="text-[22px] font-black">{s.recommendedHeard}<span className="text-[14px] font-bold text-indigo-100">/{s.recommended}</span></span>
            </Ring>
            <span className="text-[11px] font-bold text-indigo-100">Recommended heard</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-[12px] font-semibold text-indigo-50">
          <span>{s.total} heard in all</span>
          <span>{s.last7} in the last 7 days</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {KIND_ORDER.map((k) => (
            <span key={k} className="flex items-center gap-1.5 bg-white/15 rounded-full px-2.5 py-1 text-[11px] font-bold">
              <span className={`w-2 h-2 rounded-full ring-1 ring-white ${KINDS[k].dot}`} />{KINDS[k].label} {s.byKind[k]}
            </span>
          ))}
        </div>
      </div>

      {/* Recommended */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] px-5 py-4">
        <h3 className="text-[16px] font-extrabold text-[#1e293b]">Recommended lectures</h3>
        <p className="text-[12px] font-medium text-gray-400 mb-1">Tick a lecture when you have heard it. Tap the name to listen.</p>
        <div className="divide-y divide-gray-50">
          {lectures.length === 0 && <p className="text-[13px] text-gray-400 py-3">No lectures recommended yet.</p>}
          {lectures.map((l) => {
            const done = heardIds.has(l.id);
            const k = KINDS[l.kind || 'others'];
            return (
              <div key={l.id} className="flex items-center gap-3 py-3">
                <button
                  type="button"
                  onClick={() => (done ? unmarkHeard(l.id) : markHeard(l))}
                  aria-label={done ? 'Mark as not heard' : 'Mark as heard'}
                  className={`w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-[14px] font-black transition-all active:scale-90 ${done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-transparent'}`}
                >✓</button>
                <span className={`w-1 self-stretch rounded-full ${k.bar}`} />
                <button type="button" disabled={!l.link} onClick={() => openLink(l.link)} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-[15px] font-bold leading-snug ${done ? 'text-gray-400' : 'text-[#1e293b]'}`}>{lang === 'hi' && l.title_hi ? l.title_hi : l.title}</h4>
                    {l.addedDaysAgo <= 7 && <NewBadge />}
                  </div>
                  <p className="text-[12px] font-medium text-gray-400 truncate">{l.speaker}</p>
                </button>
                {l.link ? <span className="text-blue-500 font-bold text-[13px]">Listen</span> : <span className="text-[11px] text-gray-300 font-semibold">no link</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* History, date-wise */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] px-5 py-4">
        <h3 className="text-[16px] font-extrabold text-[#1e293b] mb-1">Lectures I heard</h3>
        {heard.length === 0 && <p className="text-[13px] text-gray-400 py-3">Nothing added yet.</p>}
        {days.map((d) => (
          <div key={d.date} className="mt-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">{d.label}</p>
            <div className="divide-y divide-gray-50">
              {d.rows.map((h) => {
                const k = KINDS[h.kind || 'others'];
                return (
                  <div key={h.id} className="flex items-center gap-3 py-2.5">
                    <span className={`w-1 self-stretch rounded-full ${k.bar}`} />
                    <button type="button" disabled={!h.link} onClick={() => openLink(h.link)} className="flex-1 min-w-0 text-left">
                      <h4 className="text-[15px] font-bold text-[#1e293b] leading-snug">{h.title}</h4>
                      <p className="text-[12px] font-medium text-gray-400 truncate">{h.speaker}{h.link ? ' · tap to open' : ''}</p>
                    </button>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${k.chip}`}>{k.label}</span>
                    <button type="button" onClick={() => removeHeard(h.id)} aria-label="Remove" className="w-8 h-8 rounded-full text-gray-300 font-black active:bg-gray-100">×</button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setSheet(true)} className="mt-3 w-full py-3 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-600 font-extrabold text-[14px] active:scale-[0.98] transition-all">
          + Add a lecture I heard
        </button>
      </div>

      <BottomSheet open={sheet} title="Add a lecture I heard" onClose={() => setSheet(false)}>
        <Field label="Title">
          <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lecture title" />
        </Field>
        <Field label="Speaker">
          <select className={inputCls} value={form.option} onChange={(e) => setForm({ ...form, option: e.target.value })}>
            {SPEAKER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        {form.option === 'Others' && (
          <Field label="Speaker name (optional)">
            <input className={inputCls} value={form.other} onChange={(e) => setForm({ ...form, other: e.target.value })} placeholder="Name" />
          </Field>
        )}
        <Field label="Link (optional)">
          <input className={inputCls} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." inputMode="url" />
        </Field>
        <Field label="Date heard">
          <input type="date" className={inputCls} value={form.heardOn} max={localToday()} onChange={(e) => setForm({ ...form, heardOn: e.target.value })} />
        </Field>
        {error && <p className="text-[13px] font-semibold text-red-500 mb-3">{error}</p>}
        <button type="button" onClick={submit} className="w-full py-3.5 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[15px] active:scale-[0.98] transition-all">Add lecture</button>
      </BottomSheet>
    </div>
  );
};

export default LecturesTab;
