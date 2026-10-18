# VYRA PULSE — VS Code AI Continuation Prompt


## Context

You are continuing development on an existing project called **Vyra Pulse** — a full-stack Next.js 14 + Supabase e-commerce and Business Intelligence platform for a premium energy drink brand.
**This project already exists. Do not rebuild it, scaffold a new app, or start from scratch.**

## Your First Steps (every session)

1. **Read `PROJECT_HANDOVER.md`** in the project root. It contains the complete architecture, route map, feature status, database schema, and known issues.
2. **Read `README.md`** for additional context.
3. **Inspect the actual source files** relevant to the task before writing any code. Never rely solely on the handover document — it may be slightly behind the code.
4. **Run diagnostics** before making changes:
   ```powershell
   npm run typecheck
   npm run lint
   ```
   Fix any pre-existing errors before adding new features.

## Project Rules

### Do
- Work on **one prioritized task at a time** from the unfinished work list in `PROJECT_HANDOVER.md` Section M.
- Make **incremental, targeted changes** — edit only the files directly relevant to the task.
- **Reuse existing components**: `Button`, `Card`, `Badge`, `ThemeToggle`, `AuthProvider`, `ThemeProvider`, `CartProvider`.
- **Preserve all existing functionality**: 9 BI categories, 6 CSV datasets, database migrations, Supabase RLS policies, authentication flows, and route protection.
- **Run tests after each meaningful change**: `npm run typecheck`, `npm run lint`.
- **Update `PROJECT_HANDOVER.md`** after each completed milestone — mark features as verified with evidence.
- Use the **existing design language**: dark/charcoal background, neon-lime `#00FF66` accents, Inter font, Tailwind CSS (no TailwindCSS v4, no inline styles replacing Tailwind classes).
- Use **TypeScript strictly** — no `any` types unless absolutely unavoidable.

### Do Not
- Do not rebuild, reorganize, or rename working files without a clear reason.
- Do not delete or modify the 6 CSV files in `data/`.
- Do not modify database migrations or RLS policies without explicit user instruction.
- Do not weaken authentication, role checks, or Row Level Security.
- Do not invent test results — only report what you have actually run and observed.
- Do not claim a feature is working unless you have confirmed it at runtime.
- Do not add new npm packages without checking if equivalent functionality already exists in the project.
- Do not expose or log secrets, API keys, or passwords.
- Do not force-push to Git or modify `.gitignore` to expose secret files.

## Technology Constraints

| Constraint | Value |
|---|---|
| Framework | Next.js 14, App Router, SSR |
| Language | TypeScript strict mode |
| Styling | Tailwind CSS 3.4 only (no Tailwind v4, no inline styles) |
| Charts | Recharts 2.13 (already installed) |
| Auth/DB | Supabase only — do not add other auth providers |
| Package manager | npm (`npm ci` for installs) |
| Node.js | 18+ |

## Current Priority Queue (from PROJECT_HANDOVER.md)

Work through these in order. Ask the user before jumping to a lower-priority task.

1. **Initialize Git** — `git init`, `git add .`, `git commit -m "initial commit"`
2. **Configure Supabase** — `.env.local` setup, run migrations, run seed
3. **TypeScript + lint pass** — fix all reported errors
4. **Suppress Navbar on login/landing pages** — hide Store/Flavors/Rewards links on `/`, `/admin/login`, `/customer/login`
5. **Verify `/customer/register` exists** — linked from customer login page
6. **Verify all 9 BI categories** with real Supabase data
7. **Production build** — `npm run build` must pass cleanly
8. **Remove Three.js** if 3D viewer is permanently abandoned

## Important Architecture Notes

- **Root layout** (`src/app/layout.tsx`) wraps every page with: `ThemeProvider > AuthProvider > CartProvider > Navbar > main > Footer`
- The **Navbar renders on ALL routes** including login pages — this is a known issue to fix (Priority 4 above)
- **Theme toggle** is intentionally only on the landing page (`/`) and has been removed from admin and customer login pages
- **Local dev mode** (no Supabase) uses `localStorage` key `vyra-dev-auth` — admin login accepts `admin@gmail.com`, customer login accepts `demo.customer@example.com`
- **Middleware** at `src/lib/supabase/middleware.ts` enforces server-side role checks — do not bypass this
- **3D viewer** has been removed from UI but `three` package remains in `package.json` — safe to ignore or uninstall

## Completing a Task

After completing any task:
1. Run `npm run typecheck` — confirm zero errors
2. Run `npm run lint` — confirm zero errors or document suppressions
3. Test the feature manually in the browser
4. Update `PROJECT_HANDOVER.md` — change feature status from "not verified" to "verified" with evidence
5. Commit: `git add . && git commit -m "feat/fix: description of change"`

## Asking for Clarification

If the task is ambiguous, ask the user one focused question before writing code. Do not make major architectural assumptions without confirmation.

---

*This prompt was generated during the Antigravity → VS Code handover on 2026-10-18.*
*Read PROJECT_HANDOVER.md for the full project state.*
