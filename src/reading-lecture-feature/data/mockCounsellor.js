// MOCK data for the counsellor UI preview only (sample names, nothing real).
import { DEFAULT_AUTHOR, MOCK_LEVELS } from './mockData';
import { speakerKind } from '../kinds';
import { localToday, daysBefore } from '../dates';

const ago = (n) => daysBefore(localToday(), n);

export const MOCK_GROUPS = [
  { id: 'g1', name: 'Sunday Class', subgroups: [{ id: 's1', name: 'Youth' }, { id: 's2', name: 'Ladies' }] },
  { id: 'g2', name: 'Weekday Class', subgroups: [{ id: 's3', name: 'Beginners' }] },
];

// A mentee's book status (book id -> status), plus own books and lectures heard
export const MOCK_MENTEES = [
  { id: 'm1', name: 'Sample Mentee A', groupId: 'g1', subId: 's1', status: { 101: 'completed', 102: 'completed', 103: 'ongoing', 104: 'not_started' }, ongoingDays: { 103: 12 }, own: [{ title: 'Teachings of Lord Caitanya', status: 'ongoing' }],
    lectures: [{ title: 'Sample recommended lecture 1', speaker: DEFAULT_AUTHOR, heardOn: ago(2), rec: true }, { title: 'Sample Guru Maharaj lecture', speaker: 'Guru Maharaj', heardOn: ago(2) }, { title: 'A lecture on devotion', speaker: 'Others', heardOn: ago(9) }] },
  { id: 'm2', name: 'Sample Mentee B', groupId: 'g1', subId: 's1', status: { 101: 'ongoing', 102: 'not_started' }, ongoingDays: { 101: 45 }, own: [], lectures: [] },
  { id: 'm3', name: 'Sample Mentee C', groupId: 'g1', subId: 's2', status: { 101: 'completed', 102: 'completed', 103: 'completed', 104: 'completed', 105: 'ongoing' }, ongoingDays: { 105: 5 }, own: [], lectures: [{ title: 'Sample lecture added by your counsellor', speaker: 'Guru Maharaj', heardOn: ago(1), rec: true }] },
  { id: 'm4', name: 'Sample Mentee D', groupId: 'g2', subId: 's3', status: {}, ongoingDays: {}, own: [], lectures: [] },
  { id: 'm5', name: 'Sample Mentee E', groupId: 'g2', subId: 's3', status: { 101: 'ongoing', 102: 'skipped' }, ongoingDays: { 101: 3 }, own: [{ title: 'Easy Journey to Other Planets', status: 'completed' }], lectures: [{ title: 'Sample recommended lecture 2', speaker: DEFAULT_AUTHOR, heardOn: ago(11), rec: true }] },
  { id: 'm6', name: 'Sample Mentee F', groupId: 'g2', subId: null, status: { 101: 'completed' }, ongoingDays: {}, own: [], lectures: [] },
];

/** scope = { groupId: 'all' | id, subId: 'all' | id } -> key used for the saved custom lists */
export const scopeKey = (scope) => `${scope.groupId}|${scope.subId}`;

export const scopeLabel = (scope) => {
  if (scope.groupId === 'all') return 'All groups';
  const g = MOCK_GROUPS.find((x) => x.id === scope.groupId);
  if (scope.subId === 'all') return g ? g.name : '';
  const sg = g?.subgroups.find((x) => x.id === scope.subId);
  return `${g?.name} / ${sg?.name}`;
};

export const menteesInScope = (scope) =>
  MOCK_MENTEES.filter((m) => (scope.groupId === 'all' || m.groupId === scope.groupId) && (scope.subId === 'all' || m.subId === scope.subId));

const UNGROUPED = { id: null, name: 'Ungrouped' };
const lastLast = (list) => [...list.filter((x) => x.id !== null), ...list.filter((x) => x.id === null)];
const last7Of = (m) => m.lectures.filter((l) => l.heardOn >= daysBefore(localToday(), 6)).length;

/** The "Mentees Report" list for a scope, same shape as mapReportList (group -> sub-group -> mentees). */
export const mockReportList = (scope) => {
  const list = menteesInScope(scope);
  const groups = [];
  list.forEach((m) => {
    const gInfo = MOCK_GROUPS.find((g) => g.id === m.groupId) || UNGROUPED;
    let g = groups.find((x) => x.id === gInfo.id);
    if (!g) { g = { id: gInfo.id, name: gInfo.name, count: 0, subgroups: [] }; groups.push(g); }
    const sInfo = MOCK_GROUPS.flatMap((x) => x.subgroups).find((x) => x.id === m.subId) || { id: null, name: 'No sub-group' };
    let sg = g.subgroups.find((x) => x.id === sInfo.id);
    if (!sg) { sg = { id: sInfo.id, name: sInfo.name, mentees: [] }; g.subgroups.push(sg); }
    const ongoing = [...Object.keys(m.status).filter((k) => m.status[k] === 'ongoing').map((k) => MOCK_LEVELS.flatMap((l) => l.books).find((b) => String(b.id) === k)?.title), ...m.own.filter((o) => o.status === 'ongoing').map((o) => o.title)].filter(Boolean);
    sg.mentees.push({ id: m.id, name: m.name, last7: last7Of(m), total: m.lectures.length, reading: ongoing });
    g.count += 1;
  });
  groups.forEach((g) => { g.subgroups.forEach((s) => s.mentees.sort((a, b) => b.last7 - a.last7 || a.name.localeCompare(b.name))); g.subgroups = lastLast(g.subgroups); });
  return { count: list.length, last7Total: list.reduce((n, m) => n + last7Of(m), 0), since: daysBefore(localToday(), 6), groups: lastLast(groups) };
};

/** One mentee's window, same shape as mapMenteeReport. */
export const mockMenteeReport = (id) => {
  const m = MOCK_MENTEES.find((x) => x.id === id);
  if (!m) return null;
  const g = MOCK_GROUPS.find((x) => x.id === m.groupId);
  const levels = MOCK_LEVELS.map((lv) => ({
    id: lv.id, name: lv.name, name_hi: lv.name_hi,
    books: lv.books.map((b) => ({ id: b.id, title: b.title, title_hi: b.title_hi, status: m.status[b.id] || 'not_started', days: m.ongoingDays[b.id] ?? null })),
  }));
  const flat = levels.flatMap((l) => l.books);
  const byKind = { prabhupada: 0, guru: 0, others: 0 };
  m.lectures.forEach((l) => { byKind[speakerKind(l.speaker)] += 1; });
  const items = [...m.lectures].sort((a, b) => (a.heardOn < b.heardOn ? 1 : -1)).map((l, i) => ({ id: i, title: l.title, speaker: l.speaker, kind: speakerKind(l.speaker), link: '', heardOn: l.heardOn, recommended: !!l.rec, own: !l.rec }));
  return {
    mentee: { id: m.id, name: m.name, group: g?.name || null, sub: g?.subgroups.find((s) => s.id === m.subId)?.name || null },
    books: { listKind: 'default', total: flat.length, completed: flat.filter((b) => b.status === 'completed').length, ongoing: flat.filter((b) => b.status === 'ongoing').length, levels, own: m.own.map((o, i) => ({ id: `o${i}`, title: o.title, status: o.status })) },
    lectures: { since: daysBefore(localToday(), 6), last7: last7Of(m), total: m.lectures.length, byKind, recommendedTotal: 3, recommendedHeard: m.lectures.filter((l) => l.rec).length, items },
  };
};
