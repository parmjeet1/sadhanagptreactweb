// "My Marking Scheme" and the activity-by-activity marks window: thin wrappers around the backend routes.
// Every call resolves to { ok, data, message } and never throws, so the screens can show a plain message.
import { postRequest } from '../services/api';

const call = (path, payload = {}) =>
  new Promise((resolve) => {
    postRequest(path, payload, (response) => {
      const body = response?.data;
      if (body && body.status === 1) {
        resolve({ ok: true, data: body.data, message: Array.isArray(body.message) ? body.message[0] : body.message });
      } else {
        const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
        resolve({ ok: false, data: null, message: msg || 'Something went wrong. Please try again.' });
      }
    });
  });

/** Marks of one day, activity by activity (earned and most possible). */
export const fetchMarksBreakdown = (activityDate) => call('/daily-marks-breakdown', { activity_date: activityDate });

/** The built-in default scheme (id 1): read-only rules. */
export const fetchDefaultRules = () => call('/my-marking-rules', { scheme_id: 1 });

/** My own scheme (if I made one), whether I use it, what applies to me now, and my rules. */
export const fetchMyScheme = () => call('/my-marking-scheme');

/** Switch between my own scheme (true) and the default scheme (false). */
export const switchMyScheme = (use) => call('/use-my-marking-scheme', { use: !!use });

/** Save my rules. The first save creates the scheme; useForSelf switches it on at the same time. */
export const saveMyScheme = (activities, useForSelf = false) =>
  call('/my-save-scheme', { activities, use_for_self: !!useForSelf });

/** Remove one rule of my own scheme. */
export const deleteMyRule = (ruleId) => call('/my-delete-rule', { rule_id: ruleId });

/** Counsellors only: read-only view of one student's own scheme. */
export const fetchStudentOwnScheme = (studentId) => call('/student-own-scheme', { student_id: studentId });
