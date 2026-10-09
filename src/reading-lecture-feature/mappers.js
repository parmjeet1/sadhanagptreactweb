// Turn what the backend sends into the shapes the Reading / Lectures screens already use (and back).
// Pure functions, no imports. A book / lecture with a TEXT id (like "c1696...") was typed in on the
// screen and does not exist on the server yet; one with a NUMBER id comes from the server.

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
  addedDaysAgo: l.is_new ? DAYS_NEW : DAYS_OLD,
});

export const mapHeard = (h) => ({
  id: h.log_id, lectureId: h.lecture_id, title: h.title, speaker: h.speaker || '', link: h.link || '', heardOn: h.heard_on,
});

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

/** mentees-status -> what MenteeStatusWindow shows */
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
