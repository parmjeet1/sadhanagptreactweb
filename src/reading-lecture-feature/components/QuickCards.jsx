import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import useReadingLectureStore from '../useReadingLectureStore';
import { BottomSheet, Field, inputCls, Toast } from './ui';
import { SPEAKER_OPTIONS, speakerFromChoice } from '../kinds';
import { localToday } from '../dates';
import { quickKindOf, isFilled } from '../quickHelpers';
import { SADHNA_ACTIVITY_UPDATED } from '../../utils/sadhnaEvents';

// Small optional cards shown under the Reading / Hearing activity on the main sadhana screen
// (student and counsellor dashboards). Nothing here is compulsory: the person can ignore the cards.

const QuickContext = createContext(null);

/** Wrap the activity list once; it loads the person's books and lectures a single time for both cards. */
export const QuickCardsProvider = ({ children }) => {
  const store = useReadingLectureStore();
  const { reload } = store;
  useEffect(() => {
    const again = () => reload();
    window.addEventListener(SADHNA_ACTIVITY_UPDATED, again); // the Sadhna bot saved something
    return () => window.removeEventListener(SADHNA_ACTIVITY_UPDATED, again);
  }, [reload]);
  return (
    <QuickContext.Provider value={store}>
      {children}
      <Toast toast={store.toast} onUndo={() => { store.toast?.undo?.(); }} />
    </QuickContext.Provider>
  );
};

const dismissKey = (kind, date) => `rl_quick_dismiss_${kind}_${date}`;
const readDismissed = (key) => { try { return localStorage.getItem(key) === '1'; } catch { return false; } };
const writeDismissed = (key) => { try { localStorage.setItem(key, '1'); } catch { /* ignore */ } };

const cardCls = (highlight) =>
  `mb-4 -mt-2 rounded-2xl border px-4 py-3 ${highlight
    ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700'
    : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'}`;
const labelCls = 'text-[11px] font-extrabold uppercase tracking-wider text-gray-400';
const smallBtn = 'shrink-0 px-3.5 py-1.5 rounded-full bg-[#1e293b] text-white text-[12px] font-extrabold active:scale-95 transition-all';
const ghostBtn = 'shrink-0 px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 text-[12px] font-extrabold active:bg-gray-100';

/** The card under an activity. Renders nothing for other activities or when the lists could not be loaded. */
export const QuickCardFor = ({ activity, selectedDate }) => {
  const store = useContext(QuickContext);
  const kind = quickKindOf(activity);
  if (!store || !kind || store.loadError) return null;
  const date = selectedDate || localToday();
  const filled = isFilled(activity);
  return kind === 'reading'
    ? <ReadingCard store={store} filled={filled} date={date} />
    : <HearingCard store={store} filled={filled} date={date} />;
};

// ---------------------------------------------------------------- Reading

const joinTitles = (books) => {
  if (!books.length) return '';
  const shown = books.slice(0, 2).map((b) => b.title).join(', ');
  return books.length > 2 ? `${shown} +${books.length - 2} more` : shown;
};

const ReadingCard = ({ store, filled, date }) => {
  const { levels, myBooks, statusOf, setBookStatus, addMyBook } = store;
  const [sheet, setSheet] = useState(false);
  const key = dismissKey('reading', date);
  const [hidden, setHidden] = useState(() => readDismissed(key));
  const [showAll, setShowAll] = useState(false);
  const [mine, setMine] = useState({ title: '', author: '' });
  const [error, setError] = useState('');

  const all = useMemo(() => levels.flatMap((l) => l.books).concat(myBooks), [levels, myBooks]);
  const ongoing = all.filter((b) => statusOf(b.id) === 'ongoing');
  const waiting = levels.flatMap((l) => l.books).filter((b) => statusOf(b.id) === 'not_started');
  const next = waiting[0];
  const prompt = filled && !hidden;

  const closeSheet = () => { setSheet(false); writeDismissed(key); setHidden(true); };
  const addOwn = async () => {
    if (!mine.title.trim()) { setError('Please enter the book name.'); return; }
    setError('');
    await addMyBook({ title: mine.title.trim(), author: mine.author.trim(), status: 'ongoing' });
    setMine({ title: '', author: '' });
  };

  const BookRow = ({ b, children }) => (
    <div className="flex items-center gap-2 py-2.5 border-b border-gray-100 last:border-0">
      <span className="flex-1 min-w-0 text-[14px] font-bold text-[#0f172a] break-words">{b.title}</span>
      {children}
    </div>
  );

  return (
    <div className={cardCls(prompt)}>
      {prompt && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-extrabold text-amber-700 dark:text-amber-300">Nice! Which book did you read?</span>
          <button type="button" onClick={() => { writeDismissed(key); setHidden(true); }} aria-label="Not now" className="text-[12px] font-bold text-amber-700/70">Not now</button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className={labelCls}>Presently reading</p>
          <p className="text-[14px] font-bold text-[#0f172a] dark:text-white break-words">{ongoing.length ? joinTitles(ongoing) : <span className="text-gray-400 font-semibold">No book chosen</span>}</p>
        </div>
        <button type="button" onClick={() => setSheet(true)} className={smallBtn}>Update</button>
      </div>
      {next && (
        <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <p className={labelCls}>Next recommended</p>
            <p className="text-[14px] font-bold text-[#0f172a] dark:text-white break-words">{next.title}</p>
          </div>
          <button type="button" onClick={() => setBookStatus(next.id, 'ongoing', 'Started reading')} className={ghostBtn}>Start</button>
        </div>
      )}

      <BottomSheet open={sheet} title="What are you reading?" onClose={closeSheet}>
        <p className={`${labelCls} mb-1`}>Reading now (you can have more than one)</p>
        {ongoing.length === 0 && <p className="text-[13px] text-gray-400 font-semibold py-2">No book chosen yet. Pick from below.</p>}
        {ongoing.map((b) => (
          <BookRow key={b.id} b={b}>
            <button type="button" onClick={() => setBookStatus(b.id, 'completed', 'Marked as completed')} className={smallBtn}>Done</button>
            <button type="button" onClick={() => setBookStatus(b.id, 'not_started')} className={ghostBtn}>Stop</button>
          </BookRow>
        ))}

        <p className={`${labelCls} mt-5 mb-1`}>Recommended books</p>
        {waiting.length === 0 && <p className="text-[13px] text-gray-400 font-semibold py-2">No more books waiting in your list.</p>}
        {(showAll ? waiting : waiting.slice(0, 5)).map((b) => (
          <BookRow key={b.id} b={b}>
            <button type="button" onClick={() => setBookStatus(b.id, 'ongoing', 'Started reading')} className={ghostBtn}>Start</button>
          </BookRow>
        ))}
        {waiting.length > 5 && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 text-[13px] font-extrabold text-blue-600">
            {showAll ? 'Show fewer' : `Show all ${waiting.length}`}
          </button>
        )}

        <p className={`${labelCls} mt-5 mb-2`}>Reading something else?</p>
        <Field label="Book name">
          <input className={inputCls} value={mine.title} onChange={(e) => setMine({ ...mine, title: e.target.value })} placeholder="Book name" />
        </Field>
        <Field label="Author (optional)">
          <input className={inputCls} value={mine.author} onChange={(e) => setMine({ ...mine, author: e.target.value })} placeholder="Author" />
        </Field>
        {error && <p className="text-[13px] font-semibold text-red-500 mb-3">{error}</p>}
        <button type="button" onClick={addOwn} className="w-full py-3.5 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[15px] active:scale-[0.98] transition-all">Add and start reading</button>
      </BottomSheet>
    </div>
  );
};

