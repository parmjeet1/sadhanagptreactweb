import React, { useState } from 'react';
import { NewBadge, BottomSheet, Field, inputCls } from './ui';
import { DEFAULT_AUTHOR } from '../data/mockData';

const today = () => new Date().toISOString().slice(0, 10);
const looksLikeUrl = (v) => !v || /^https?:\/\/\S+\.\S+/i.test(v.trim());

const LecturesTab = ({ store, lang }) => {
  const { lectures, heardIds, heard, markHeard, unmarkHeard, addHeard, removeHeard } = store;
  const [sheet, setSheet] = useState(false);
  const [form, setForm] = useState({ title: '', speaker: DEFAULT_AUTHOR, link: '', heardOn: today() });
  const [error, setError] = useState('');

  const submit = () => {
    if (!form.title.trim()) { setError('Please enter the lecture title.'); return; }
    if (!looksLikeUrl(form.link)) { setError('The link should start with http:// or https://'); return; }
    addHeard({ ...form, title: form.title.trim(), speaker: form.speaker.trim() || DEFAULT_AUTHOR, link: form.link.trim() });
    setForm({ title: '', speaker: DEFAULT_AUTHOR, link: '', heardOn: today() });
    setError('');
    setSheet(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[24px] p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
        <p className="text-indigo-100 font-semibold text-[12px] uppercase tracking-wider mb-1">My Lectures</p>
        <div className="flex items-end gap-2">
          <h2 className="text-4xl font-black">{heard.length}</h2>
          <span className="text-indigo-100 font-medium pb-1.5 text-[13px]">lectures heard</span>
        </div>
      </div>

      {/* Recommended */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] px-5 py-4">
        <h3 className="text-[16px] font-extrabold text-[#1e293b]">Recommended lectures</h3>
        <p className="text-[12px] font-medium text-gray-400 mb-1">Tick a lecture when you have heard it.</p>
        <div className="divide-y divide-gray-50">
          {lectures.map((l) => {
            const done = heardIds.has(l.id);
            return (
              <div key={l.id} className="flex items-center gap-3 py-3">
                <button
                  type="button"
                  onClick={() => (done ? unmarkHeard(l.id) : markHeard(l))}
                  aria-label={done ? 'Mark as not heard' : 'Mark as heard'}
                  className={`w-7 h-7 shrink-0 rounded-lg border-2 flex items-center justify-center text-[14px] font-black transition-all active:scale-90 ${done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 text-transparent'}`}
                >✓</button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-[15px] font-bold leading-snug ${done ? 'text-gray-400' : 'text-[#1e293b]'}`}>{lang === 'hi' && l.title_hi ? l.title_hi : l.title}</h4>
                    {l.addedDaysAgo <= 7 && <NewBadge />}
                  </div>
                  <p className="text-[12px] font-medium text-gray-400 truncate">{l.speaker}</p>
                </div>
                {l.link ? <a href={l.link} target="_blank" rel="noreferrer" className="text-blue-500 font-bold text-[13px]">Listen</a> : <span className="text-[11px] text-gray-300 font-semibold">no link</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* My heard log */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] px-5 py-4">
        <h3 className="text-[16px] font-extrabold text-[#1e293b] mb-1">Lectures I heard</h3>
        {heard.length === 0 && <p className="text-[13px] text-gray-400 py-3">Nothing added yet.</p>}
        <div className="divide-y divide-gray-50">
          {heard.map((h) => (
            <div key={h.id} className="flex items-center gap-3 py-3">
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-[#1e293b] leading-snug">{h.title}</h4>
                <p className="text-[12px] font-medium text-gray-400 truncate">{h.speaker} · {h.heardOn}</p>
              </div>
              {h.link && <a href={h.link} target="_blank" rel="noreferrer" className="text-blue-500 font-bold text-[13px]">Open</a>}
              <button type="button" onClick={() => removeHeard(h.id)} aria-label="Remove" className="w-8 h-8 rounded-full text-gray-300 font-black active:bg-gray-100">×</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setSheet(true)} className="mt-3 w-full py-3 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-600 font-extrabold text-[14px] active:scale-[0.98] transition-all">
          + Add a lecture I heard
        </button>
      </div>

      <BottomSheet open={sheet} title="Add a lecture I heard" onClose={() => setSheet(false)}>
        <Field label="Title">
          <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lecture title" />
        </Field>
        <Field label="Speaker">
          <input className={inputCls} value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} />
        </Field>
        <Field label="Link (optional)">
          <input className={inputCls} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." inputMode="url" />
        </Field>
        <Field label="Date heard">
          <input type="date" className={inputCls} value={form.heardOn} max={today()} onChange={(e) => setForm({ ...form, heardOn: e.target.value })} />
        </Field>
        {error && <p className="text-[13px] font-semibold text-red-500 mb-3">{error}</p>}
        <button type="button" onClick={submit} className="w-full py-3.5 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[15px] active:scale-[0.98] transition-all">Add lecture</button>
      </BottomSheet>
    </div>
  );
};

export default LecturesTab;
