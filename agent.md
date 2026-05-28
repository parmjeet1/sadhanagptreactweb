# Agent Instructions: React Web Project (sadhanaGPT Frontend)

> [!IMPORTANT]
> **Universal Protocol for All AI Assistants**
> - **Read this entire document before making any change.**
> - Follow the **Plan → Implement → Review** workflow defined in the backend `agent.md`.
> - Respect spelling quirks and naming conventions used throughout the codebase (e.g., `counsller`, `lable`, `acitivity`).

---

## 📦 Project Overview
- **Framework**: React 19 with Vite tooling.
- **Styling**: TailwindCSS + custom CSS for premium UI (glassmorphism, gradients, micro‑animations).
- **Routing**: `react-router-dom` with public routes (`/`, `/email-login`, `/oauth-success`, `/onboarding`) and protected routes guarded by `AuthGuard`.
- **State**: Primarily stored in `localStorage` (`user_details`, `referred_counsellor_id`).
- **Backend Integration**: API service layer (`src/services/api.js`) wraps Axios with auth headers.
- **AI Service**: `src/services/aiService.js` calls external AI text generation.

---

## 🗂️ Directory Structure
```
reactweb/
├─ public/                 # static assets
├─ src/
│  ├─ components/
│  │   ├─ shared/          # reusable UI (AuthGuard, Footer, Logo, GoogleButton)
│  │   └─ ...
│  ├─ pages/
│  │   ├─ student/        # student dashboards & features
│  │   ├─ counsellor/     # counsellor dashboards & features
│  │   └─ ...
│  ├─ routes/             # AppRoutes.jsx (central routing)
│  ├─ services/           # api.js, aiService.js
│  ├─ utils/              # apiUtils.js, etc.
│  └─ main.jsx
├─ vite.config.js
└─ tailwind.config.js
```

---

## 🛡️ Coding Conventions
1. **Component Naming**: PascalCase files (`MyComponent.jsx`). Export default component matching filename.
2. **Styling**: Use Tailwind utility classes; place custom CSS in `src/App.css` only when Tailwind cannot express the style.
3. **UI/UX**: All interactive elements must have hover/focus states, micro‑animations via `framer-motion`, and accessible ARIA labels.
4. **Error Handling**: Use `processResponse` from `utils/apiUtils.js` to normalize API messages; always display toast notifications.
5. **Authentication**: Guarded routes must wrap children with `<AuthGuard>` which reads `user_details` from `localStorage` and redirects to `/` if missing.
6. **Referral Links**: Decode via `atob` and verify with `/verify-counsellor` endpoint before storing `referred_counsellor_id`.
7. **Spelling Quirks**: Follow existing misspellings to stay compatible with backend APIs:
   - `counsller` (double‑l, no `o`) for many DB fields.
   - `lable` for label routes.
   - `acitivity` for activity routes.
8. **State Mutations**: Never directly mutate objects from props; use React state setters.
9. **File Imports**: Prefer absolute imports using `@/` alias (configured in `vite.config.js`).

---

## 📋 Development Workflow (Plan‑Implement‑Review)
1. **Plan**
   - Create an `implementation_plan.md` outlining affected files and exact field names.
   - List any ambiguities and set `request_feedback: true`.
2. **Implement**
   - Update `task.md` checklist, marking items `[/]` when in progress and `[x]` when done.
   - Make incremental commits; preserve existing comments and JSDoc.
3. **Review**
   - Run the app (`npm run dev`) and verify routes, UI, and API interactions.
   - Document outcomes in `walkthrough.md` with screenshots or console logs.
   - If new spelling quirks are discovered, amend this `agent.md` accordingly.

---

## 🚀 Quick‑Start for New Contributors
```bash
# clone repository
git clone <repo-url>
cd reactweb

# install dependencies
npm install

# start development server
npm run dev
```
Open `http://localhost:5173` in the browser.

---

## 📚 Helpful Resources
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Framer Motion**: https://www.framer.com/motion/
- **Vite Guide**: https://vitejs.dev/guide/
- **React Router v7**: https://reactrouter.com/en/main

---

## 🔧 Maintenance Tips
- Run `npm run lint` before committing.
- Keep `src/services/api.js` as the single source of truth for base URL and auth headers.
- When adding new API endpoints, create a wrapper in `api.js` and a corresponding response processor in `apiUtils.js`.
- Update this `agent.md` whenever new route patterns, naming conventions, or UI components are introduced.

---

*End of `agent.md`*
