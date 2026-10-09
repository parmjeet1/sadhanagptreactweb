import { useState, useMemo, useRef, useCallback } from 'react';
import { MOCK_LEVELS, MOCK_STATUS, MOCK_LECTURES, MOCK_HEARD_START } from './data/mockData';

const NEXT = { not_started: 'ongoing', ongoing: 'completed', completed: 'not_started', skipped: 'not_started' };

/**
 * In-memory stand-in for the server (UI preview only). Nothing is saved.
 * The real version will call the backend with the same function names.
 */
export default function useMockStore() {
  const [status, setStatus] = useState(MOCK_STATUS);
  const [myBooks, setMyBooks] = useState([]);
  const [heard, setHeard] = useState(MOCK_HEARD_START);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const levels = MOCK_LEVELS;
  const lectures = MOCK_LECTURES;
  const statusOf = useCallback((id) => status[id] || 'not_started', [status]);

  const flash = (message, undo) => {
    clearTimeout(timer.current);
    setToast({ message, undo });
    timer.current = setTimeout(() => setToast(null), 5000);
  };

  const cycleStatus = (id) => {
    const prev = statusOf(id);
    const next = NEXT[prev];
    setStatus((s) => ({ ...s, [id]: next }));
    if (next === 'completed') flash('Marked as completed', () => { setStatus((s) => ({ ...s, [id]: prev })); setToast(null); });
  };

  const toggleSkip = (id) => {
    const wasSkipped = statusOf(id) === 'skipped';
    setStatus((s) => ({ ...s, [id]: wasSkipped ? 'not_started' : 'skipped' }));
    flash(wasSkipped ? 'Book brought back' : 'Book skipped');
  };

  const addMyBook = ({ title, author, status: st }) => {
    const id = `m${Date.now()}`;
    setMyBooks((b) => [...b, { id, title, title_hi: '', author, link: '', addedDaysAgo: 0 }]);
    setStatus((s) => ({ ...s, [id]: st }));
    flash('Book added');
  };
  const removeMyBook = (id) => { setMyBooks((b) => b.filter((x) => x.id !== id)); flash('Book removed'); };

  const heardIds = useMemo(() => new Set(heard.filter((h) => h.lectureId).map((h) => h.lectureId)), [heard]);
  const markHeard = (l) => setHeard((h) => [{ id: `h${Date.now()}`, lectureId: l.id, title: l.title, speaker: l.speaker, link: l.link, heardOn: new Date().toISOString().slice(0, 10) }, ...h]);
  const unmarkHeard = (lectureId) => setHeard((h) => h.filter((x) => x.lectureId !== lectureId));
  const addHeard = ({ title, speaker, link, heardOn }) => { setHeard((h) => [{ id: `h${Date.now()}`, lectureId: null, title, speaker, link, heardOn }, ...h]); flash('Lecture added'); };
  const removeHeard = (id) => setHeard((h) => h.filter((x) => x.id !== id));

  const progress = useMemo(() => {
    const all = levels.flatMap((lv) => lv.books).concat(myBooks);
    const counted = all.filter((b) => (status[b.id] || 'not_started') !== 'skipped');
    return { done: counted.filter((b) => status[b.id] === 'completed').length, total: counted.length };
  }, [status, myBooks, levels]);

  return { levels, lectures, myBooks, heard, heardIds, toast, setToast, statusOf, cycleStatus, toggleSkip, addMyBook, removeMyBook, markHeard, unmarkHeard, addHeard, removeHeard, progress };
}
