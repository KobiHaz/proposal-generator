# CLAUDE.md — proposal-generator

> 📋 **Active plan (2026-07-23):** [docs/plans/2026-07-23-graph-audit-followup.md](docs/plans/2026-07-23-graph-audit-followup.md) — graph-audit follow-up; review before structural changes.

## Purpose
A React web app for creating, editing, and exporting business proposals and affiliate agreements
(XSHEVA). Authenticated users build CRM/automation proposals and quotes, save them to Firestore,
and export to PDF. RTL (Hebrew) documents.

## Stack
- React 19 + TypeScript + Vite 7, Tailwind CSS v4, Radix UI, Lucide, CVA, clsx, tailwind-merge
- Firebase Auth + Firestore (client SDK; `firebase-admin` for scripts)
- PDF export via `html2pdf.js` + `html2canvas-pro`; also a Python builder (`scripts/build-proposal.py`)
- Hosted on Firebase (see `firebase.json`, `firestore.rules`, `firestore.indexes.json`)

## Structure
- `src/App.tsx` — root; routes to Login / Proposal / Quote / MyProposals pages
- `src/contexts/` — `AuthContext` (Firebase Auth/session), `EditContext` (edit mode/draft state)
- `src/projects/` — page + document + form components: `Proposal*`, `Quote*`, `MyProposalsPage`,
  `LoginPage`, `TabNav`, plus `presets.ts` and `types.ts`
- `src/lib/firestore.ts` — save/list/get/delete for `proposals` and `agreements` collections
- `src/lib/firebase.ts` — Firebase init; `src/components/ui/` — shadcn-style primitives
- `scripts/` — `create-user.js`, `deploy-rules.sh`, `build-proposal.py` (Python PDF, fonts in `scripts/fonts/`)
- `.claude/knowledge/` — architecture, pdf-generation, standards notes

## Run / dev
- `npm install && npm run dev` — Vite dev server at http://localhost:8085
- `npm run build` — `tsc && vite build`; `npm run preview` — preview build
- `npm run lint` — ESLint (ts/tsx, max-warnings 0)
- `npm run create-user` — create a Firebase user (`scripts/create-user.js`)
- `npm run deploy:rules` — deploy Firestore rules

## Conventions / notes
- Env via `.env` (see `.env.example`); Firebase config required for Auth/Firestore.
- Firestore list queries need the composite index `userId ASC` + `updatedAt DESC`.
- RTL: `dir="rtl"` on main containers; print styling via `@media print` in `index.css`.
- Context values wrapped in `useMemo` for referential stability; delete pattern filters local
  state rather than refetching.
- Source-of-truth docs live in the Maestro vault (`02-projects/proposal-generator`), per `.cursorrules`.
