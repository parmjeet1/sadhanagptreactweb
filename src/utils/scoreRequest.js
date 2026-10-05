// Helpers for the "Today's Sadhana Score" circle.
//
// Every save asks the server for the score again. Replies can arrive out of order, and the circle
// used to show whichever arrived LAST - sometimes an older, smaller number. createLatestGuard()
// lets a reply be ignored once a newer request has started.

export const createLatestGuard = () => {
  let latest = 0;
  return {
    next: () => ++latest,
    isLatest: (id) => id === latest,
  };
};

/** The score object from an /daily-score reply, or null when the reply is not a real score. */
export const readScoreResponse = (response) => {
  const body = response?.data;
  if (body?.status !== 1 || !body.data || typeof body.data !== 'object') return null;
  const { earnedMarks, maxMarks, percentage } = body.data;
  if ([earnedMarks, maxMarks, percentage].some((v) => v === undefined || v === null || Number.isNaN(Number(v)))) return null;
  return body.data;
};
