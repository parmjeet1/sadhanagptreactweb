# Reading Lecture Feature

All new work for the **reading-lecture feature** goes in this folder.

- Developer: Manvatar Prabhu Ji
- Created: 2026-10-09
- This repo: `sadhanagptreactweb` (branch `backup/all-work`)
- Matching folder in the other repo: `sadhanagptpunjabibagh` -> `SadhanaGPT/reading-lecture-feature`

Rules for this folder:
- New files for this feature are added here (not scattered in other folders). If the feature must change an existing shared file (for example routes), keep that change small and note it in `CHANGELOG.md`.
- If an API changes on the backend, the website folder needs the matching change, and the other way round (see CLAUDE.md, rule 8).
- Do not put keys, passwords or real student data in this folder.

Status: built and connected to the backend (needs the backend deployed and the database scripts run first).

- Preview screens with sample data (nothing saved): `/student/reading-preview`, `/counsellor/reading-preview`. The sample list is the real 54 books.
- Live screens with real data: `/student/reading`, `/counsellor/reading` (typed in the address bar; not linked from any menu yet).
- `api.js` talks to the 18 backend endpoints; `mappers.js` converts server data to what the screens use; `useReadingLectureStore.js` / `useCounsellorTools.js` are the real data sources, `useMockStore.js` / `useMockCounsellorTools.js` are the sample ones. The screens themselves are shared (`*PageView.jsx`).
