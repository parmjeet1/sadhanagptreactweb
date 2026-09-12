# Project Standards & Preservation Rules

These rules are strictly enforced for all future modifications to the SadhanaGPT project (React Frontend + Node.js Backend).

## 1. UI Integrity & Preservation
- **NEVER** delete, hide, or remove existing UI modules, modals, or user-facing functionality unless the USER explicitly requests it (e.g., the Mentee Labels module).
- If a component must be temporarily removed or replaced during a refactor, it **MUST** be fully restored and connected to its corresponding backend API before the task is considered complete.
- Always check for existing components or API routes before creating new ones to prevent orphaned code.

## 2. Design Aesthetics
- The application uses a highly premium, modern aesthetic. 
- All new UI components must include vibrant accents, smooth micro-animations (e.g., `active:scale-95`, `transition-all`), and clean spacing.
- Never use generic placeholder designs. Interfaces must feel responsive and alive, matching the established design system (e.g., as seen in the Inspiration Board and Analytics dashboard).

## 3. Backend & Database Integrity
- **Scoring Precedence**: Always respect the hierarchical precedence for marking schemes: Subgroup (Label) rules > Center rules > System Default (ID 1).
- **Safe UPSERTs**: When saving bulk data (like marking rules), use safe UPSERT logic (Check if exists -> UPDATE else INSERT) to prevent data loss or duplicate primary keys.
- **Legacy Columns**: Be mindful of legacy columns. For example, ensure scoring logic uses `scheme_id` correctly rather than falling back to `center_id` directly for rule evaluation.

## 4. API Standards
- All new API endpoints must conform to the established JSON response structure:
  ```json
  {
    "status": 1,
    "code": 200,
    "message": "Success message",
    "data": []
  }
  ```
- Ensure robust error handling and avoid crashing the Node server on invalid inputs.

## 5. React State & Race Conditions
- Always account for React state staleness, especially in modals (like `SchemeNameModal`).
- Perform necessary pre-checks or use `useCallback`/`useEffect` dependencies correctly to ensure data submitted to the backend is fresh and accurate.
