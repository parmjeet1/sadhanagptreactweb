import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import * as api from './api';
import { mapLevels, mapBook, statusMapOf, mapLecture, mapHeard } from './mappers';

const NEXT = { not_started: 'ongoing', ongoing: 'completed', completed: 'not_started', skipped: 'not_started' };

/**
 * The REAL store for the logged-in person's own reading and lectures (student or counsellor).
 * Same names as useMockStore, so the screens work with either. Status taps change the screen at
 * once and are saved in the background; if saving fails the old status comes back with a message.
 */
export default function useReadingLectureStore() {
  const [levels, setLevels] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [status, setStatus] = useState({});
  const [lectures, setLectures] = useState([]);
  const [heard, setHeard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const flash = useCallback((message, undo) => {
    clearTimeout(timer.current);
    setToast({ message, undo });
    timer.current = setTimeout(() => setToast(null), 5000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const applyBooks = useCallback((data) => {
    const lv = mapLevels(data.levels);
    const mine = (data.my_books || []).map(mapBook);
    setLevels(lv);
    setMyBooks(mine);
    setStatus(statusMapOf(
      (data.levels || []).map((l) => ({ books: l.books.map((b) => ({ id: b.book_id, status: b.status })) })),
      (data.my_books || []).map((b) => ({ id: b.book_id, status: b.status }))
    ));
  }, []);
  const applyLectures = useCallback((data) => {
    setLectures((data.lectures || []).map(mapLecture));
    setHeard((data.log || []).map(mapHeard));
  }, []);

  const reloadBooks = useCallback(async () => { const r = await api.fetchReadingPlan(); if (r.ok) applyBooks(r.data); return r; }, [applyBooks]);
  const reloadLectures = useCallback(async () => { const r = await api.fetchLecturePlan(); if (r.ok) applyLectures(r.data); return r; }, [applyLectures]);

  // first load (and "Try again"): `loading` already starts as true, so nothing is set before the answers arrive
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    (async () => {
      const [b, l] = await Promise.all([api.fetchReadingPlan(), api.fetchLecturePlan()]);
      if (!alive) return;
      if (b.ok) applyBooks(b.data);
      if (l.ok) applyLectures(l.data);
      setLoadError(b.ok ? (l.ok ? '' : l.message) : b.message);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [tick, applyBooks, applyLectures]);
  const reload = useCallback(() => { setLoading(true); setLoadError(''); setTick((t) => t + 1); }, []);

  const statusOf = useCallback((id) => status[id] || 'not_started', [status]);

  // ---- books ----
  async function changeStatus(id, next, prev, okMessage) {
    setStatus((s) => ({ ...s, [id]: next }));
    const r = await api.saveBookStatus(id, next);
    if (!r.ok) {
      setStatus((s) => ({ ...s, [id]: prev }));
      flash(r.message);
      return;
    }
    if (okMessage) flash(okMessage, () => { setToast(null); changeStatus(id, prev, next); });
  }

  const cycleStatus = (id) => {
    const prev = statusOf(id);
    const next = NEXT[prev];
    changeStatus(id, next, prev, next === 'completed' ? 'Marked as completed' : null);
  };
  const toggleSkip = (id) => {
    const prev = statusOf(id);
    const wasSkipped = prev === 'skipped';
    changeStatus(id, wasSkipped ? 'not_started' : 'skipped', prev, wasSkipped ? 'Book brought back' : 'Book skipped');
  };

  const addMyBook = async ({ title, author, status: st }) => {
    const r = await api.createMyBook({ title, author, status: st });
    if (!r.ok) { flash(r.message); return; }
    await reloadBooks();
    flash('Book added');
  };
  const removeMyBook = async (id) => {
    const r = await api.deleteMyBook(id);
    if (!r.ok) { flash(r.message); return; }
    await reloadBooks();
    flash('Book removed');
  };

  // ---- lectures ----
  const heardIds = useMemo(() => new Set(heard.filter((h) => h.lectureId !== null && h.lectureId !== undefined).map((h) => h.lectureId)), [heard]);
  const markHeard = async (l) => {
    const r = await api.saveLectureHeard(l.id);
    if (!r.ok) { flash(r.message); return; }
    await reloadLectures();
  };
  const unmarkHeard = async (lectureId) => {
    const r = await api.saveLectureUnheard(lectureId);
    if (!r.ok) { flash(r.message); return; }
    await reloadLectures();
  };
  const addHeard = async ({ title, speaker, link, heardOn }) => {
    const r = await api.createMyLecture({ title, speaker, link: link || undefined, heardOn });
    if (!r.ok) { flash(r.message); return; }
    await reloadLectures();
    flash('Lecture added');
  };
  const removeHeard = async (id) => {
    const entry = heard.find((h) => h.id === id);
    if (!entry) return;
    const isRecommended = entry.lectureId !== null && entry.lectureId !== undefined;
    const r = isRecommended ? await api.saveLectureUnheard(entry.lectureId) : await api.deleteMyLecture(id);
    if (!r.ok) { flash(r.message); return; }
    await reloadLectures();
  };

  const progress = useMemo(() => {
    const all = levels.flatMap((lv) => lv.books).concat(myBooks);
    const counted = all.filter((b) => (status[b.id] || 'not_started') !== 'skipped');
    return { done: counted.filter((b) => status[b.id] === 'completed').length, total: counted.length };
  }, [status, myBooks, levels]);

  return {
    levels, lectures, myBooks, heard, heardIds, toast, setToast, statusOf, cycleStatus, toggleSkip,
    addMyBook, removeMyBook, markHeard, unmarkHeard, addHeard, removeHeard, progress,
    loading, loadError, reload, flash,
  };
}
