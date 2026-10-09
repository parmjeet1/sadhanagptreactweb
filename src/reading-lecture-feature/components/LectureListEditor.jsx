import React, { useRef, useState } from 'react';
import { FullWindow, BottomSheet, Field, inputCls } from './ui';
import { DEFAULT_AUTHOR } from '../data/mockData';

const isUrl = (v) => !v || /^https?:\/\/\S+\.\S+/i.test(String(v).trim());
const cellText = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return String(v.hyperlink || v.text || v.result || '').trim();
  return String(v).trim();
};

/** Read an .xlsx file: columns Title, Speaker, Link (header row optional). Returns { rows, invalid }. */
const parseLectureSheet = async (file) => {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.worksheets[0];
  const rows = []; const invalid = [];
  if (!ws) return { rows, invalid: [{ line: 0, reason: 'The file has no sheet.' }] };
  ws.eachRow((row, n) => {
    const [title, speaker, link] = [1, 2, 3].map((c) => cellText(row.getCell(c).value));
    if (n === 1 && /^title$/i.test(title)) return; // header row
    if (!title && !speaker && !link) return;
    if (!title) { invalid.push({ line: n, reason: 'Title is missing' }); return; }
    if (!isUrl(link)) { invalid.push({ line: n, reason: 'Link must start with http:// or https://' }); return; }
    rows.push({ title, speaker: speaker || DEFAULT_AUTHOR, link });
  });
  return { rows, invalid };
};

const downloadSample = async () => {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Lectures');
  ws.addRow(['Title', 'Speaker', 'Link']);
  ws.addRow(['Example lecture title', DEFAULT_AUTHOR, 'https://example.com/lecture']);
  ws.columns = [{ width: 44 }, { width: 24 }, { width: 50 }];
  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const a = document.createElement('a'); a.href = url; a.download = 'lecture-list-sample.xlsx'; a.click();
  URL.revokeObjectURL(url);
};

/** Counsellor: edit the recommended lecture list for a group (add one by one, or upload an Excel). */
const LectureListEditor = ({ scopeName, initial, isCustom, onSave, onReset, onClose }) => {
  const [list, setList] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [form, setForm] = useState({ title: '', speaker: DEFAULT_AUTHOR, link: '' });
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const add = (items) => { setList((l) => [...l, ...items.map((x, i) => ({ id: `n${Date.now()}${i}`, title_hi: '', addedDaysAgo: 0, ...x }))]); setDirty(true); };
  const remove = (id) => { setList((l) => l.filter((x) => x.id !== id)); setDirty(true); };
  const move = (i, d) => { setList((l) => { const c = [...l]; const j = i + d; if (j < 0 || j >= c.length) return l; [c[i], c[j]] = [c[j], c[i]]; return c; }); setDirty(true); };

  const submit = () => {
    if (!form.title.trim()) { setError('Please enter the lecture title.'); return; }
    if (!isUrl(form.link)) { setError('The link should start with http:// or https://'); return; }
    add([{ title: form.title.trim(), speaker: form.speaker.trim() || DEFAULT_AUTHOR, link: form.link.trim() }]);
    setForm({ title: '', speaker: DEFAULT_AUTHOR, link: '' }); setError(''); setSheet(false);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    try { setPreview({ name: file.name, ...(await parseLectureSheet(file)) }); }
    catch { setPreview({ name: file.name, rows: [], invalid: [{ line: 0, reason: 'This file could not be read. Please use the sample .xlsx file.' }] }); }
  };

  return (
    <FullWindow
      title="Recommended lectures" subtitle={`For: ${scopeName}`} onClose={onClose}
      footer={(
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-extrabold text-[14px]">Cancel</button>
          <button type="button" disabled={!dirty} onClick={() => onSave(list)} className="flex-[2] py-3 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[14px] disabled:opacity-40">Save for mentees</button>
        </div>
      )}
    >
      <div className="mb-4 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-[12px] font-semibold text-blue-700 leading-snug">
        {isCustom ? 'You made a custom lecture list for this group.' : 'Showing the default list. When you save, a copy becomes the list for this group.'} Lectures you add show a NEW badge to mentees for a week.
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <button type="button" onClick={() => setSheet(true)} className="py-3 rounded-2xl bg-blue-50 text-blue-600 font-extrabold text-[13px]">+ Add a lecture</button>
        <button type="button" onClick={() => fileRef.current?.click()} className="py-3 rounded-2xl bg-emerald-50 text-emerald-700 font-extrabold text-[13px]">⬆ Upload Excel</button>
      </div>
      <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={onFile} data-testid="lecture-file" />
      <button type="button" onClick={downloadSample} className="mb-4 text-[12px] font-bold text-blue-500 underline">Download sample Excel (Title, Speaker, Link)</button>

      {preview && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-[13px] font-extrabold text-[#1e293b] mb-1">{preview.name}</p>
          <p className="text-[12px] font-semibold text-gray-500 mb-2">{preview.rows.length} lectures ready{preview.invalid.length ? `, ${preview.invalid.length} rows skipped` : ''}</p>
          {preview.rows.slice(0, 4).map((r, i) => <p key={i} className="text-[12px] text-[#1e293b] truncate">• {r.title} <span className="text-gray-400">({r.speaker})</span></p>)}
          {preview.rows.length > 4 && <p className="text-[12px] text-gray-400">+ {preview.rows.length - 4} more</p>}
          {preview.invalid.map((r, i) => <p key={i} className="text-[12px] text-red-500 font-semibold">Row {r.line}: {r.reason}</p>)}
          <div className="flex gap-3 mt-3">
            <button type="button" onClick={() => setPreview(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-extrabold text-[13px]">Discard</button>
            <button type="button" disabled={!preview.rows.length} onClick={() => { add(preview.rows); setPreview(null); }} className="flex-[2] py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-[13px] disabled:opacity-40">Add {preview.rows.length} to list</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[22px] border border-gray-100 px-4 divide-y divide-gray-50">
        {list.length === 0 && <p className="py-6 text-center text-[13px] text-gray-400">No lectures yet.</p>}
        {list.map((l, i) => (
          <div key={l.id} className="flex items-center gap-2 py-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-[14px] font-bold text-[#1e293b] leading-snug">{l.title}</h4>
              <p className="text-[11px] font-medium text-gray-400 truncate">{l.speaker}{l.link ? ' · link added' : ' · no link'}</p>
            </div>
            <button type="button" onClick={() => move(i, -1)} aria-label="Move up" disabled={i === 0} className="w-8 h-8 rounded-full text-gray-400 font-black disabled:opacity-20">↑</button>
            <button type="button" onClick={() => move(i, 1)} aria-label="Move down" disabled={i === list.length - 1} className="w-8 h-8 rounded-full text-gray-400 font-black disabled:opacity-20">↓</button>
            <button type="button" onClick={() => remove(l.id)} aria-label="Remove lecture" className="w-8 h-8 rounded-full text-red-300 font-black">×</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={onReset} className="mt-4 w-full py-3 text-[13px] font-bold text-gray-400">Reset to default list</button>

      <BottomSheet open={sheet} title="Add a lecture" onClose={() => setSheet(false)}>
        <Field label="Title"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lecture title" /></Field>
        <Field label="Speaker"><input className={inputCls} value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} /></Field>
        <Field label="Link (optional)"><input className={inputCls} value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." inputMode="url" /></Field>
        {error && <p className="text-[13px] font-semibold text-red-500 mb-3">{error}</p>}
        <button type="button" onClick={submit} className="w-full py-3.5 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[15px]">Add lecture</button>
      </BottomSheet>
    </FullWindow>
  );
};

export default LectureListEditor;
