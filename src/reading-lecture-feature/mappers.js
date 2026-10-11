// Turn what the backend sends into the shapes the Reading / Lectures screens already use (and back).
// Pure functions (only small helpers imported). A book / lecture with a TEXT id (like "c1696...") was typed in on the
// screen and does not exist on the server yet; one with a NUMBER id comes from the server.

import { speakerKind, countKinds } from './kinds';
import { daysBefore, localToday } from './dates';

const DAYS_NEW = 0;     // shown with the NEW badge (screens show it for addedDaysAgo <= 7)
const DAYS_OLD = 99;

export const mapBook = (b) => ({
  id: b.book_id, title: b.title, title_hi: b.title_hi || '', author: b.author || '', link: b.link || '',
  addedDaysAgo: b.is_new ? DAYS_NEW : DAYS_OLD,
});

export const mapLevels = (levels = []) =>
  levels.map((l) => ({ id: l.level_id, name: l.name, name_hi: l.name_hi || '', books: (l.books || []).map(mapBook) }));

/** book id -> status, for every book of the list and the person's own books */
export const statusMapOf = (levels, myBooks) => {
  const out = {};
  [...levels.flatMap((l) => l.books), ...myBooks].forEach((b) => { out[b.id] = b.status || 'not_started'; });
  return out;
};

export const mapLecture = (l) => ({
  id: l.lecture_id, title: l.title, title_hi: l.title_hi || '', speaker: l.speaker || '', link: l.link || '',
  kind: l.speaker_kind || speakerKind(l.speaker),
  addedDaysAgo: l.is_new ? DAYS_NEW : DAYS_OLD,
});

export const mapHeard = (h) => ({
  id: h.log_id, lectureId: h.lecture_id, title: h.title, speaker: h.speaker || '', link: h.link || '', heardOn: h.heard_on,
  kind: h.speaker_kind || speakerKind(h.speaker),
});

/**
 * The numbers for the two circles of the Hearing tab, worked out from the lists on the screen (so they
 * change at once when a lecture is ticked): lectures heard by kind (recommended AND own ones count),
 * and how many of the recommended lectures are heard.
 */
export const summarizeHearing = (lectures, heard, heardIds) => {
  const since = daysBefore(localToday(), 6);
  const byKind = countKinds(heard);
  return {
    byKind,
    total: heard.length,
    last7: heard.filter((h) => h.heardOn >= since).length,
    recommended: lectures.length,
    recommendedHeard: lectures.filter((l) => heardIds.has(l.id)).length,
  };
};

const isNewId = (id) => typeof id === 'string';
const orUndef = (v) => (v === '' || v === null || v === undefined ? undefined : v);

/** Counsellor's edited levels -> the body of save-plan */
export const levelsToPayload = (levels) =>
  levels.map((l) => ({
    name: l.name,
    name_hi: orUndef(l.name_hi),
    books: l.books.map((b) => (isNewId(b.id)
      ? { title: b.title, title_hi: orUndef(b.title_hi), author: orUndef(b.author), link: orUndef(b.link) }
      : { book_id: b.id })),
  }));

/** Counsellor's edited lecture list -> the body of save-plan */
export const lecturesToPayload = (list) =>
  list.map((l) => (isNewId(l.id)
    ? { title: l.title, title_hi: orUndef(l.title_hi), speaker: orUndef(l.speaker), link: orUndef(l.link) }
    : { lecture_id: l.id }));

/** mentees-report/list -> the Mentees Report tab list (group -> sub-group -> mentees) */
export const mapReportList = (data) => ({
  count: data.mentee_count || 0,
  last7Total: data.heard_last_7_days || 0,
  since: data.since,
  groups: (data.groups || []).map((g) => ({
    id: g.group_id, name: g.name, count: g.count || 0,
    subgroups: (g.subgroups || []).map((s) => ({
      id: s.sub_id, name: s.name,
      mentees: (s.mentees || []).map((m) => ({
        id: m.user_id, name: m.name || m.user_id, last7: m.last_7_days || 0, total: m.total_heard || 0, reading: m.ongoing_books || [],
      })),
    })),
  })),
});

