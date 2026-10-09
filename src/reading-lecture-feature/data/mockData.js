// MOCK data for the UI preview only. It is replaced by the real server data later.
// The default list below is a PLACEHOLDER (same as DB-SEED-DEFAULT.sql), not an official order.

export const DEFAULT_AUTHOR = 'Srila Prabhupada';

export const MOCK_LEVELS = [
  {
    id: 1, name: 'Level 1 - Foundation', name_hi: 'स्तर 1 - आधार',
    books: [
      { id: 101, title: 'Bhagavad-gita As It Is', title_hi: 'भगवद्गीता यथारूप', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
    ],
  },
  {
    id: 2, name: 'Level 2 - Bhakti-sastri', name_hi: 'स्तर 2 - भक्ति-शास्त्री',
    books: [
      { id: 102, title: 'Sri Isopanisad', title_hi: 'श्री ईशोपनिषद', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 103, title: 'Nectar of Instruction', title_hi: 'उपदेशामृत', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 104, title: 'Nectar of Devotion', title_hi: '', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 2 },
    ],
  },
  {
    id: 3, name: 'Level 3 - Deeper study', name_hi: 'स्तर 3 - गहन अध्ययन',
    books: [
      { id: 105, title: 'Srimad-Bhagavatam', title_hi: 'श्रीमद्भागवतम्', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 106, title: 'Sri Caitanya-caritamrta', title_hi: 'श्री चैतन्य चरितामृत', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 107, title: 'Krsna, the Supreme Personality of Godhead', title_hi: '', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
    ],
  },
];

// Starting status of the sample person (book id -> status)
export const MOCK_STATUS = { 101: 'completed', 102: 'ongoing', 105: 'skipped' };

// SAMPLE lectures: made-up titles only so the screen has something to show. No real links.
export const MOCK_LECTURES = [
  { id: 201, title: 'Sample recommended lecture 1', title_hi: '', speaker: DEFAULT_AUTHOR, link: '', addedDaysAgo: 60 },
  { id: 202, title: 'Sample recommended lecture 2', title_hi: '', speaker: DEFAULT_AUTHOR, link: '', addedDaysAgo: 60 },
  { id: 203, title: 'Sample lecture added by your counsellor', title_hi: '', speaker: 'Counsellor choice', link: '', addedDaysAgo: 1 },
];

export const MOCK_HEARD_START = [
  { id: 'h1', lectureId: 201, title: 'Sample recommended lecture 1', speaker: DEFAULT_AUTHOR, link: '', heardOn: '2026-10-05' },
];

export const STATUS_LABEL = {
  not_started: { en: 'Not started', hi: 'शुरू नहीं' },
  ongoing: { en: 'Ongoing', hi: 'जारी' },
  completed: { en: 'Completed', hi: 'पूर्ण' },
  skipped: { en: 'Skipped', hi: 'छोड़ा' },
};