// ---------------------------------------------------------------- Hearing

const looksLikeUrl = (v) => !v || /^https?:\/\/\S+\.\S+/i.test(v.trim());
const blankLecture = () => ({ title: '', option: 'Srila Prabhupada', other: '', link: '', heardOn: localToday() });

const HearingCard = ({ store, filled, date }) => {
  const { lectures, heard, heardIds, markHeard, unmarkHeard, addHeard } = store;
  const [sheet, setSheet] = useState(false);
  const key = dismissKey('hearing', date);
  const [hidden, setHidden] = useState(() => readDismissed(key));
  const [form, setForm] = useState(blankLecture());
  const [error, setError] = useState('');

  const today = localToday();
  const heardToday = heard.filter((h) => h.heardOn === today).length;
  const last = heard[0];
  const prompt = filled && !hidden;
  const open = [...lectures].sort((a, b) => Number(heardIds.has(a.id)) - Number(heardIds.has(b.id)));
  const recHeard = lectures.filter((l) => heardIds.has(l.id)).length;

  const closeSheet = () => { setSheet(false); writeDismissed(key); setHidden(true); };
  const submit = async () => {
    if (!form.title.trim()) { setError('Please enter the lecture title.'); return; }
    if (!looksLikeUrl(form.link)) { setError('The link should start with http:// or https://'); return; }
    setError('');
    await addHeard({ title: form.title.trim(), speaker: speakerFromChoice(form.option, form.other), link: form.link.trim(), heardOn: form.heardOn });
    setForm(blankLecture());
  };

  return (
    <div className={cardCls(prompt)}>
      {prompt && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-extrabold text-amber-700 dark:text-amber-300">Nice! Which lecture did you hear?</span>
          <button type="button" onClick={() => { writeDismissed(key); setHidden(true); }} className="text-[12px] font-bold text-amber-700/70">Not now</button>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className={labelCls}>Lectures heard {heardToday > 0 ? `· ${heardToday} today` : ''}</p>
          <p className="text-[14px] font-bold text-[#0f172a] dark:text-white break-words">
            {last ? last.title : <span className="text-gray-400 font-semibold">Nothing added yet</span>}
          </p>
        </div>
        <button type="button" onClick={() => setSheet(true)} className={smallBtn}>Fill</button>
      </div>

      <BottomSheet open={sheet} title="Lectures I heard" onClose={closeSheet}>
        <p className={`${labelCls} mb-1`}>Recommended · {recHeard} of {lectures.length} heard</p>
        {open.length === 0 && <p className="text-[13px] text-gray-400 font-semibold py-2">Your counsellor has not recommended any lectures yet.</p>}
        {open.map((l) => {
          const done = heardIds.has(l.id);
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => (done ? unmarkHeard(l.id) : markHeard(l))}
              className="w-full flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0 text-left"
            >
              <span className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}>
                {done ? '✓' : ''}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-bold text-[#0f172a] break-words">{l.title}</span>
                {l.speaker && <span className="block text-[11px] font-semibold text-gray-400">{l.speaker}</span>}
              </span>
            </button>
          );
        })}

        <p className={`${labelCls} mt-5 mb-2`}>Heard something else? Add your own</p>
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
          <input type="date" className={inputCls} value={form.heardOn} max={today} onChange={(e) => setForm({ ...form, heardOn: e.target.value })} />
        </Field>
        {error && <p className="text-[13px] font-semibold text-red-500 mb-3">{error}</p>}
        <button type="button" onClick={submit} className="w-full py-3.5 rounded-2xl bg-[#1e293b] text-white font-extrabold text-[15px] active:scale-[0.98] transition-all">Add lecture</button>
      </BottomSheet>
    </div>
  );
};
