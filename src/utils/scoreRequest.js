// Helpers for the dashboard's "latest answer wins" rule.
//
// Every save asks the server for the score and for the day's entries again. Answers can arrive out
// of order, and the screen used to keep whichever arrived LAST - sometimes an older answer that sent
// a slider back to 0 or showed a wrong score. createLatestGuard() lets an answer be ignored once a
// newer request has started.

export const createLatestGuard = () => {
  let latest = 0;
  return {
    next: () => ++latest,
    isLatest: (id) => id === latest,
  };
};

/** The score object from a /daily-score answer, or null when the answer is not a real score. */
export const readScoreResponse = (response) => {
  const body = response?.data;
  if (body?.status !== 1 || !body.data || typeof body.data !== 'object') return null;
  const { earnedMarks, maxMarks, percentage } = body.data;
  if ([earnedMarks, maxMarks, percentage].some((v) => v === undefined || v === null || Number.isNaN(Number(v)))) return null;
  return body.data;
};

// A failed score request is tried again after these waits (ms) before giving up, and the score is
// checked once more this long (ms) after every save, so the circle follows what the server holds even
// when the first answer was lost or came back stale.
export const SCORE_RETRY_DELAYS_MS = [1000, 2000, 4000];
export const SCORE_RECHECK_MS = 3000;
