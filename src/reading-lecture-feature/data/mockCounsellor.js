// MOCK data for the counsellor UI preview only (sample names, nothing real).
import { DEFAULT_AUTHOR } from './mockData';

export const MOCK_GROUPS = [
  { id: 'g1', name: 'Sunday Class', subgroups: [{ id: 's1', name: 'Youth' }, { id: 's2', name: 'Ladies' }] },
  { id: 'g2', name: 'Weekday Class', subgroups: [{ id: 's3', name: 'Beginners' }] },
];

// A mentee's book status (book id -> status), plus own books and lectures heard
export const MOCK_MENTEES = [
  { id: 'm1', name: 'Sample Mentee A', groupId: 'g1', subId: 's1', status: { 101: 'completed', 102: 'completed', 103: 'ongoing', 104: 'not_started' }, ongoingDays: { 103: 12 }, own: [{ title: 'Teachings of Lord Caitanya', status: 'ongoing' }],
    lectures: [{ title: 'Sample recommended lecture 1', speaker: DEFAULT_AUTHOR, heardOn: '2026-10-07' }, { title: 'A lecture on devotion', speaker: 'Sample Speaker', heardOn: '2026-10-02' }] },
  { id: 'm2', name: 'Sample Mentee B', groupId: 'g1', subId: 's1', status: { 101: 'ongoing', 102: 'not_started' }, ongoingDays: { 101: 45 }, own: [], lectures: [] },
  { id: 'm3', name: 'Sample Mentee C', groupId: 'g1', subId: 's2', status: { 101: 'completed', 102: 'completed', 103: 'completed', 104: 'completed', 105: 'ongoing' }, ongoingDays: { 105: 5 }, own: [], lectures: [{ title: 'Sample lecture added by your counsellor', speaker: 'Counsellor choice', heardOn: '2026-10-08' }] },
  { id: 'm4', name: 'Sample Mentee D', groupId: 'g2', subId: 's3', status: {}, ongoingDays: {}, own: [], lectures: [] },
  { id: 'm5', name: 'Sample Mentee E', groupId: 'g2', subId: 's3', status: { 101: 'ongoing', 102: 'skipped' }, ongoingDays: { 101: 3 }, own: [{ title: 'Easy Journey to Other Planets', status: 'completed' }], lectures: [{ title: 'Sample recommended lecture 2', speaker: DEFAULT_AUTHOR, heardOn: '2026-09-30' }] },
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