/** mentees-report/mentee -> the single mentee window */
export const mapMenteeReport = (data) => {
  const r = data.reading || {};
  const l = data.lectures || {};
  return {
    mentee: { id: data.mentee.user_id, name: data.mentee.name || data.mentee.user_id, group: data.mentee.group_name, sub: data.mentee.sub_name },
    books: {
      listKind: r.list && !r.list.is_default ? 'recommended' : 'default',
      total: r.total || 0, completed: r.completed || 0, ongoing: r.ongoing || 0,
      levels: (r.levels || []).map((lv) => ({
        id: lv.level_id, name: lv.name, name_hi: lv.name_hi || '',
        books: (lv.books || []).map((b) => ({ id: b.book_id, title: b.title, title_hi: b.title_hi || '', status: b.status, startedAt: b.started_at, completedAt: b.completed_at, days: b.days })),
      })),
      own: (r.own_books || []).map((o) => ({ id: o.book_id, title: o.title, status: o.status })),
    },
    lectures: {
      since: l.since, last7: l.last_7_days || 0, total: l.total_heard || 0,
      byKind: l.by_kind || { prabhupada: 0, guru: 0, others: 0 },
      recommendedTotal: l.recommended_total || 0, recommendedHeard: l.recommended_heard || 0,
      items: (l.items || []).map((i) => ({
        id: i.log_id, title: i.title, speaker: i.speaker || '', kind: i.speaker_kind || speakerKind(i.speaker), link: i.link || '',
        heardOn: i.heard_on, recommended: !!i.recommended, own: !!i.is_custom,
      })),
    },
  };
};

/** mentees-status -> what MenteeStatusWindow shows (older window, no longer used by the tabs) */
export const mapMenteesReading = (data) => ({
  books: (data.books || []).map((b) => ({ id: b.book_id, title: b.title })),
  mentees: (data.mentees || []).map((m) => ({
    id: m.user_id,
    name: m.name || m.user_id,
    status: m.statuses || {},
    ongoingDays: Object.fromEntries((m.reading || []).filter((r) => r.days !== null && r.days !== undefined).map((r) => [r.book_id, r.days])),
    own: (m.own || []).map((o) => ({ title: o.title, status: o.status })),
  })),
});

/** mentees-lectures -> what MenteeLecturesWindow shows */
export const mapMenteesLectures = (data) => ({
  mentees: (data.mentees || []).map((m) => ({
    id: m.user_id,
    name: m.name || m.user_id,
    lectures: (m.lectures || []).map((l) => ({ title: l.title, speaker: l.speaker || '', heardOn: l.heard_on })),
  })),
});

/** scopes -> the group list for the scope picker + a lookup for names, counts and "custom list" flags */
export const mapScopes = (data) => {
  const groups = (data.groups || []).map((g) => ({
    id: String(g.group_id), name: g.name, mentees: g.mentees, custom: g.has_custom,
    subgroups: (g.subgroups || []).map((s) => ({ id: String(s.sub_id), name: s.name, mentees: s.mentees, custom: s.has_custom })),
  }));
  return { all: { name: data.all?.name || 'All groups', mentees: data.all?.mentees || 0, custom: data.all?.has_custom || {} }, groups };
};

/** { groupId, subId } -> name, mentee count and custom-list flags, from mapScopes() output */
export const scopeInfoOf = (scopes, scope) => {
  const none = { reading: false, lecture: false };
  if (!scopes) return { name: '', count: 0, custom: none };
  if (scope.groupId === 'all') return { name: scopes.all.name, count: scopes.all.mentees, custom: scopes.all.custom || none };
  const g = scopes.groups.find((x) => x.id === String(scope.groupId));
  if (!g) return { name: '', count: 0, custom: none };
  if (scope.subId === 'all') return { name: g.name, count: g.mentees, custom: g.custom || none };
  const s = g.subgroups.find((x) => x.id === String(scope.subId));
  return { name: `${g.name} / ${s?.name || ''}`, count: s?.mentees || 0, custom: s?.custom || none };
};
