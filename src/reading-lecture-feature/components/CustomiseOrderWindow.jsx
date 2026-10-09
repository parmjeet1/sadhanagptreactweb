import React, { useState } from 'react';
import { FullWindow, BottomSheet, Field, inputCls } from './ui';
import { DEFAULT_AUTHOR } from '../data/mockData';

const clone = (x) => JSON.parse(JSON.stringify(x));

/**
 * Counsellor window: drag (or use arrows) to re-order books, "+" to add a book to a level,
 * add / rename levels, remove books, reset to the default list. Works on a COPY until Save.
 */
const CustomiseOrderWindow = ({ scopeName, initialLevels, library: allBooks = [], isCustom, onSave, onReset, onClose }) => {
  const [levels, setLevels] = useState(() => clone(initialLevels));
  const [drag, setDrag] = useState(null);
  const [addFor, setAddFor] = useState(null); // level id
  const [pick, setPick] = useState('');
  const [form, setForm] = useState({ title: '', author: DEFAULT_AUTHOR });
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  // onSave / onReset may be slow (they talk to the server): disable the buttons meanwhile
  const run = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };

  const change = (fn) => { setLevels((lv) => fn(clone(lv))); setDirty(true); };

  const move = (lvId, idx, dir) => change((lv) => {
    const li = lv.findIndex((l) => l.id === lvId);
    const book = lv[li].books[idx];
    const target = idx + dir;
    if (target >= 0 && target < lv[li].books.length) {
      lv[li].books.splice(idx, 1); lv[li].books.splice(target, 0, book);
    } else if (dir < 0 && li > 0) {            // first book moves up into the end of the previous level
      lv[li].books.splice(idx, 1); lv[li - 1].books.push(book);
    } else if (dir > 0 && li < lv.length - 1) { // last book moves down into the start of the next level
      lv[li].books.splice(idx, 1); lv[li + 1].books.unshift(book);
    }
    return lv;
  });

  const dropOn = (lvId, beforeId) => {
    if (!drag) return;
    change((lv) => {
      let moving;
      lv.forEach((l) => { const i = l.books.findIndex((b) => b.id === drag.bookId); if (i >= 0) [moving] = l.books.splice(i, 1); });
      const dest = lv.find((l) => l.id === lvId);
      const at = beforeId ? dest.books.findIndex((b) => b.id === beforeId) : dest.books.length;
      dest.books.splice(at < 0 ? dest.books.length : at, 0, moving);
      return lv;
    });
    setDrag(null);
  };

  const removeBook = (lvId, bookId) => change((lv) => { const l = lv.find((x) => x.id === lvId); l.books = l.books.filter((b) => b.id !== bookId); return lv; });
  const renameLevel = (lvId, name) => change((lv) => { lv.find((x) => x.id === lvId).name = name; return lv; });
  const addLevel = () => change((lv) => [...lv, { id: `n${Date.now()}`, name: `Level ${lv.length + 1}`, name_hi: '', books: [] }]);
  const removeLevel = (lvId) => change((lv) => lv.filter((l) => l.id !== lvId));

  const inList = new Set(levels.flatMap((l) => l.books.map((b) => b.id)));
  const library = allBooks.filter((b) => !inList.has(b.id));

  const submitAdd = () => {
    let book;
    if (pick) book = library.find((b) => String(b.id) === pick);
    else {
      if (!form.title.trim()) { setError('Choose a book from the list or type a new book name.'); return; }
      book = { id: `c${Date.now()}`, title: form.title.trim(), title_hi: '', author: form.author.trim() || DEFAULT_AUTHOR, link: '', addedDaysAgo: 0 };
    }
    change((lv) => { lv.find((l) => l.id === addFor).books.push({ ...book, addedDaysAgo: 0 }); return lv; });
    setAddFor(null); setPick(''); setForm({ title: '', author: DEFAULT_AUTHOR }); setError('');
  };

  return (
    <FullWindow
      title="Reading order"
      subtitle={`For: ${scopeName}`}
      onClose={onClose}
      footer={(
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-extrabold text-[14px]">Cancel</button>
          <button type="button" disabled={!dirty || busy} onClick={() => run(() => onSave(levels))} className="flex-[2] py-3 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[14px] disabled:opacity-40">Save for mentees</button>
        </div>
      )}
    >
      <div className="mb-4 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-[12px] font-semibold text-blue-700 leading-snug">
        {isCustom ? 'You made a custom list for this group.' : 'Showing the default list. When you save, a copy becomes the list for this group.'}
        {' '}Hold and drag a book, or use the arrows, to change the order. Mentees keep their progress.
      </div>

      <div className="space-y-4">
        {levels.map((lv, li) => (
          <div key={lv.id} className="bg-white rounded-[22px] border border-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.03)]"
            onDragOver={(e) => e.preventDefault()} onDrop={() => dropOn(lv.id, null)}>
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <input value={lv.name} onChange={(e) => renameLevel(lv.id, e.target.value)} aria-label="Level name"
                className="flex-1 min-w-0 text-[15px] font-extrabold text-[#1e293b] bg-transparent outline-none border-b border-transparent focus:border-blue-300" />
              <button type="button" onClick={() => { setAddFor(lv.id); setPick(''); setError(''); }} aria-label={`Add a book to ${lv.name}`}
                className="w-9 h-9 shrink-0 rounded-full bg-blue-50 text-blue-600 font-black text-xl active:scale-90">+</button>
              {lv.books.length === 0 && li > 0 && (
                <button type="button" onClick={() => removeLevel(lv.id)} aria-label="Remove empty level" className="w-9 h-9 shrink-0 rounded-full text-gray-300 font-black">×</button>
              )}
            </div>
            <div className="px-4 pb-3">
              {lv.books.length === 0 && <p className="text-[12px] text-gray-300 font-semibold py-3">No books. Tap + to add one, or drop a book here.</p>}
              {lv.books.map((b, i) => (
                <div key={b.id} draggable
                  onDragStart={() => setDrag({ bookId: b.id })}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.stopPropagation(); dropOn(lv.id, b.id); }}
                  className={`flex items-center gap-2 py-2.5 border-t border-gray-50 first:border-t-0 ${drag?.bookId === b.id ? 'opacity-40' : ''}`}>
                  <span className="text-gray-300 text-lg cursor-grab select-none px-1" aria-hidden>⋮⋮</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold text-[#1e293b] leading-snug">{b.title}</h4>
                    <p className="text-[11px] font-medium text-gray-400 truncate">{b.author}</p>
                  </div>
                  <button type="button" onClick={() => move(lv.id, i, -1)} aria-label="Move up" disabled={li === 0 && i === 0} className="w-8 h-8 rounded-full text-gray-400 font-black disabled:opacity-20 active:bg-gray-100">↑</button>
                  <button type="button" onClick={() => move(lv.id, i, 1)} aria-label="Move down" disabled={li === levels.length - 1 && i === lv.books.length - 1} className="w-8 h-8 rounded-full text-gray-400 font-black disabled:opacity-20 active:bg-gray-100">↓</button>
                  <button type="button" onClick={() => removeBook(lv.id, b.id)} aria-label="Remove book" className="w-8 h-8 rounded-full text-red-300 font-black active:bg-red-50">×</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={addLevel} className="mt-4 w-full py-3 rounded-2xl border-2 border-dashed border-blue-200 text-blue-600 font-extrabold text-[14px]">+ Add a level</button>
      <button type="button" onClick={() => setConfirmReset(true)} className="mt-3 w-full py-3 text-[13px] font-bold text-gray-400">Reset to default list</button>

      <BottomSheet open={!!addFor} title="Add a book" onClose={() => setAddFor(null)}>
        <Field label="Choose from the library">
          <select className={inputCls} value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">- or type a new book below -</option>
            {library.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
        </Field>
        {!pick && (
          <>
            <Field label="New book name"><input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Book name" /></Field>
            <Field label="Author"><input className={inputCls} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></Field>
          </>
        )}
        {error && <p className="text-[13px] font-semibold text-red-500 mb-3">{error}</p>}
        <button type="button" onClick={submitAdd} className="w-full py-3.5 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[15px]">Add to level</button>
      </BottomSheet>

      <BottomSheet open={confirmReset} title="Reset to default list?" onClose={() => setConfirmReset(false)}>
        <p className="text-[14px] font-medium text-gray-500 mb-5">Your custom order for {scopeName} will be removed and mentees will see the default list again. Their progress is kept.</p>
        <div className="flex gap-3">
          <button type="button" onClick={() => setConfirmReset(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 font-extrabold text-gray-600">Keep mine</button>
          <button type="button" disabled={busy} onClick={() => run(() => onReset())} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-extrabold disabled:opacity-40">Reset</button>
        </div>
      </BottomSheet>
    </FullWindow>
  );
};

export default CustomiseOrderWindow;
