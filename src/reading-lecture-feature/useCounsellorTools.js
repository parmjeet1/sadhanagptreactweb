import { useState, useEffect } from 'react';
import * as api from './api';
import {
  mapScopes, scopeInfoOf, mapLevels, mapBook, mapLecture, levelsToPayload, lecturesToPayload,
  mapMenteesReading, mapMenteesLectures,
} from './mappers';

/**
 * The REAL counsellor tools (same functions as useMockCounsellorTools): his groups, the editable
 * reading / lecture lists per group, and what his mentees have read and heard. Every function
 * resolves to { ok, message, ...data } and never throws.
 */
export default function useCounsellorTools() {
  const [scopes, setScopes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // loads his groups; a save / reset bumps `tick` so the "custom list" flags are read again
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    (async () => {
      const r = await api.fetchScopes();
      if (!alive) return;
      if (r.ok) { setScopes(mapScopes(r.data)); setLoadError(''); } else setLoadError(r.message);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [tick]);

  const after = async (r) => { if (r.ok) setTick((t) => t + 1); return r; };

  return {
    loading,
    loadError,
    reload: () => { setLoading(true); setLoadError(''); setTick((t) => t + 1); },
    groups: scopes ? scopes.groups : [],
    scopeInfo: (scope) => scopeInfoOf(scopes, scope),

    openReadingEditor: async (scope) => {
      const r = await api.fetchReadingEditor(scope);
      if (!r.ok) return r;
      return { ok: true, levels: mapLevels(r.data.levels), isCustom: !!r.data.is_custom, library: (r.data.library || []).map(mapBook) };
    },
    saveReading: async (scope, levels) => after(await api.saveReadingPlan(scope, levelsToPayload(levels))),
    resetReading: async (scope) => after(await api.resetReadingPlan(scope)),

    openLectureEditor: async (scope) => {
      const r = await api.fetchLectureEditor(scope);
      if (!r.ok) return r;
      return { ok: true, list: (r.data.lectures || []).map(mapLecture), isCustom: !!r.data.is_custom };
    },
    saveLectures: async (scope, list) => after(await api.saveLecturePlan(scope, lecturesToPayload(list))),
    resetLectures: async (scope) => after(await api.resetLecturePlan(scope)),

    loadMenteesReading: async (scope) => {
      const r = await api.fetchMenteesReading(scope);
      return r.ok ? { ok: true, ...mapMenteesReading(r.data) } : r;
    },
    loadMenteesLectures: async (scope) => {
      const r = await api.fetchMenteesLectures(scope);
      return r.ok ? { ok: true, ...mapMenteesLectures(r.data) } : r;
    },
  };
}
