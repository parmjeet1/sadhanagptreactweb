import React, { useState } from 'react';
import { StatusChip, NewBadge, BottomSheet, Field, inputCls } from './ui';
import { DEFAULT_AUTHOR } from '../data/mockData';


const BookRow = ({ book, status, lang, onCycle, onSkip, onRemove, own }) => {
  const [menu, setMenu] = useState(false);
  const title = lang === 'hi' && book.title_hi ? book.title_hi : book.title;
  return (
    <div className={`relative flex items-start gap-3 py-3 ${status === 'skipped' ? 'opacity-60' : ''}`}>
      <div className="w-10 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center text-lg shrink-0">📖</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-[15px] font-bold text-[#1e293b] leading-snug">{title}</h4>
          {!own && book.addedDaysAgo <= 7 && <NewBadge />}
        </div>
        <p className="text-[12px] font-medium text-gray-400 truncate mb-1.5">{book.author}</p>
        <StatusChip status={status} lang={lang} onClick={() => onCycle(book.id)} />
      </div>
      <button type="button" onClick={() => setMenu((m) => !m)} aria-label="More" className="w-8 h-8 shrink-0 self-start rounded-full text-gray-400 font-black active:bg-gray-100">⋯</button>
      {menu && (
        <div className="absolute right-0 top-12 z-10 bg-white border border-gray-100 shadow-xl rounded-2xl py-1 w-44" onMouseLeave={() => setMenu(false)}>
          {book.link && <a href={book.link} target="_blank" rel="noreferrer" className="block px-4 py-2.5 text-[13px] font-semibold text-blue-600">Open link</a>}
          {own ? (
            <button type="button" onClick={() => { onRemove(book.id); setMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-red-500">Remove my book</button>
          ) : status === 'skipped' ? (
            <button type="button" onClick={() => { onSkip(book.id); setMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-[#1e293b]">Bring back</button>
          ) : (
            <button type="button" onClick={() => { onSkip(book.id); setMenu(false); }} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-[#1e293b]">Skip this book</button>
          )}
        </div>
      )}
    </div>
  );
};

const ReadingTab = ({ store, lang }) => {
  const { levels, statusOf, myBooks, cycleStatus, toggleSkip, addMyBook, removeMyBook, progress } = store;
  const [openLevels, setOpenLevels] = useState({});
  const [showSkipped, setShowSkipped] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [form, setForm] = useState({ title: '', author: DEFAULT_AUTHOR, status: 'ongoing' });
  const [error, setError] = useState('');

  // current level = first level that still has an unfinished, un-skipped book
  const currentLevelId = (levels.find((lv) => lv.books.some((b) => !['completed', 'skipped'].includes(statusOf(b.id)))) || levels[0])?.id;
  const isOpen = (lv) => (openLevels[lv.id] === undefined ? lv.id === currentLevelId : openLevels[lv.id]);
  const skipped = levels.flatMap((lv) => lv.books).filter((b) => statusOf(b.id) === 'skipped');
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const ongoingBook = levels.flatMap((lv) => lv.books).find((b) => statusOf(b.id) === 'ongoing');

  const submit = () => {
    if (!form.title.trim()) { setError('Please enter the book name.'); return; }
    addMyBook({ ...form, title: form.title.trim(), author: form.author.trim() || DEFAULT_AUTHOR });
    setForm({ title: '', author: DEFAULT_AUTHOR, status: 'ongoing' });
    setError('');
    setSheet(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-[24px] p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
        <p className="text-teal-100 font-semibold text-[12px] uppercase tracking-wider mb-1">My Reading</p>
        <div className="flex items-end gap-2">
          <h2 className="text-4xl font-black">{progress.done}<span className="text-xl font-bold text-teal-100"> / {progress.total}</span></h2>
          <span className="text-teal-100 font-medium pb-1.5 text-[13px]">books completed</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/25 overflow-hidden"><div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
        {ongoingBook && <p className="mt-3 text-[13px] text-teal-50 font-medium">Now reading: <span className="font-bold text-white">{lang === 'hi' && ongoingBook.title_hi ? ongoingBook.title_hi : ongoingBook.title}</span></p>}
      </div>

      {/* Levels */}
      {levels.map((lv) => {
        const done = lv.books.filter((b) => statusOf(b.id) === 'completed').length;
        const counted = lv.books.filter((b) => statusOf(b.id) !== 'skipped').length;
        const open = isOpen(lv);
        return (
          <div key={lv.id} className="bg-white rounded-[24px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
            <button type="button" onClick={() => setOpenLevels((o) => ({ ...o, [lv.id]: !open }))} className="w-full flex items-center justify-between px-5 py-4">
              <div className="text-left">
                <h3 className="text-[16px] font-extrabold text-[#1e293b]">{lang === 'hi' && lv.name_hi ? lv.name_hi : lv.name}</h3>
                <p className="text-[12px] font-semibold text-gray-400">{done} of {counted} completed</p>
              </div>
              <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
            </button>
            {open && (
              <div className="px-5 pb-3 divide-y divide-gray-50">
                {lv.books.filter((b) => statusOf(b.id) !== 'skipped').map((b) => (
                  <BookRow key={b.id} book={b} status={statusOf(b.id)} lang={lang} onCycle={cycleStatus} onSkip={toggleSkip} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* My other books */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] px-5 py-4">
        <h3 className="text-[16px] font-extrabold text-[#1e293b] mb-1">My other books</h3>
        <p className="text-[12px] font-medium text-gray-400 mb-1">Books you are reading that are not in the list. Your counsellor can see them.</p>
        <div className="divide-y divide-gray-50">
          {myBooks.map((b) => (
            <BookRow key={b.id} own book={b} status={statusOf(b.id)} lang={lang} onCycle={cycleStatus} onSkip={toggleSkip} onRemove={removeMyBook} />
          ))}
        </div>
        <button type="button" onClick={() => setSheet(true)} className="mt-3 w-full py-3 rounded-2xl border-2 border-dashed border-blue-200 text-blue-600 font-extrabold text-[14px] active:scale-[0.98] transition-all">
          + Add a book I am reading
        </button>
      </div>

      {/* Skipped */}
      {skipped.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowSkipped((s) => !s)} className="text-[13px] font-bold text-gray-400 px-2">
            {showSkipped ? 'Hide' : 'Show'} skipped books ({skipped.length})
          </button>
          {showSkipped && (
            <div className="mt-2 bg-white rounded-[24px] border border-gray-100 px-5 divide-y divide-gray-50">
              {skipped.map((b) => <BookRow key={b.id} book={b} status="skipped" lang={lang} onCycle={cycleStatus} onSkip={toggleSkip} />)}
            </div>
          )}
        </div>
      )}

      <BottomSheet open={sheet} title="Add a book I am reading" onClose={() => setSheet(false)}>
        <Field label="Book name">
          <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Teachings of Lord Caitanya" />
        </Field>
        <Field label="Author">
          <input className={inputCls} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
        </Field>
        <Field label="Status">
          <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="not_started">Not started</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </Field>
        {error && <p className="text-[13px] font-semibold text-red-500 mb-3">{error}</p>}
        <button type="button" onClick={submit} className="w-full py-3.5 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[15px] active:scale-[0.98] transition-all">Add book</button>
      </BottomSheet>
    </div>
  );
};

export default ReadingTab;
