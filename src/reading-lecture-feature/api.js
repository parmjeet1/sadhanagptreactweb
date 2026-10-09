// Calls to the backend for the Reading + Lectures feature (see the backend folder
// SadhanaGPT/reading-lecture-feature/README.md for every route).
// Every call resolves to { ok, data, message, code } and never throws, so screens can show a plain message.
import { getRequest, postRequest } from '../services/api';

const first = (m) => (Array.isArray(m) ? m[0] : m);

const unwrap = (response) => {
  const body = response?.data;
  if (body && body.status === 1) return { ok: true, data: body.data || {}, message: first(body.message), code: 200 };
  return { ok: false, data: body?.data ?? null, message: first(body?.message) || 'Something went wrong. Please try again.', code: body?.code };
};

const get = (path, params = {}) => new Promise((resolve) => getRequest(path, params, (r) => resolve(unwrap(r))));
const post = (path, payload = {}) => new Promise((resolve) => postRequest(path, payload, (r) => resolve(unwrap(r))));

/** { groupId: 'all' | id, subId: 'all' | id } -> the query/body fields the backend expects */
const scopeParams = (scope) => ({ group_id: scope.groupId, sub_id: scope.subId });

// ---- the logged-in person's own reading and lectures (students and counsellors) ----
export const fetchReadingPlan = () => get('/reading/plan');
export const saveBookStatus = (bookId, status) => post('/reading/book-status', { book_id: bookId, status });
export const createMyBook = ({ title, author, status }) => post('/reading/add-my-book', { title, author, status });
export const deleteMyBook = (bookId) => post('/reading/remove-my-book', { book_id: bookId });

export const fetchLecturePlan = () => get('/lectures/plan');
export const saveLectureHeard = (lectureId) => post('/lectures/mark-heard', { lecture_id: lectureId });
export const saveLectureUnheard = (lectureId) => post('/lectures/unmark-heard', { lecture_id: lectureId });
export const createMyLecture = ({ title, speaker, link, heardOn }) => post('/lectures/add-my-lecture', { title, speaker, link, heard_on: heardOn });
export const deleteMyLecture = (logId) => post('/lectures/remove-my-lecture', { log_id: logId });

// ---- counsellors only ----
export const fetchScopes = () => get('/reading/counsellor/scopes');
export const fetchReadingEditor = (scope) => get('/reading/counsellor/plan', scopeParams(scope));
export const saveReadingPlan = (scope, levels) => post('/reading/counsellor/save-plan', { ...scopeParams(scope), levels });
export const resetReadingPlan = (scope) => post('/reading/counsellor/reset-plan', scopeParams(scope));
export const fetchMenteesReading = (scope) => get('/reading/counsellor/mentees-status', scopeParams(scope));

export const fetchLectureEditor = (scope) => get('/lectures/counsellor/plan', scopeParams(scope));
export const saveLecturePlan = (scope, lectures) => post('/lectures/counsellor/save-plan', { ...scopeParams(scope), lectures });
export const resetLecturePlan = (scope) => post('/lectures/counsellor/reset-plan', scopeParams(scope));
export const fetchMenteesLectures = (scope) => get('/lectures/counsellor/mentees-lectures', scopeParams(scope));
