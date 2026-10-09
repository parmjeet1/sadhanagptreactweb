import { useState } from 'react';
import { MOCK_LEVELS, MOCK_LECTURES } from './data/mockData';
import { MOCK_GROUPS, MOCK_MENTEES, scopeKey, scopeLabel, menteesInScope } from './data/mockCounsellor';

const allBooks = MOCK_LEVELS.flatMap((l) => l.books);
const done = (extra = {}) => Promise.resolve({ ok: true, ...extra });

/**
 * In-memory stand-in for the counsellor tools (UI preview only, nothing is saved).
 * Same functions as useCounsellorTools, which talks to the real backend.
 */
export default function useMockCounsellorTools() {
  const [customBooks, setCustomBooks] = useState({});
  const [customLectures, setCustomLectures] = useState({});

  const without = (obj, k) => { const n = { ...obj }; delete n[k]; return n; };

  return {
    loading: false,
    loadError: '',
    reload: () => {},
    groups: MOCK_GROUPS,
    scopeInfo: (scope) => ({
      name: scopeLabel(scope),
      count: menteesInScope(scope).length,
      custom: { reading: !!customBooks[scopeKey(scope)], lecture: !!customLectures[scopeKey(scope)] },
    }),
    openReadingEditor: (scope) => done({ levels: customBooks[scopeKey(scope)] || MOCK_LEVELS, isCustom: !!customBooks[scopeKey(scope)], library: allBooks }),
    saveReading: (scope, levels) => { setCustomBooks((c) => ({ ...c, [scopeKey(scope)]: levels })); return done(); },
    resetReading: (scope) => { setCustomBooks((c) => without(c, scopeKey(scope))); return done(); },
    openLectureEditor: (scope) => done({ list: customLectures[scopeKey(scope)] || MOCK_LECTURES, isCustom: !!customLectures[scopeKey(scope)] }),
    saveLectures: (scope, list) => { setCustomLectures((c) => ({ ...c, [scopeKey(scope)]: list })); return done(); },
    resetLectures: (scope) => { setCustomLectures((c) => without(c, scopeKey(scope))); return done(); },
    loadMenteesReading: (scope) => done({ books: allBooks, mentees: menteesInScope(scope) }),
    loadMenteesLectures: (scope) => done({ mentees: menteesInScope(scope) }),
  };
}

export { MOCK_MENTEES };
