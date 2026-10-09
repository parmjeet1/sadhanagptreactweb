// MOCK data for the UI preview only. The real screens (/student/reading, /counsellor/reading) use the server.
// The default list below is the REAL 54-book list (same as DB-SEED-DEFAULT.sql in the backend repo).

export const DEFAULT_AUTHOR = 'Srila Prabhupada';

export const MOCK_LEVELS = [
  {
    id: 1, name: 'Level 1 - Category I', name_hi: 'स्तर 1 — श्रेणी 1',
    books: [
      { id: 101, title: 'Elevation to Krishna Consciousness', title_hi: 'कृष्णभावनामृत की ओर उत्थान', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 102, title: 'On The Way to Krishna', title_hi: 'कृष्ण की ओर', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 103, title: 'Krishna Consciousness the Matchless Gift', title_hi: 'कृष्णभावनामृत : अनुपम उपहार', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 104, title: 'Krishna the Reservoir of Pleasure', title_hi: 'कृष्ण : आनंद के स्रोत', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 105, title: 'Perfection of Yoga', title_hi: 'योग की पूर्णता', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 106, title: 'Krishna Consciousness - The Topmost Yoga System', title_hi: 'कृष्णभावनामृत : सर्वोच्च योग पद्धति', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 107, title: 'Beyond Birth and Death', title_hi: 'जन्म और मृत्यु से परे', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 108, title: 'Perfect Questions, Perfect Answers', title_hi: 'पूर्ण प्रश्न, पूर्ण उत्तर', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 109, title: 'Easy Journey to Other Planets', title_hi: 'अन्य लोकों की सुगम यात्रा', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 110, title: 'Raja Vidya: The King of Knowledge', title_hi: 'राजविद्या : ज्ञानों का राजा', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 111, title: 'Transcendental Teachings of Prahlad Maharaj', title_hi: 'प्रह्लाद महाराज की दिव्य शिक्षाएँ', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 112, title: 'Coming Back', title_hi: 'पुनर्जन्म', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 113, title: 'Message of Godhead', title_hi: 'भगवान का संदेश', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 114, title: 'Civilization and Transcendence', title_hi: 'सभ्यता और दिव्यता', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 115, title: 'Hare Krishna Challenge', title_hi: 'हरे कृष्ण चुनौती', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 116, title: 'Scientific Basis of Krishna Consciousness', title_hi: 'कृष्णभावनामृत का वैज्ञानिक आधार', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 117, title: 'Sword of Knowledge', title_hi: 'ज्ञान की तलवार', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 118, title: 'Nectar of Instruction', title_hi: 'उपदेशामृत', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 119, title: 'Path of Perfection', title_hi: 'पूर्णता का पथ', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 120, title: 'Prabhupada Condensed', title_hi: 'श्रील प्रभुपाद का संक्षिप्त जीवन परिचय', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 121, title: 'Prabhupada Lilamrita (Volume 1)', title_hi: 'श्रील प्रभुपाद लीलामृत (खंड 1)', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 122, title: 'Prabhupada Lilamrita (Volume 2)', title_hi: 'श्रील प्रभुपाद लीलामृत (खंड 2)', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
    ],
  },
  {
    id: 2, name: 'Level 2 - Category II', name_hi: 'स्तर 2 — श्रेणी 2',
    books: [
      { id: 123, title: 'Introduction to Bhagavad Gita As It Is', title_hi: 'भगवद्गीता का परिचय (गीतासार)', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 124, title: 'Science of Self Realization', title_hi: 'आत्म-साक्षात्कार का विज्ञान', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 125, title: 'Journey of Self Discovery', title_hi: 'आत्मा का प्रवास', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 126, title: 'Life Comes from Life', title_hi: 'जीवन से जीवन की उत्पत्ति', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 127, title: 'Nectar of Devotion (Only Part One)', title_hi: 'भक्तिरसामृतसिन्धु (केवल प्रथम भाग)', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 128, title: 'Teachings of Queen Kunti', title_hi: 'महारानी कुन्ती की शिक्षाएँ', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 129, title: 'Teachings of Lord Kapila', title_hi: 'भगवान कपिल की शिक्षाएँ', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 130, title: 'Teachings of Lord Chaitanya', title_hi: 'भगवान चैतन्य की शिक्षाएँ', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 131, title: 'Sri Isopanishad', title_hi: 'श्री ईशोपनिषद्', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 132, title: 'Krishna Book', title_hi: 'कृष्ण', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 133, title: 'A Second Chance', title_hi: 'एक और अवसर', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 134, title: 'Prabhupada Lilamrita (Volume 3)', title_hi: 'श्रील प्रभुपाद लीलामृत (खंड 3)', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 135, title: 'Prabhupada Lilamrita (Volume 4)', title_hi: 'श्रील प्रभुपाद लीलामृत (खंड 4)', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 136, title: 'Prabhupada Lilamrita (Volume 5)', title_hi: 'श्रील प्रभुपाद लीलामृत (खंड 5)', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 137, title: 'Prabhupada Lilamrita (Volume 6)', title_hi: 'श्रील प्रभुपाद लीलामृत (खंड 6)', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
    ],
  },
  {
    id: 3, name: 'Level 3 - Category III', name_hi: 'स्तर 3 — श्रेणी 3',
    books: [
      { id: 138, title: 'Bhagavad Gita As It Is', title_hi: 'श्रीमद्भगवद्गीता यथारूप', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 139, title: 'Srimad Bhagavatam Canto 1', title_hi: 'श्रीमद्भागवतम् — प्रथम स्कंध', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 140, title: 'Srimad Bhagavatam Canto 2', title_hi: 'श्रीमद्भागवतम् — द्वितीय स्कंध', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 141, title: 'Srimad Bhagavatam Canto 3', title_hi: 'श्रीमद्भागवतम् — तृतीय स्कंध', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 142, title: 'Srimad Bhagavatam Canto 4', title_hi: 'श्रीमद्भागवतम् — चतुर्थ स्कंध', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 143, title: 'Srimad Bhagavatam Canto 5', title_hi: 'श्रीमद्भागवतम् — पंचम स्कंध', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 144, title: 'Srimad Bhagavatam Canto 6', title_hi: 'श्रीमद्भागवतम् — षष्ठ स्कंध', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 145, title: 'Srimad Bhagavatam Canto 7', title_hi: 'श्रीमद्भागवतम् — सप्तम स्कंध', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 146, title: 'Srimad Bhagavatam Canto 8', title_hi: 'श्रीमद्भागवतम् — अष्टम स्कंध', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 147, title: 'Srimad Bhagavatam Canto 9', title_hi: 'श्रीमद्भागवतम् — नवम स्कंध', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 148, title: 'Srimad Bhagavatam Canto 10', title_hi: 'श्रीमद्भागवतम् — दशम स्कंध', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 149, title: 'Srimad Bhagavatam Canto 11', title_hi: 'श्रीमद्भागवतम् — एकादश स्कंध', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 150, title: 'Srimad Bhagavatam Canto 12', title_hi: 'श्रीमद्भागवतम् — द्वादश स्कंध', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 151, title: 'Chaitanya Charitamrita (Adi Lila)', title_hi: 'श्री चैतन्य चरितामृत — आदि लीला', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 152, title: 'Chaitanya Charitamrita (Madhya Lila)', title_hi: 'श्री चैतन्य चरितामृत — मध्य लीला', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 153, title: 'Chaitanya Charitamrita (Antya Lila)', title_hi: 'श्री चैतन्य चरितामृत — अन्त्य लीला', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
      { id: 154, title: 'Chaitanya Charitamrita (Complete)', title_hi: 'श्री चैतन्य चरितामृत — सम्पूर्ण', author: DEFAULT_AUTHOR, link: '', addedDaysAgo: 90 },
    ],
  },
];

// Starting status of the sample person (book id -> status)
export const MOCK_STATUS = { 101: 'completed', 102: 'ongoing', 123: 'skipped' };

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
