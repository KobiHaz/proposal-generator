# Files

## File: CLAUDE.md
````markdown
# CLAUDE.md — proposal-generator

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
````

## File: .claude/knowledge/architecture.md
````markdown
# Proposal Generator — Architecture

## Stack

React 19, TypeScript, Vite, Tailwind v4, Radix UI, Lucide, CVA, clsx, tailwind-merge
Firebase Auth + Firestore, html2pdf.js

## Component Flow

```
App.tsx
├── AuthContext       → Firebase Auth, user session
├── EditContext       → editing mode, draft state
├── LoginPage         → public
└── Protected:
    ├── ProposalPage      → create/edit CRM or automation proposals
    ├── QuotePage         → create/edit affiliate agreements
    └── MyProposalsPage   → list all saved proposals + agreements
```

## Firestore Operations (lib/firestore.ts)

```ts
saveProposal(userId, variant, data)   → proposals collection
saveAgreement(userId, variant, data)  → agreements collection
listDocuments(userId)                 → both collections, orderBy updatedAt desc
deleteDocument(collection, id)        → delete + filter local state
getDocument(collection, id)           → single fetch
```

## Key Implementation Details

- **Composite index:** `userId ASC` + `updatedAt DESC` — required for list queries
- **Delete pattern:** filter local state after delete (don't refetch)
- **Number inputs:** `parseNumberInput(value)` → empty string becomes 0
- **RTL:** `dir="rtl"` on all main containers
- **Print:** `@media print` in `index.css`; never inline `dangerouslySetInnerHTML`
- **Context values:** always wrapped in `useMemo` for referential stability
````

## File: .claude/knowledge/pdf-generation.md
````markdown
# PDF Generation — xsheva Brand System

> Rebuilt 2026-07-05. The Rav-Bariach proposal is generated from
> `scripts/build-proposal.py` → self-contained HTML → **headless Chrome print** → PDF.
> Canonical design source: claude.ai design system `019ded08-805f-7784-a7bf-2a665a617bb5`.

> ⚠️ **Supersedes the earlier blue / DejaVu / LibreOffice version of this doc, which was
> off-brand.** xsheva's accent is **orange**, not blue; the font is **Space Grotesk**, not
> DejaVu; the render engine is **Chrome**, not LibreOffice.

---

## xsheva design tokens (source of truth)

```python
ORANGE = "#FF6B35"   # THE ONLY accent color (blue #3B6EF8 was legacy — do not use)
NAVY   = "#101622"   # dark surface / cover (hero)
INK    = "#1A2230"   # light-mode body text ; headings #101622
MUTE   = "#66707F"   # muted labels ; on dark: #9AA6B8
LINE   = "#E4E7EC"   # light hairline ; on dark: #282e39 ; row divider #EEF0F3
ROW    = "#FAFBFC"   # subtle even-row fill
```

- **Typeface:** Space Grotesk (Latin only) + **Heebo** (Hebrew) — Space Grotesk has **no
  Hebrew glyphs**, so Heebo carries all Hebrew. Both are **embedded as base64** from
  `scripts/fonts/*.ttf` (variable TTFs) — the PDF renders identically on any machine, no
  network needed. `font-family: 'Space Grotesk','Heebo'` → Chrome picks per glyph.
- **Radii:** 2 (buttons) · 4 (chips) · 8–12 (cards/tables). **Spacing:** 8/16/32/64/96/128.
- **Logo:** staircase glyph `M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z` (48×48), fill
  orange, on the dark cover. **Wordmark: XSHEVA — always all-caps.**
- **Surface strategy:** **dark cover** (hero) + **light body pages** (print collateral is
  light mode per the design system).

### Brand content rules (enforced)
- **No emoji.** (The old 🔴🟠🟡 severity and 🚀 Go-Live were removed.)
- **No exclamation marks.** XSHEVA all-caps. Architecture vocabulary; eyebrows uppercase + orange.

---

## Architecture: HTML → PDF via headless Chrome

```
python3 scripts/build-proposal.py
  → /tmp/proposal_build.html                       (self-contained, fonts inlined)
  → Google Chrome --headless --print-to-pdf        (vector text, real fonts, @page A4)
  → public/samples/proposal-rav-bariach-xsheva.pdf
```

Chrome binary: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
Flags: `--headless=new --no-pdf-header-footer --virtual-time-budget=15000
--run-all-compositor-stages-before-draw --print-to-pdf=<out> file://<html>`.

**Why Chrome (not LibreOffice / html2pdf.js)?** Vector text (not rasterized), real Space
Grotesk + Heebo, faithful CSS `@page` pagination, and full modern-CSS support (flex, grid,
`break-inside`, nth-child) — none of the LibreOffice quirks apply anymore.

---

## Pagination (Chrome print)

- `@page { size:A4; margin:15mm 15mm 16mm }` · `@page:first { margin:0 }` for a full-bleed cover.
- Cover is `min-height:297mm` so it fills page 1; content flows naturally after (no forced
  per-section breaks — that left half-empty pages).
- Keep tables intact: `tr, table { break-inside: avoid }`. Keep a heading with its body:
  `.sec-head { break-after: avoid; break-inside: avoid }` and `.sub { break-after: avoid }`.
- Print background colors: `-webkit-print-color-adjust: exact; print-color-adjust: exact` on `*`.

---

## Helpers in build-proposal.py

`section(num,(title,eyebrow),body)` · `sub()` · `lead()` · `para()` · `bullets()` ·
`table(headers,rows,total=,accent_cols=)` (navy header + orange underline, alt rows, orange
total row) · `chip(level)` severity chips (`high`=solid orange, `mid`=orange-tint, `low`=outline,
**no emoji**) · `stats([(value,label)…])` stat tiles · `note()`.

---

## Rav-Bariach proposal structure (8 pages, 10 sections — MVP/pilot scope)

Cover · 1 מבוא (two independent tracks, **MVP/pilot-first**, priced separately) ·
2 תשתית/ארכיטקטורה/אבטחה (**self-hosted VPS**; Claude API external; **hybrid** security;
**2.4 Prompt-injection defense** — external content is data-not-instructions, guardrails,
output validation, HITL-as-security-gate; **2.5 HITL continuous learning** — 100% review →
labeled data → rising autonomy per process, fine-tuning post-pilot; **2.6 caching** of
validated lookups e.g. project+warranty) · 3 תהליך 1 — רשימות קבלנים (spec) · 4 תהליך 2 — הזמנות (spec) ·
5 ROADMAP (**lean, 4 phases, ~9 weeks**) · 6 תמחור (**split**) · 7 ROI · 8 רישום סיכונים
(14 rows) · 9 SLA · 10 דרישות תחילת עבודה.

**Pricing — split, MVP scope, 550 ₪/hr:** שלב 0 תשתית 20h/11,000 ₪ · תהליך 1 38h/20,900 ₪ ·
תהליך 2 48h/26,400 ₪ = **106h / 58,300 ₪ + VAT** (each process priced separately — client can
start with one). Formal **±20% hours overflow** clause for edge cases. Payment: 4× 14,575 ₪.

**Support/commercial terms:** bug warranty = **2 weeks from Go-Live, final-spec defects only**;
Ad-hoc hourly = **600 ₪/hr**; prepaid **20-hour bank @ 480 ₪/hr** (20% off ad-hoc); monthly
retainer 3,500 ₪. **ROI (recomputed on 58,300):** ~196% yr-1, break-even ~3 months from Go-Live,
297K ₪/yr saving. Rates benchmarked vs Israeli specialized-consulting norms (250–800 ₪/hr).

> History: an earlier version quoted the full-build scope at 220h / 121,000 ₪ (82% ROI). The
> client asked to re-scope to a leaner MVP-first pilot landing at ~58K; edge cases / full
> automation are handled iteratively via the 20% buffer, hourly bank, and post-pilot phases.

---

## Verify after regenerating

```python
import fitz
doc = fitz.open('public/samples/proposal-rav-bariach-xsheva.pdf')
assert doc.page_count == 8
# render pages to PNG and eyeball: orange accent, logo, no emoji, no sliced tables
```

---

## File locations

- Generator: `scripts/build-proposal.py`
- Fonts (embedded): `scripts/fonts/SpaceGrotesk.ttf`, `scripts/fonts/Heebo.ttf`
- Output PDF: `public/samples/proposal-rav-bariach-xsheva.pdf`
- Design spec: `docs/superpowers/specs/2026-07-05-xsheva-rav-bariach-pdf-design.md`
- This doc: `.claude/knowledge/pdf-generation.md`

---

## Deferred (clean follow-up)

In-app React preview tab: the app is a **static** Vite/Firebase frontend and can't run
headless Chrome, so the standalone generator is the right home for a high-fidelity PDF. An
in-app preview would render the document in React and export via the app's `html2pdf.js`
(lower fidelity) — a separate, optional task.
````

## File: .claude/knowledge/standards.md
````markdown
# Proposal Generator — Coding Standards

---

## Tech Stack

React 19, TypeScript, Vite, Tailwind v4, Firebase (Firestore + Auth), RTL Hebrew UI

---

## Architecture

| Layer | Location | Notes |
|-------|----------|-------|
| Pages | `src/projects/` | ProposalPage, QuotePage, MyProposalsPage, LoginPage |
| Contexts | `src/contexts/` | AuthContext, EditContext |
| Types | `src/projects/types.ts` | ProposalData, QuoteData |
| Firestore | `src/lib/firestore.ts` | save / list / delete / get |

---

## RTL / Hebrew Rules

- `dir="rtl"` on all main page containers — non-negotiable
- Tailwind text alignment: use `text-right` for Hebrew content, `text-left` for numbers/IDs
- No auto-detection — direction is always set explicitly per container

---

## Naming

| Type | Pattern | Example |
|------|---------|---------|
| Hooks | `use` + PascalCase | `useProposals`, `useAuth` |
| Context | `*Context` | `AuthContext`, `EditContext` |
| Types | PascalCase noun | `ProposalData`, `QuoteData` |
| Firestore ops | verb + noun | `saveProposal`, `deleteProposal` |

---

## Patterns

- **Number inputs:** `parseNumberInput(value)` for empty/null handling — never `parseInt` directly
- **Context values:** Wrap in `useMemo` for referential stability (prevents unnecessary re-renders)
- **Logging:** No `console.log` — `console.error` for errors only
- **TypeScript:** Strict mode, no `any`, exhaustive switch on union types

---

## Firestore Rules

- Document ID = `userId` for user-scoped data (immutable after first write)
- Never change `userId` after document creation — breaks all references
- Composite index required for queries filtering by `userId` + `createdAt`
- Soft delete pattern: `isDeleted: true` field, filter on read — never hard-delete

---

## What NOT to Do

- ❌ `dir="ltr"` on Hebrew content containers
- ❌ `console.log` — errors only, and only via `console.error`
- ❌ Direct `parseInt` on form inputs without `parseNumberInput` wrapper
- ❌ Change `userId` on existing Firestore documents
- ❌ Hard-delete Firestore documents (use soft delete)
- ❌ Skip `useMemo` on context values — causes re-render storms

---

## Reference

- Architecture: `knowledge/architecture.md`
- Memory: `memory.md`
````

## File: .claude/CLAUDE.md
````markdown
> Consolidated 2026-06-02 - merged from the Cowork cabinet. This `.claude/` is the single source of truth.

# Proposal Generator — Project Workspace

React-based proposal and quote generator. RTL Hebrew interface for affiliate agreements and CRM proposals.

**Stack:** React 19 + TypeScript + Vite + Tailwind v4 + Radix UI + Firebase
**Project path:** `~/.gemini/antigravity/projects/proposal-generator`

---

## How to Run

```sh
cd ~/.gemini/antigravity/projects/proposal-generator
npm install
npm run dev    # http://localhost:8085
```

---

## Folder Map (project)

```
src/
  projects/     → Pages: ProposalPage, QuotePage, MyProposalsPage, LoginPage
  contexts/     → AuthContext (Firebase Auth), EditContext (editing state)
  lib/
    firestore.ts → save / list / delete / get
  types/         → ProposalData, QuoteData (src/projects/types.ts)
```

---

## Data Model

| Entity | Collection | Key Fields |
|--------|------------|------------|
| SavedProposal | `proposals` | `userId`, `variant` (crm\|automation), `data: ProposalData` |
| SavedAgreement | `agreements` | `userId`, `variant`, `data: QuoteData` |

**ProposalData:** recipient, specSections, basePackage, addOns, pricingRows, blockers
**QuoteData:** clientName, paymentModel (fixed\|hourly), pricing, terms

---

## Firestore Security Rules

```javascript
// proposals + agreements
allow create: if request.auth.uid == request.resource.data.userId;
allow read, delete: if request.auth.uid == resource.data.userId;
allow update: if request.auth.uid == resource.data.userId
  && request.resource.data.userId == resource.data.userId; // userId immutable
```

**Composite index required:** `userId ASC` + `updatedAt DESC`

---

## Architecture Flow

```
Pages → AuthContext / EditContext → lib/firestore.ts → Firebase
```

- Queries: `orderBy('updatedAt', 'desc')` — server-side sort
- Delete: filter local state array (no refetch)

---

## Core Rules

1. **RTL everywhere** — `dir="rtl"` on all main containers
2. **No `console.log`** — `console.error` for error paths only
3. **Context memoization** — wrap context values in `useMemo`
4. **Firestore userId immutability** — enforced by security rule on update
5. **Composite index** — required for `userId` + `updatedAt` list queries
6. **`parseNumberInput()`** — all number form fields; normalizes empty → 0
7. **Exhaustive switch** — in `getTabForDoc` and similar discriminated unions
8. **Print styles** — in `index.css` @media print, never `dangerouslySetInnerHTML`
9. **Soft delete** — set `isDeleted: true` on Firestore documents, filter on read; never hard-delete

---

## Reference Docs

- [architecture.md](knowledge/architecture.md) — Firestore operations, component flow

## Memory & Plans

- [memory.md](memory.md) — decisions, active context
````

## File: .claude/memory.md
````markdown
# Memory — Proposal Generator

## Key Decisions

| Date | Decision | Reason |
|------|----------|--------|
| Feb 2026 | userId immutability enforced in Firestore rule | Prevent ownership hijack on update |
| Feb 2026 | Composite index userId + updatedAt | Required for server-side sorted list queries |
| Feb 2026 | Delete filters local state (no refetch) | Faster UX; avoids unnecessary Firestore read |
| Feb 2026 | parseNumberInput for all number fields | Handles empty string → 0 edge case cleanly |
| 2026 | dir="rtl" on containers (not body) | Allows mixing RTL/LTR in future if needed |

## Resolved Issues

- Firestore security rules updated to enforce userId immutability on update
- Composite index confirmed required for userId + updatedAt queries

## Active Context

- Two variants: `crm` and `automation` for proposals
- Hebrew UI — all main containers `dir="rtl"`
````

## File: docs/superpowers/specs/2026-07-05-xsheva-rav-bariach-pdf-design.md
````markdown
# xsheva Rav-Bariach Proposal PDF — Design Spec

> Date: 2026-07-05 · Owner: Kobi Hazout (XSHEVA) · Status: approved

## Goal

Produce a high-fidelity, **on-brand xsheva** PDF proposal for **רב-בריח** (Rav-Bariach process-automation project), replacing the off-brand Cowork draft. The deliverable is the PDF file itself.

## Why this exists

A prior Cowork session generated a Rav-Bariach proposal but used a **wrong/legacy design**: blue `#3B6EF8` accent, DejaVu Sans, lowercase "xsheva", emoji, LibreOffice render. The canonical xsheva design system (claude.ai design `019ded08…`) is materially different. This rebuild corrects the brand and upgrades the render pipeline.

## Canonical xsheva design tokens (source of truth)

| Token | Value |
|---|---|
| Accent (only chromatic color) | Orange `#FF6B35` |
| Dark surface / navy | `#101622` |
| Dark hairline border | `#282e39` |
| Dark secondary text | `#9AA6B8`, muted `#66707F` |
| Light surface | `#FFFFFF` |
| Light body text | `#1A2230`; headings `#101622` |
| Light hairline / divider | `#E4E7EC` / `#EEF0F3`; subtle row `#FAFBFC` |
| Typeface (only) | **Space Grotesk** (300–700), via Google Fonts |
| Radii | 2 (buttons/inputs) · 4 (chips) · 8–12 (cards/tables) |
| Spacing scale | 8 / 16 / 32 / 64 / 96 / 128 |
| Logo glyph | staircase `M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z` (48×48), fill orange |
| Wordmark | **XSHEVA** — always all-caps |

**Brand rules enforced in content:** no emoji (any), no exclamation marks, XSHEVA all-caps, architecture vocabulary. Eyebrows = uppercase, wide tracking, orange.

**Surface strategy:** dark cover (hero treatment: staircase glyph + wordmark + orange eyebrow + decorative orange glow); **light body pages** (print collateral is light mode per the design system).

## Architecture / pipeline

```
scripts/build-proposal.py  →  self-contained HTML (inline CSS, Google Fonts, @page A4)
                           →  Google Chrome --headless --print-to-pdf
                           →  public/samples/proposal-rav-bariach-xsheva.pdf
```

- **Generator:** `scripts/build-proposal.py` — rewritten. Python emits one HTML string. Keeps `tbl()`, `kpi()`, `h1/h2/h3`, `PH` helpers, restyled to xsheva tokens. Cover uses the dark hero; content sections use light mode.
- **Render:** Google Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, flags `--headless --print-to-pdf=<out> --no-pdf-header-footer`. Vector text, real Space Grotesk, CSS `@page` pagination. Verified via Playwright MCP page-count/visual check.
- **Pagination:** explicit `page-break-before/after` on section boundaries; tables kept intact (`break-inside: avoid` on rows / the risk table).

## Content (9 sections, from extracted Cowork PDF)

Cover · 1 מבוא ורציונל · 2 אפיון תהליכים · 3 ארכיטקטורה טכנית (stack table + human-in-the-loop + 3 security tracks) · 4 ROADMAP (6 phases, ~18 weeks) · 5 תמחור (setup @550₪/hr = 121,000₪+VAT, monthly retainer 3,500₪, 4 payment milestones) · 6 ROI (82% yr-1, break-even month 9, 327K–357K₪/yr — as stat tiles + tables) · 7 רישום סיכונים (14 rows, orange-intensity severity) · 8 SLA · 9 דרישות תחילת עבודה.

Severity coding (no emoji): **high** = solid orange chip; **medium** = orange-tint chip (`#FFE7D9`/`#B4400F`); **low** = outline chip (`#D4D9E0`/`#66707F`).

## Out of scope (YAGNI)

- No app rebrand (rest of app stays SoMedia).
- No `ProposalData` model changes; no in-app React tab (static frontend can't run headless Chrome — deferred, clean follow-up).
- No changes to existing SoMedia proposals/agreements or the Python LibreOffice path (replaced).

## Deliverables

1. `scripts/build-proposal.py` (rewritten, real xsheva, full content).
2. `public/samples/proposal-rav-bariach-xsheva.pdf` (generated, verified).
3. `.claude/knowledge/pdf-generation.md` (rewritten to real design + Chrome-print pipeline).
4. Committed to the worktree branch.

## Success criteria

- PDF renders 8–9 A4 pages, Space Grotesk embedded, orange `#FF6B35` accent, staircase logo on cover, no emoji, no sliced tables.
- Content matches the extracted proposal (pricing 121,000₪+VAT, 14 risks, ROI 82%).
- Regenerable via `python3 scripts/build-proposal.py`.
````

## File: public/logo.svg
````xml
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="Layer_1" x="0px" y="0px" viewBox="0 0 132 97.4" style="enable-background:new 0 0 132 97.4;" xml:space="preserve"><g>	<path d="M72,34.7c-1-2.2-2.5-4.1-4.4-5.6c-1.9-1.5-4.3-2.8-7.2-3.6c0,0-0.1,0-0.1,0c-0.9-0.2-1.8-0.5-2.8-0.6  c-2.1-0.4-4.5-0.6-7-0.6c-2,0-4,0.1-6.1,0.3c-2.1,0.2-4.2,0.4-6.2,0.7s-3.9,0.5-5.8,0.7s-3.4,0.3-4.8,0.3c-3.5,0-6.1-0.6-7.8-1.8  c-1.7-1.2-2.5-2.8-2.5-4.6c0-1,0.3-2,0.8-2.9s1.5-1.9,2.8-2.7c1.4-0.8,3.2-1.4,5.4-2s5.2-0.8,8.7-0.8c2.5,0,4.9,0.1,7.3,0.4  c2.4,0.3,4.7,0.7,7,1.1c2.2,0.5,4.4,1.1,6.4,1.7c1.6,0.5,3.2,1.1,4.6,1.7c1.8-3.6,4.3-6.9,7.3-9.6c0.1,0,0.1-0.1,0.1-0.1l0.1-0.1  c-2.2-1-5.2-2-7.8-2.8c-2.5-0.8-5.1-1.5-7.8-2c-2.7-0.6-5.5-1-8.4-1.3S38.3,0,35.4,0C31.5,0,28,0.3,25,0.9  c-3.1,0.5-5.8,1.3-8.1,2.3c-2.3,1-4.3,2.1-6,3.5c-1.6,1.3-3,2.8-4,4.3s-1.8,3.2-2.3,4.9c-0.5,1.7-0.7,3.4-0.7,5.1  c0,2.9,0.6,5.5,1.8,7.7s2.8,4,4.8,5.5s4.3,2.5,6.9,3.3s5.3,1.1,8.2,1.1c1.7,0,3.5-0.1,5.5-0.3s3.9-0.5,5.9-0.8s4-0.5,5.9-0.8  s3.8-0.3,5.5-0.3c4,0,7,0.7,8.9,2c0,0,0,0,0,0c1.9,1.3,2.8,3.1,2.8,5.4c0,1-0.2,1.9-0.5,2.7c-0.2,0.4-0.4,0.8-0.6,1.3  c-0.8,1.2-2,2.3-3.7,3.1s-3.9,1.6-6.5,2.1c-2.7,0.5-5.9,0.8-9.7,0.8c-3.2,0-6.1-0.2-8.9-0.6c-2.8-0.4-5.5-0.9-8-1.6s-5-1.6-7.4-2.6  s-4.7-2.2-7-3.5L0.8,55.7c2.4,1.4,5,2.6,7.8,3.8s5.8,2.1,8.9,3c3.1,0.8,6.4,1.5,9.8,1.9c3.4,0.4,6.9,0.7,10.5,0.7  c5.4,0,10.3-0.5,14.7-1.5s8.2-2.5,11.3-4.5c1-0.7,2-1.3,2.9-2.1c0.7-0.6,1.4-1.3,2-2c0.9-1,1.7-2,2.3-3.1c1.7-2.8,2.5-6.1,2.5-9.7  C73.5,39.4,73,36.9,72,34.7L72,34.7z"></path>	<path d="M129.4,19.2c-1.8-4-4.2-7.4-7.4-10.2s-7-5.1-11.4-6.6C106.1,0.8,101.2,0,95.8,0c-5.4,0-10.3,0.8-14.8,2.3  C76.6,3.9,72.8,6.1,69.6,9l0,0c-0.3,0.3-0.6,0.6-0.9,0.9c0,0-0.1,0.1-0.1,0.1c-0.3,0.3-0.6,0.6-0.9,0.9c0,0,0,0-0.1,0.1  c-1.9,2-3.4,4.3-4.7,6.8l0,0.1c-0.2,0.5-0.5,0.9-0.7,1.4c-0.5,1.1-0.9,2.3-1.3,3.5c0,0,0,0,0.1,0l0,0c0,0,0.1,0,0.2,0  c3.2,0.9,6,2.3,8.2,4.1c1.2,1,2.2,2,3.2,3.2c0.2-2.4,0.8-4.6,1.7-6.5c1.2-2.6,2.8-4.8,4.9-6.6c2.1-1.8,4.6-3.2,7.4-4.1  c2.8-0.9,5.9-1.4,9.3-1.4s6.4,0.5,9.3,1.4c2.8,0.9,5.3,2.3,7.4,4.1c2.1,1.8,3.7,4,4.9,6.6s1.8,5.5,1.8,8.8s-0.6,6.2-1.8,8.8  s-2.8,4.8-4.9,6.7c-2.1,1.8-4.5,3.3-7.4,4.3s-5.9,1.5-9.3,1.5c-3.3,0-6.4-0.5-9.3-1.5c-2.8-1-5.3-2.4-7.4-4.3c-1.1-1-2-2-2.9-3.2  c-0.3,3.1-1.3,6-2.8,8.6c-0.8,1.3-1.6,2.5-2.6,3.6l0,0c2.9,2.4,6.3,4.3,10.2,5.7c4.4,1.6,9.4,2.4,14.8,2.4c5.4,0,10.3-0.8,14.7-2.4  c4.5-1.6,8.3-3.8,11.4-6.7c3.2-2.9,5.6-6.3,7.4-10.3c1.8-4,2.6-8.4,2.6-13.2C132,27.5,131.1,23.2,129.4,19.2L129.4,19.2z"></path></g><g>	<path d="M38.3,85.3v11.3h-2.9V85.3c0-2-0.7-4.1-5.8-4.1c-3.1,0-9,2.4-9,5.9v9.5h-2.9V85.3c0-2-0.7-4.1-5.8-4.1c-3.1,0-9,2.4-9,5.9  v9.5H0V79h2.9v2.7c2.5-2.1,6.2-3.4,9-3.4c4.9,0,7.2,1.8,8.1,3.9c2.5-2.4,6.5-3.9,9.6-3.9C36.8,78.4,38.3,82.2,38.3,85.3L38.3,85.3z  "></path>	<path d="M64.7,90.4l2.5,1.4c-0.1,0.2-3.2,5.5-12,5.5c-8.6,0-12.6-4.8-12.6-9.3c0-2.9,1.3-9.8,13.2-9.8c11.1,0,11.5,8.8,11.5,8.9  c0,0.4,0,1.5,0,1.5H45.6c0.3,3,3.4,5.9,9.6,5.9C62.3,94.5,64.7,90.4,64.7,90.4L64.7,90.4z M45.9,85.7h18.3  c-0.6-1.8-2.6-4.6-8.3-4.6C51.9,81.1,47.2,82,45.9,85.7z"></path>	<path d="M94.6,72.3v24.3h-2.9v-2.4c-1.8,1.5-4.8,2.8-9.5,2.8c-3.6,0-6.3-1-8.2-2.8c-2.7-2.7-2.6-6.3-2.6-7.4v-0.2  c0-1.8,1.9-8.4,11.3-8.4c4.1,0,7,1.6,8.9,3.4v-9.4L94.6,72.3L94.6,72.3z M91.7,88L91.7,88c0-0.9-0.2-1.9-0.7-2.7  c-1.1-1.8-3.4-4.2-8.2-4.2c-3.4,0-5.4,1-6.6,2.2c-1.4,1.4-2,3.4-1.7,5.3c0.2,1.1,0.6,2.5,1.7,3.5c1.3,1.3,3.4,2,6.1,2  c3.9,0,6.3-1,7.7-2.2C91,91.1,91.7,89.6,91.7,88L91.7,88z"></path>	<path d="M99.8,75.7v-3.4h2.9v3.4H99.8z M99.8,96.6V79h2.9v17.6H99.8z"></path>	<path d="M128.9,97.3c-0.1-0.1-0.9-1.4-1.4-3.2c-4.1,3-11.6,3-11.7,3c-4.1,0-8.4-1.3-8.4-5.2c0-4.7,4.5-5.1,11.9-5.9  c5.1-0.5,7.3-1.6,8-2.1c0-0.4-0.2-0.9-0.6-1.4c-0.8-0.8-2.6-1.7-7.2-1.7c-8.2,0-9.2,3.4-9.2,3.4l-2.8-0.6c0.1-0.6,1.4-5.7,12-5.7  c4.6,0,7.6,0.8,9.3,2.6c1.5,1.5,1.4,3.2,1.4,3.9v7.7c0,1.8,1.1,3.4,1.1,3.4L128.9,97.3L128.9,97.3z M127.3,89.3v-2  c-1.6,0.7-4,1.3-7.7,1.7c-8.2,0.8-9.3,1.4-9.3,3s3.3,2.3,5.5,2.3C118.1,94.3,127.3,93.4,127.3,89.3L127.3,89.3z"></path></g></svg>
````

## File: scripts/build-proposal.py
````python
"""
Build the Rav-Bariach process-automation proposal as a self-contained HTML
document, then render it to PDF via headless Google Chrome.

xsheva design system (canonical — claude.ai design 019ded08…):
  - Accent  : Orange #FF6B35  (the ONLY chromatic color; blue is legacy)
  - Surface : Navy   #101622  (dark cover / hero)
  - Body    : light mode (white) — print collateral is light per the system
  - Type    : Space Grotesk (only typeface), via Google Fonts
  - Logo    : staircase glyph, orange · wordmark XSHEVA (always all-caps)
  - Rules   : no emoji, no exclamation marks, architecture vocabulary

Pipeline:
    python3 build-proposal.py
        → /tmp/proposal_build.html      (self-contained)
        → Chrome --headless --print-to-pdf
        → ../public/samples/proposal-rav-bariach-xsheva.pdf

Chrome is used (not LibreOffice) for vector text, real Space Grotesk, and
proper CSS @page pagination.
"""

import base64
import os
import subprocess

# ─── xsheva tokens ────────────────────────────────────────────────────────────
ORANGE   = "#FF6B35"   # single accent
ORANGE_D = "#B4400F"   # orange text-on-tint (severity medium)
ORANGE_T = "#FFE7D9"   # orange tint fill
NAVY     = "#101622"   # dark surface / cover
INK      = "#1A2230"   # light-mode body text
HEAD     = "#101622"   # light-mode headings
MUTE     = "#66707F"   # muted label
MUTE_D   = "#9AA6B8"   # muted on dark
LINE_D   = "#282e39"   # hairline on dark
LINE     = "#E4E7EC"   # hairline on light
DIV      = "#EEF0F3"   # row divider
ROW      = "#FAFBFC"   # subtle even-row fill
LOWLINE  = "#D4D9E0"   # severity-low outline
WHITE    = "#FFFFFF"

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# staircase logo glyph (48×48)
LOGO = (
    '<svg viewBox="0 0 48 48" width="30" height="30" '
    'style="filter:drop-shadow(0 0 14px rgba(255,107,53,.5));vertical-align:middle;">'
    f'<path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="{ORANGE}"/></svg>'
)

# ─── fonts (embedded base64 — reproducible on any machine) ────────────────────
# Space Grotesk covers Latin (XSHEVA, English terms, digits); Heebo covers
# Hebrew. Chrome falls through per-glyph: Latin → Space Grotesk, Hebrew → Heebo.
_FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")

def _face(family, filename, weight_range):
    path = os.path.join(_FONT_DIR, filename)
    b64 = base64.b64encode(open(path, "rb").read()).decode()
    return (f"@font-face{{font-family:'{family}';"
            f"src:url(data:font/ttf;base64,{b64}) format('truetype');"
            f"font-weight:{weight_range};font-style:normal;font-display:block;}}")

FONTS = _face("Space Grotesk", "SpaceGrotesk.ttf", "300 700") + \
        _face("Heebo", "Heebo.ttf", "100 900")

# ─── CSS ──────────────────────────────────────────────────────────────────────
CSS = f"""
{FONTS}

* {{ box-sizing: border-box; margin: 0; padding: 0;
     -webkit-print-color-adjust: exact; print-color-adjust: exact; }}

html {{ font-family: 'Space Grotesk', 'Heebo', system-ui, sans-serif; }}
body {{ direction: rtl; text-align: right; color: {INK};
        font-size: 10.5pt; line-height: 1.7; background: {WHITE}; }}

@page {{ size: A4; margin: 15mm 15mm 16mm; }}
@page :first {{ margin: 0; }}

/* ── eyebrow / headings ── */
.eyebrow {{ font-size: 8pt; font-weight: 700; letter-spacing: .16em;
            text-transform: uppercase; color: {ORANGE}; }}
.sec {{ margin: 0 0 22px; }}
.sec-head {{ margin: 0 0 10px; break-after: avoid; break-inside: avoid; }}
.sec-title {{ font-size: 19pt; font-weight: 700; letter-spacing: -.02em;
              color: {HEAD}; line-height: 1.1; margin-top: 2px; }}
.sub {{ font-size: 12pt; font-weight: 600; color: {HEAD};
        margin: 16px 0 7px; letter-spacing: -.01em; break-after: avoid; }}
.lead {{ font-weight: 700; color: {MUTE}; font-size: 9pt; margin: 12px 0 4px;
         text-transform: uppercase; letter-spacing: .06em; }}
p {{ margin-bottom: 7px; }}
.note {{ color: {MUTE}; font-size: 8.5pt; margin-top: 6px; }}

/* ── bullets ── */
ul {{ list-style: none; margin: 6px 0 10px; }}
li {{ position: relative; padding-right: 16px; margin-bottom: 4px; line-height: 1.6; }}
li::before {{ content: ""; position: absolute; right: 2px; top: .62em;
              width: 5px; height: 5px; background: {ORANGE}; border-radius: 1px; }}

/* ── tables ── */
table.tbl {{ width: 100%; border-collapse: collapse; margin: 8px 0 14px;
             font-size: 9.5pt; border: 1px solid {LINE};
             border-radius: 8px; overflow: hidden; }}
table.tbl th {{ background: {NAVY}; color: {WHITE}; font-weight: 600;
                text-align: right; padding: 9px 11px;
                border-bottom: 2px solid {ORANGE}; vertical-align: top; }}
table.tbl td {{ padding: 8px 11px; border-bottom: 1px solid {DIV};
                text-align: right; vertical-align: top; line-height: 1.55; }}
table.tbl tbody tr:nth-child(even) {{ background: {ROW}; }}
table.tbl tr.total td {{ background: {WHITE}; font-weight: 700; color: {HEAD};
                         border-top: 2px solid {ORANGE}; border-bottom: none; }}
table.tbl tr.total td.accent {{ color: {ORANGE}; }}
tr, table {{ break-inside: avoid; }}

/* ── severity chips (no emoji) ── */
.chip {{ display: inline-block; font-size: 8pt; font-weight: 700;
         padding: 2px 9px; border-radius: 2px; white-space: nowrap; }}
.chip-high {{ background: {ORANGE}; color: {WHITE}; }}
.chip-mid  {{ background: {ORANGE_T}; color: {ORANGE_D}; }}
.chip-low  {{ border: 1px solid {LOWLINE}; color: {MUTE}; font-weight: 600; }}

/* ── stat tiles ── */
.stats {{ display: table; width: 100%; border-spacing: 10px 0; margin: 4px 0 16px; }}
.stat {{ display: table-cell; width: 33%; border: 1px solid {LINE};
         border-radius: 8px; padding: 14px 16px; vertical-align: top; }}
.stat .v {{ font-size: 26pt; font-weight: 700; color: {HEAD};
            letter-spacing: -.02em; line-height: 1; }}
.stat .v small {{ font-size: 14pt; color: {ORANGE}; }}
.stat .k {{ font-size: 7.5pt; font-weight: 700; color: {MUTE};
            text-transform: uppercase; letter-spacing: .12em; margin-top: 6px; }}

/* ── maintenance callout ── */
.callout {{ border: 1px solid {LINE}; border-right: 3px solid {ORANGE};
            border-radius: 8px; padding: 12px 14px; margin: 8px 0 14px; }}
.callout .price {{ font-size: 15pt; font-weight: 700; color: {ORANGE}; }}

.pb {{ break-before: page; }}
"""

# ─── helpers ──────────────────────────────────────────────────────────────────
def eyebrow(t): return f'<div class="eyebrow">{t}</div>'

def section(num, title, body, page_break=False):
    cls = "sec pb" if page_break else "sec"
    return (f'<div class="{cls}"><div class="sec-head">{eyebrow(title[1])}'
            f'<div class="sec-title">{num} · {title[0]}</div></div>{body}</div>')

def sub(t):  return f'<div class="sub">{t}</div>'
def lead(t): return f'<div class="lead">{t}</div>'
def para(t): return f'<p>{t}</p>'
def bullets(items): return "<ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>"
def note(t): return f'<div class="note">{t}</div>'

def table(headers, rows, total=None, accent_cols=None):
    accent_cols = accent_cols or []
    h = "".join(f"<th>{x}</th>" for x in headers)
    body = ""
    for r in rows:
        body += "<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>"
    if total:
        cells = ""
        for j, c in enumerate(total):
            cls = ' class="accent"' if j in accent_cols else ""
            cells += f"<td{cls}>{c}</td>"
        body += f'<tr class="total">{cells}</tr>'
    return f'<table class="tbl"><thead><tr>{h}</tr></thead><tbody>{body}</tbody></table>'

def chip(level):
    label = {"high": "גבוהה", "mid": "בינונית", "low": "נמוכה"}[level]
    return f'<span class="chip chip-{level}">{label}</span>'

def stats(items):
    cells = "".join(f'<div class="stat"><div class="v">{v}</div><div class="k">{k}</div></div>'
                    for v, k in items)
    return f'<div class="stats">{cells}</div>'

# ─── COVER ────────────────────────────────────────────────────────────────────
COVER = f"""
<div style="background:{NAVY};width:100%;min-height:297mm;position:relative;
            padding:46mm 26mm 0;overflow:hidden;">
  <div style="direction:ltr;display:flex;align-items:center;gap:12px;">
    {LOGO}<span style="font-size:26pt;font-weight:700;color:{WHITE};letter-spacing:.14em;">XSHEVA</span>
  </div>
  <div class="eyebrow" style="direction:ltr;text-align:left;margin-top:6px;">STRATEGIC AI ARCHITECTURE</div>

  <div style="border-top:1px solid {LINE_D};margin:26mm 0 10mm;"></div>

  <div class="eyebrow">הצעת מחיר</div>
  <div style="font-size:34pt;font-weight:700;color:{WHITE};letter-spacing:-.02em;line-height:1.05;margin:4px 0 6px;">אוטומציית תהליכים</div>
  <div style="font-size:12pt;color:{MUTE_D};font-weight:400;">אינטגרציה עם Priority ERP &nbsp;·&nbsp; AI &amp; Workflow Automation</div>

  <div style="margin-top:14mm;display:inline-block;background:{ORANGE};color:{NAVY};
              font-weight:700;font-size:17pt;padding:9px 30px;border-radius:2px;letter-spacing:.02em;">רב-בריח</div>

  <div style="position:absolute;bottom:24mm;right:26mm;left:26mm;direction:rtl;">
    <div style="border-top:1px solid {LINE_D};padding-top:10px;font-size:9pt;color:{MUTE};">
      <span style="float:right;">מוגש על ידי <strong style="color:{WHITE};font-weight:600;">Kobi Hazout</strong> · XSHEVA · kobi@xsheva.com</span>
      <span style="float:left;direction:ltr;">יולי 2026 · מסמך סודי · תוקף: 6.7.2026</span>
      <span style="display:block;clear:both;"></span>
    </div>
  </div>

  <div style="position:absolute;left:-70px;bottom:-70px;width:260px;height:260px;
              background:{ORANGE};opacity:.14;border-radius:50%;filter:blur(70px);"></div>
</div>
"""

# ─── SECTION 1 · מבוא ──────────────────────────────────────────────────────────
SEC1 = section("1", ("מבוא ורציונל", "רקע"),
    para("רב-בריח, חברה מובילה בתחום מוצרי אבטחה ומנעולנות, מזהה הזדמנות אסטרטגית לייעול שני תהליכים עיקריים הפועלים כיום באופן ידני מלא:")
    + bullets([
        "<strong>תהליך 1 — רשימות קבלנים וקריאות שירות:</strong> זיהוי וסיווג פניות קבלנים במייל, בדיקת אחריות מול Priority ERP, פתיחת קריאות שירות ושיבוץ טכנאי.",
        "<strong>תהליך 2 — הזמנות עבודה:</strong> שליפה, ולידציה והקלדה אוטומטית של הזמנות ל-Priority, עם workflow אישורים מדורג.",
    ])
    + para("שני התהליכים עתירי כוח אדם, מועדים לשגיאות, ומהווים צוואר בקבוק בשרשרת האספקה. הפתרון משלב AI, אוטומציה וממשקי Priority API — תוך שמירה על human-in-the-loop בנקודות קריטיות.")
    + lead("גישת מימוש — פיילוט תחילה (MVP)")
    + para("ההצעה מתמקדת בבניית ה-\"happy path\" של שני התהליכים כ-MVP, עם בקרה אנושית בנקודות הקריטיות. מקרי קצה, פורמטים לא-אחידים ואוטומציה מלאה מטופלים איטרטיבית לאחר הפיילוט. <strong>שני התהליכים מתומחרים בנפרד — ניתן להתחיל מתהליך אחד בלבד.</strong>"))

# ─── SECTION 2 · תשתית ואבטחה ──────────────────────────────────────────────────
SEC2 = section("2", ("תשתית, ארכיטקטורה ואבטחה", "פלטפורמה"),
    para("הפתרון רץ על תשתית עצמאית בשליטת הארגון, לשמירה על אבטחת מידע ואקו-סיסטם יציב:")
    + sub("2.1 · Stack טכנולוגי")
    + table(["שכבה", "טכנולוגיה", "תפקיד"], [
        ["תשתית", "VPS פרטי בשליטת הארגון", "הרצת כל רכיבי המערכת — עיבוד self-hosted"],
        ["אוטומציה", "n8n (על ה-VPS)", "ניהול flows, סוכני AI, לוגיקה עסקית, התראות"],
        ["AI / NLP", "Anthropic Claude API (חיצוני)", "ניתוח טקסט, חילוץ מידע מובנה, Confidence Score"],
        ["ERP", "Priority OData REST API", "קריאה / כתיבה: פרויקטים, אחריות, קריאות שירות, הזמנות"],
        ["Dashboard", "Web App על ה-VPS", "ניטור, תיבת חריגות, בקרה ידנית (HITL), דוחות"],
    ])
    + note("התשתית (VPS) — אספקה, עלות ותחזוקה שוטפת — באחריות רב-בריח. XSHEVA מתקינה, מריצה ומתחזקת עליה את רכיבי המערכת בלבד.")
    + sub("2.2 · Human-in-the-Loop")
    + para("האוטומציה מאיצה, לא מחליפה שיקול דעת. בקרה אנושית בשלבים הקריטיים:")
    + bullets([
        "<strong>מדד ביטחון (Confidence Score)</strong> על כל חילוץ מידע — מתחת לסף המוגדר, הפריט עובר לתיבת חריגות לטיפול ידני.",
        "<strong>תהליך 1</strong> — שליחת הצעת מחיר מחייבת אישור נציג ידני (אוטומציה מלאה תישקל רק אחרי הפיילוט).",
        "<strong>תהליך 2</strong> — אישור בכירה לפני הורדת הזמנה לשטח, עם נעילת הזמנה (status lock).",
        "כל פעולה מתועדת ב-audit log: timestamp, input, output, תוצאה.",
    ])
    + sub("2.3 · אבטחת מידע — מודל היברידי")
    + para("כל התשתית והעיבוד רצים self-hosted על VPS בשליטת הארגון; רק ניתוח הטקסט עצמו נשלח ל-Anthropic API (בכפוף ל-DPA). זה מצמצם משמעותית את משטח הסיכון מול פתרון ענן מלא. מסלול self-hosted מלא ל-AI (Ollama / Llama) על אותו VPS יישקל אם תידרש אי-יציאת מידע מוחלטת.")
    + sub("2.4 · אבטחת AI — Prompt Injection וקלט זדוני")
    + para("כל תוכן חיצוני (מיילים, טפסים) נחשב לא-מהימן ומטופל כ-data בלבד — לעולם לא כהוראות לסוכן:")
    + bullets([
        "<strong>הפרדת הוראות מתוכן</strong> (instruction / data separation) — טקסט מהמייל אינו יכול לשנות את לוגיקת הסוכן.",
        "<strong>Guardrails וסינון קלט</strong> מפני הזרקות (prompt injection), קישורים וקבצים זדוניים.",
        "<strong>ולידציית פלט</strong> לפני כל כתיבה ל-Priority, עם הרשאות least-privilege.",
        "שער ה-HITL משמש גם כבקרת אבטחה — פעולה חריגה נעצרת לאישור אנושי.",
    ])
    + sub("2.5 · למידה מתמשכת (Human-in-the-Loop Learning)")
    + para("בשני התהליכים: בתחילה כל בקשה עוברת בקרה אנושית — הנציג/ה מאשר, עורך או מתקן. כל אישור ותיקון נשמר כ-dataset מתויג שממנו הסוכן לומד ומשתפר לאורך זמן:")
    + bullets([
        "<strong>התחלה — 100% HITL:</strong> כל פריט מאושר או נערך ידנית.",
        "<strong>תיעוד:</strong> כל אישור ותיקון נרשם כ-labeled data (קלט → פלט נכון).",
        "<strong>הערכה תקופתית:</strong> מדידת דיוק מול הבקרות, והעלאת סף האוטונומיה בהדרגה כשהדיוק מוכח — בנפרד לכל תהליך.",
    ])
    + note("fine-tuning / אימון אוטומטי מתקדם מתבצע איטרטיבית לאחר הפיילוט.")
    + sub("2.6 · Caching ואופטימיזציה")
    + para("תוצאות ולידציה שכבר חושבו נשמרות ב-cache למניעת בדיקות כפולות וחיסכון בקריאות API. לדוגמה בתהליך 1: פרויקט ותוקף אחריות שכבר נבדקו נשלפים מה-cache, ללא שאילתה חוזרת ל-Priority. מנגנון invalidation / TTL מרענן נתונים שהשתנו."))

# ─── SECTION 3 · תהליך 1 ───────────────────────────────────────────────────────
SEC3 = section("3", ("תהליך 1 — רשימות קבלנים", "אפיון · תהליך 1"),
    lead("מצב נוכחי")
    + para("קבלנים שולחים מיילים (מכתובות משתנות, ללא תבנית אחידה) עם פרטי דיירים שנתקלו בתקלה. נציגה מקבלת, בודקת ידנית אחריות ומסווגת טיפול.")
    + lead("זרימת תהליך אוטומטית מוצעת")
    + bullets([
        "<strong>קלט וסיווג:</strong> תיעול כלל הפניות למייל מרכזי אחד; סיווג לפי שולח / דומיין / מילות מפתח + סינון False Positives.",
        "<strong>ניתוח AI:</strong> חילוץ מידע מובנה (גוף מייל / PDF / Excel) — פרויקט, דייר, סוג תקלה — עם Confidence Score.",
        "<strong>בדיקת אחריות:</strong> הצלבה מול Priority OData / דאטה-בייס הפרויקטים ותוקף האחריות.",
        "<strong>באחריות</strong> ← פתיחת קריאת שירות ב-Priority + שיבוץ טכנאי / קריאה לנציגה לתיאום.",
        "<strong>לא באחריות</strong> ← ריכוז הנתונים לנציגה. הפקת ושליחת הצעת מחיר אוטומטית <strong>אינה כלולה בשלב זה</strong> — נדרש אישור נציג ידני.",
        "<strong>חריגות:</strong> Confidence נמוך ← תיבת ביקורת לנציגה. לוג מלא + dashboard לניטור.",
    ])
    + note("במידה ואין דאטה-בייס מרכזי לאחריות — ייתכן ותידרש משימת ביניים (milestone) לבניית טבלת פרויקטים / אחריות ייעודית באפיון הסופי (מכוסה בחריגת ה-20%)."))

# ─── SECTION 4 · תהליך 2 ───────────────────────────────────────────────────────
SEC4 = section("4", ("תהליך 2 — הזמנות עבודה", "אפיון · תהליך 2"),
    lead("מצב נוכחי")
    + para("עובדות מקבלות הזמנות בטאבלט או בטפסים ידניים, מבצעות בקרה ידנית, ומקלידות ל-Priority. עיכוב בהקלדה שקול לעצירת שרשרת האספקה — צוואר בקבוק קריטי.")
    + lead("זרימת תהליך אוטומטית מוצעת")
    + bullets([
        "<strong>ריכוז לערוץ דיגיטלי:</strong> שאיפה למרכז את כל קבלת ההזמנות לערוץ דיגיטלי אחד ליצירת flow אחיד (במקום טפסים פיזיים / צילומים).",
        "<strong>ולידציה מול SSOT:</strong> הצלבת נתונים מול בסיס הנתונים המוסמך של הארגון (Single Source of Truth) — שדות חובה, ערכים תקינים, התאמה לפרויקט.",
        "<strong>תקינה</strong> ← הקלדה אוטומטית ל-Priority + שינוי סטטוס.",
        "<strong>לא תקינה / Confidence נמוך</strong> ← ניתוב לבקרה ידנית + תיאור הסטייה.",
        "<strong>דורש אישור בכירה</strong> ← נעילת הזמנה (status lock) + התראה מיידית, לפני הורדה לשטח.",
        "Audit log מלא לכל פעולה אוטומטית.",
    ])
    + note("הגדרת \"הזמנה תקינה\" מול הקריטריונים הנבדקים ידנית כיום תיקבע ב-Workshop בשלב 0. טפסים ידניים / מצולמים (איכות נמוכה, כתב יד) מטופלים דרך ה-MVP וחריגת ה-20%."))

# ─── SECTION 5 · ROADMAP ───────────────────────────────────────────────────────
SEC5 = section("5", ("ROADMAP ולוח זמנים", "לוח זמנים"),
    table(["שלב", "כותרת", "משך", "Milestone"], [
        ["0", "תשתית, אפיון ו-POC (Priority API)", "שבועות 1–2", "Sign-off אפיון"],
        ["1", "פיתוח תהליך 1 — רשימות קבלנים (MVP)", "שבועות 3–4", "Demo תהליך 1"],
        ["2", "פיתוח תהליך 2 — הזמנות (MVP)", "שבועות 5–7", "Demo תהליך 2"],
        ["3", "QA, UAT, הדרכה ו-Go-Live", "שבועות 8–9", "Go-Live"],
    ])
    + note("סה\"כ timeline: כ-9 שבועות (כחודשיים) מחתימת הסכם. מותנה בזמינות Priority API ובמענה מהיר בשלב האפיון."))

# ─── SECTION 6 · תמחור ─────────────────────────────────────────────────────────
SEC6 = section("6", ("תמחור", "השקעה"),
    sub("6.1 · עלויות הקמה — תעריף 550 ₪ / שעה")
    + table(["בלוק", "תיאור", "שעות", "עלות (₪)"], [
        ["שלב 0 — תשתית", "VPS, חיבור Priority OData + POC, מייל מרכזי, מסגרת דשבורד, אפיון", "20", "11,000"],
        ["תהליך 1 — קבלנים", "parser, בדיקת אחריות, דיספאץ׳ ושיבוץ, תיבת חריגות HITL", "38", "20,900"],
        ["תהליך 2 — הזמנות", "ingestion, ולידציה SSOT, נעילת אישור בכירה, Confidence Score", "48", "26,400"],
    ], total=["סה\"כ", "", "106", "58,300 + מע\"מ"], accent_cols=[3])
    + note("scope של MVP-פיילוט: ה-\"happy path\" של שני התהליכים עם בקרה אנושית. כל תהליך מתומחר בנפרד — ניתן להתחיל מתהליך אחד. <strong>סעיף חריגה מוסכם: עד 20% מהשעות לכל בלוק</strong>, למקרי קצה שיצופו תוך כדי (מאושר מראש במסגרת האפיון).")
    + note("<strong>לא כלול:</strong> עלויות תשתית וספקי צד ג׳ — VPS / אירוח, קרדיטים ל-Anthropic API, רישוי Priority — אינן כלולות בהצעה ובאחריות הלקוח.")
    + sub("6.2 · אחזקה חודשית שוטפת")
    + '<div class="callout"><span class="price">3,500 ₪ + מע\"מ / חודש</span>'
      '<div class="note" style="margin-top:4px;">כלול בריטיינר: ניטור שוטף · תחזוקה מונעת · עדכונים ותיקונים קלים · דוח ביצועים חודשי.</div></div>'
    + sub("6.3 · תמיכה שוטפת — מעבר לאחריות")
    + table(["מסלול", "תיאור", "תעריף"], [
        ["אחריות באגים (כלול)", "שבועיים מ-Go-Live — תקלות במסגרת האפיון הסופי בלבד", "ללא עלות"],
        ["מסלול שעתי (Ad-hoc)", "תיקונים ושינויים מעבר לאפיון / לאחריות", "600 ₪ / שעה"],
        ["בנק שעות מוזל", "רכישה מראש של 20 שעות (9,600 ₪)", "480 ₪ / שעה"],
    ], accent_cols=[])
    + sub("6.4 · אבני תשלום")
    + table(["אבן", "תנאי", "אחוז", "סכום (₪)"], [
        ["1", "חתימת הסכם", "25%", "14,575"],
        ["2", "Sign-off אפיון (שלב 0)", "25%", "14,575"],
        ["3", "Demo מוצלח שני תהליכים", "25%", "14,575"],
        ["4", "Go-Live + אישור לקוח", "25%", "14,575"],
    ], total=["סה\"כ", "", "100%", "58,300"], accent_cols=[3])
    + note("בנק השעות חוסך 20% מול התעריף השעתי (600 ₪). כל המחירים אינם כוללים מע\"מ."))

# ─── SECTION 7 · ROI ───────────────────────────────────────────────────────────
SEC7 = section("7", ("ניתוח ROI", "החזר השקעה"),
    stats([("196%", "ROI · שנה 1"), ("~3", "חודשים · נקודת איזון"),
           ('297K<small>₪</small>', "חיסכון שנתי")])
    + sub("7.1 · הנחות חישוב")
    + table(["פרמטר", "ערך הנחה"], [
        ["עובדות המחלקה", "10"],
        ["שעות יומיות — תהליך 1 (קבלנים)", "9 (3 ש׳/יום × 3 עובדות)"],
        ["שעות יומיות — תהליך 2 (הזמנות)", "35 (7 ש׳/יום × 5 עובדות)"],
        ["ימי עבודה בשנה", "250"],
        ["עלות שעת עבודה (כולל נטל מעסיק)", "45 ₪ / שעה"],
        ["אפקטיביות אוטומציה (שמרנית)", "60%"],
        ["ערך שגיאות ועיכובים (הערכה שמרנית)", "30,000–60,000 ₪ / שנה"],
    ])
    + sub("7.2 · חישוב חיסכון שנתי")
    + table(["סעיף", "ערך"], [
        ["סה\"כ שעות אנוש שנתיות", "11,000 שעות / שנה"],
        ["עלות כוח אדם נוכחית", "495,000 ₪ / שנה"],
        ["חיסכון שעות (60% אוטומציה)", "297,000 ₪ / שנה"],
        ["ערך צמצום שגיאות ועיכובים", "30,000–60,000 ₪ / שנה"],
    ], total=["סה\"כ ערך שנתי מוערך", "327,000–357,000 ₪ / שנה"], accent_cols=[1])
    + sub("7.3 · Timeline להחזר השקעה")
    + table(["תקופה", "עלות מצטברת", "חיסכון מצטבר", "מצב"], [
        ["Go-Live (חודש 2)", "58,300 ₪", "—", ""],
        ["חודש 5 (~3 מ-Go-Live)", "~68,800 ₪", "~74,250 ₪", "<strong>נקודת איזון</strong>"],
        ["שנה 1 (12 חודשי ריטיינר)", "100,300 ₪", "297,000 ₪", ""],
        ["רווח נקי שנה 1", "—", "196,700 ₪", "<strong>ROI 196%</strong>"],
    ])
    + note("עלות שנה 1: 58,300 ₪ הקמה + 42,000 ₪ ריטיינר = 100,300 ₪. רווח נקי מול חיסכון שמרני של 297,000 ₪. ההנחות מבוססות על ראיון ראשוני; מדידות בסיס מדויקות ייכללו בשלב 0."))

# ─── SECTION 7 · סיכונים ───────────────────────────────────────────────────────
RISKS = [
    ["ס-1", "שליחת מידע אישי דיירים לספקי AI חיצוניים", "high", "עיבוד self-hosted על VPS + DPA; Ollama מלא בעת הצורך", "אבטחת מידע"],
    ["ס-2", "דרישת self-hosted מלא ל-AI (מעבר לתשתית)", "mid", "מסלול Ollama / Llama על ה-VPS הקיים", "IT + אבטחת מידע"],
    ["ס-3", "Priority API לא נגיש מרשת חיצונית", "high", "VPN / agent מקומי / IP whitelist", "IT Priority"],
    ["ס-4", "הזמנה עוברת ללא אישור בכירה", "high", "Status lock + audit log + התראה", "אפיון מול צוות"],
    ["ס-5", "חבילת טרנסאקציות Priority חסרה", "mid", "רכש נוסף מ-Priority Software", "IT Priority"],
    ["ס-6", "גרסת Priority ישנה — תאימות API חלקית", "mid", "POC מלא בשלב 0", "IT Priority"],
    ["ס-7", "GDPR / חוק הגנת פרטיות — מידע דיירים", "mid", "DPA עם ספקים, מדיניות שמירה / מחיקה", "משפטי"],
    ["ס-8", "זיהוי שגוי של מיילים רלוונטיים", "mid", "Confidence score + ביקורת שבועית", "אפיון"],
    ["ס-9", "פורמט מגוון של תוכן מיילי קבלנים", "low", "parser מולטי-פורמט / תבנית אחידה", "אפיון"],
    ["ס-10", "תהליך 'לא באחריות' לא מוגדר סופית", "low", "הגדרה מלאה בשלב 0", "סיגל"],
    ["ס-11", "OCR טפסים פיזיים — אמינות נמוכה", "mid", "validation אנושי / מעבר דיגיטלי", "הנהלה"],
    ["ס-12", "קריטריוני 'הזמנה תקינה' לא מתועדים", "mid", "Workshop בשלב 0", "סיגל + צוות"],
    ["ס-13", "טפסי Priority לא מוגדרים כ-Available for API", "low", "הגדרה ידנית על ידי IT", "IT Priority"],
    ["ס-14", "נתוני מנהל פרויקט חסרים ב-Priority", "low", "הקמת mapping table", "IT Priority"],
    ["ס-15", "Prompt injection / קלט זדוני משפיע על החלטות ה-AI", "high", "הפרדת הוראות מ-data, guardrails, ולידציית פלט, least-privilege, שער HITL", "אבטחת מידע"],
]
SEC8 = section("8", ("רישום סיכונים", "ניהול סיכונים"),
    para("סיכונים בחומרה גבוהה דורשים מענה לפני חתימת הסכם.")
    + table(["#", "סיכון", "חומרה", "מיטיגציה", "מצריך אימות"],
            [[r[0], r[1], chip(r[2]), r[3], r[4]] for r in RISKS]))

# ─── SECTION 9 · SLA ───────────────────────────────────────────────────────────
SEC9 = section("9", ("SLA ותנאי שירות", "רמת שירות"),
    table(["מדד", "התחייבות"], [
        ["זמן תגובה — תקלה קריטית", "4 שעות (בשעות עבודה)"],
        ["זמן פתרון — תקלה קריטית", "48 שעות"],
        ["זמן תגובה — תקלה רגילה", "24 שעות (בשעות עבודה)"],
        ["Uptime יעד", "99% (רכיבי אוטומציה בשליטתנו)"],
        ["חלון תחזוקה", "ימי ראשון, 22:00–01:00"],
        ["דוח ביצועים", "חודשי — עיבודים, שגיאות, זמני תגובה"],
        ["ערוצי תקשורת", "Slack / WhatsApp / מייל · א׳–ה׳ 09:00–18:00"],
        ["גיבויים", "יומי — לוגים, קונפיגורציה, נתוני מעקב"],
        ["אחריות באגים", "שבועיים מ-Go-Live — תקלות במסגרת האפיון הסופי; מעבר לכך במסלול שעתי"],
    ]))

# ─── SECTION 10 · דרישות תחילת עבודה ───────────────────────────────────────────
SEC10 = section("10", ("דרישות תחילת עבודה", "תנאים מוקדמים"),
    para("נדרשים לפני תחילת הפיתוח. אי-עמידה עלולה לדחות את לוח הזמנים:")
    + bullets([
        "<strong>דאטה לאימון (חובה):</strong> נתונים היסטוריים מתויגים — מיילים / הזמנות עבר עם הסיווגים והתגובות הנכונים — לאימון המודל לכלל המקרים. תנאי מוקדם לתחילת הפיתוח; משפיע על לוח הזמנים ואיכות המודל.",
        "<strong>אישור אבטחת מידע:</strong> האם מידע דיירים יכול לעבור לספקי AI חיצוניים? (ס-1, ס-2)",
        "<strong>גישת IT ל-Priority:</strong> API, גרסה, חבילת טרנסאקציות, נגישות חיצונית (ס-3, ס-5, ס-6)",
        "<strong>VPS / תשתית:</strong> אספקת שרת וירטואלי בשליטת הארגון (חומרה / ענן, עלות ותחזוקה שוטפת) — באחריות רב-בריח.",
        "<strong>מדיניות סיווג מיילים:</strong> כתובות / דומיינים / מילות מפתח לזיהוי פניות קבלנים (ס-8)",
        "<strong>קריטריוני 'הזמנה תקינה'</strong> ותנאי 'אישור בכירה' מתועדים (ס-12, ס-4)",
        "<strong>מדיניות טיפול בטפסים פיזיים</strong> / מעבר לדיגיטל (ס-11)",
        "<strong>נציג IT / Priority</strong> מטעם רב-בריח לשיתוף פעולה טכני שוטף",
    ])
    + note("פריטים אלו מהווים תנאי מוקדם לדיוק לוח הזמנים והמחיר הסופי.")
    + f'<div style="margin-top:22px;border-top:1px solid {LINE};padding-top:14px;'
      f'text-align:center;color:{MUTE};font-size:9.5pt;">בכבוד רב · '
      f'<strong style="color:{HEAD};font-weight:600;">Kobi Hazout</strong> · XSHEVA · kobi@xsheva.com</div>')

def build():
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "samples")
    os.makedirs(out_dir, exist_ok=True)
    html_path = "/tmp/proposal_build.html"
    pdf_path = os.path.abspath(os.path.join(out_dir, "proposal-rav-bariach-xsheva.pdf"))

    body = (COVER + SEC1 + SEC2 + SEC3 + SEC4 + SEC5
            + SEC6 + SEC7 + SEC8 + SEC9 + SEC10)
    html = (f'<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8">'
            f'<style>{CSS}</style></head><body>{body}</body></html>')

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"HTML: {len(html) // 1024} KB → {html_path}")

    if not os.path.exists(CHROME):
        print(f"⚠ Chrome not found at {CHROME} — open the HTML and print to PDF manually.")
        return

    subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
        "--virtual-time-budget=15000", "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={pdf_path}", f"file://{html_path}",
    ], capture_output=True, text=True)

    if os.path.exists(pdf_path):
        print(f"✅ {pdf_path} ({os.path.getsize(pdf_path) // 1024} KB)")
    else:
        print("❌ Chrome print failed.")


if __name__ == "__main__":
    build()
````

## File: scripts/create-user.js
````javascript
#!/usr/bin/env node
/**
 * Create a Firebase Auth user (email/password)
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json node scripts/create-user.js <email> <password>
 *
 * Get the service account key:
 *   Firebase Console → Project Settings → Service Accounts → Generate new private key
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: node scripts/create-user.js <email> <password>');
  console.error('');
  console.error('Requires: GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json');
  console.error('Get key: Firebase Console → Project Settings → Service Accounts → Generate new private key');
  process.exit(1);
}

if (!credsPath) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS not set');
  console.error('Set it to the path of your Firebase service account JSON key.');
  process.exit(1);
}

const creds = JSON.parse(readFileSync(resolve(credsPath), 'utf8'));

initializeApp({ credential: cert(creds) });

getAuth()
  .createUser({ email, password })
  .then((user) => {
    console.log('User created:', user.uid, email);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
````

## File: scripts/deploy-rules.sh
````bash
#!/usr/bin/env bash
# Deploy Firestore rules. Run: ./scripts/deploy-rules.sh
# If you get "credentials no longer valid", run: firebase login --reauth
set -e
cd "$(dirname "$0")/.."
firebase deploy --only firestore:rules
````

## File: src/components/ui/button.tsx
````typescript
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
````

## File: src/components/ui/card.tsx
````typescript
import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
````

## File: src/components/ui/input.tsx
````typescript
import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
````

## File: src/components/ui/label.tsx
````typescript
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
````

## File: src/components/ui/radio-group.tsx
````typescript
import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";

import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} ref={ref} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
````

## File: src/components/ui/separator.tsx
````typescript
import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn("shrink-0 bg-border", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className)}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
````

## File: src/components/Logo.tsx
````typescript
import React from 'react';

interface LogoProps {
  className?: string;
  /** Fill color for the logo paths. Default: currentColor (inherits from parent) */
  fill?: string;
  /** Height in CSS units. Default: 1.75rem (h-7) */
  height?: string;
}

/**
 * So Media logo as inline SVG for reliable PDF export.
 * Inline SVG renders correctly with html2canvas (unlike img src SVG).
 */
export const Logo: React.FC<LogoProps> = ({
  className = '',
  fill = 'currentColor',
  height = '1.75rem',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 132 97.4"
    fill={fill}
    height={height}
    className={`object-contain ${className}`}
    aria-hidden
  >
    {/* SoMedia symbol - top part */}
    <g>
      <path d="M72,34.7c-1-2.2-2.5-4.1-4.4-5.6c-1.9-1.5-4.3-2.8-7.2-3.6c0,0-0.1,0-0.1,0c-0.9-0.2-1.8-0.5-2.8-0.6c-2.1-0.4-4.5-0.6-7-0.6c-2,0-4,0.1-6.1,0.3c-2.1,0.2-4.2,0.4-6.2,0.7s-3.9,0.5-5.8,0.7s-3.4,0.3-4.8,0.3c-3.5,0-6.1-0.6-7.8-1.8c-1.7-1.2-2.5-2.8-2.5-4.6c0-1,0.3-2,0.8-2.9s1.5-1.9,2.8-2.7c1.4-0.8,3.2-1.4,5.4-2s5.2-0.8,8.7-0.8c2.5,0,4.9,0.1,7.3,0.4c2.4,0.3,4.7,0.7,7,1.1c2.2,0.5,4.4,1.1,6.4,1.7c1.6,0.5,3.2,1.1,4.6,1.7c1.8-3.6,4.3-6.9,7.3-9.6c0.1,0,0.1-0.1,0.1-0.1l0.1-0.1c-2.2-1-5.2-2-7.8-2.8c-2.5-0.8-5.1-1.5-7.8-2c-2.7-0.6-5.5-1-8.4-1.3S38.3,0,35.4,0C31.5,0,28,0.3,25,0.9c-3.1,0.5-5.8,1.3-8.1,2.3c-2.3,1-4.3,2.1-6,3.5c-1.6,1.3-3,2.8-4,4.3s-1.8,3.2-2.3,4.9c-0.5,1.7-0.7,3.4-0.7,5.1c0,2.9,0.6,5.5,1.8,7.7s2.8,4,4.8,5.5s4.3,2.5,6.9,3.3s5.3,1.1,8.2,1.1c1.7,0,3.5-0.1,5.5-0.3s3.9-0.5,5.9-0.8s4-0.5,5.9-0.8s3.8-0.3,5.5-0.3c4,0,7,0.7,8.9,2c0,0,0,0,0,0c1.9,1.3,2.8,3.1,2.8,5.4c0,1-0.2,1.9-0.5,2.7c-0.2,0.4-0.4,0.8-0.6,1.3c-0.8,1.2-2,2.3-3.7,3.1s-3.9,1.6-6.5,2.1c-2.7,0.5-5.9,0.8-9.7,0.8c-3.2,0-6.1-0.2-8.9-0.6c-2.8-0.4-5.5-0.9-8-1.6s-5-1.6-7.4-2.6s-4.7-2.2-7-3.5L0.8,55.7c2.4,1.4,5,2.6,7.8,3.8s5.8,2.1,8.9,3c3.1,0.8,6.4,1.5,9.8,1.9c3.4,0.4,6.9,0.7,10.5,0.7c5.4,0,10.3-0.5,14.7-1.5s8.2-2.5,11.3-4.5c1-0.7,2-1.3,2.9-2.1c0.7-0.6,1.4-1.3,2-2c0.9-1,1.7-2,2.3-3.1c1.7-2.8,2.5-6.1,2.5-9.7C73.5,39.4,73,36.9,72,34.7L72,34.7z" />
      <path d="M129.4,19.2c-1.8-4-4.2-7.4-7.4-10.2s-7-5.1-11.4-6.6C106.1,0.8,101.2,0,95.8,0c-5.4,0-10.3,0.8-14.8,2.3C76.6,3.9,72.8,6.1,69.6,9l0,0c-0.3,0.3-0.6,0.6-0.9,0.9c0,0-0.1,0.1-0.1,0.1c-0.3,0.3-0.6,0.6-0.9,0.9c0,0,0,0-0.1,0.1c-1.9,2-3.4,4.3-4.7,6.8l0,0.1c-0.2,0.5-0.5,0.9-0.7,1.4c-0.5,1.1-0.9,2.3-1.3,3.5c0,0,0,0,0.1,0l0,0c0,0,0.1,0,0.2,0c3.2,0.9,6,2.3,8.2,4.1c1.2,1,2.2,2,3.2,3.2c0.2-2.4,0.8-4.6,1.7-6.5c1.2-2.6,2.8-4.8,4.9-6.6c2.1-1.8,4.6-3.2,7.4-4.1c2.8-0.9,5.9-1.4,9.3-1.4s6.4,0.5,9.3,1.4c2.8,0.9,5.3,2.3,7.4,4.1c2.1,1.8,3.7,4,4.9,6.6s1.8,5.5,1.8,8.8s-0.6,6.2-1.8,8.8s-2.8,4.8-4.9,6.7c-2.1,1.8-4.5,3.3-7.4,4.3s-5.9,1.5-9.3,1.5c-3.3,0-6.4-0.5-9.3-1.5c-2.8-1-5.3-2.4-7.4-4.3c-1.1-1-2-2-2.9-3.2c-0.3,3.1-1.3,6-2.8,8.6c-0.8,1.3-1.6,2.5-2.6,3.6l0,0c2.9,2.4,6.3,4.3,10.2,5.7c4.4,1.6,9.4,2.4,14.8,2.4c5.4,0,10.3-0.8,14.7-2.4c4.5-1.6,8.3-3.8,11.4-6.7c3.2-2.9,5.6-6.3,7.4-10.3c1.8-4,2.6-8.4,2.6-13.2C132,27.5,131.1,23.2,129.4,19.2L129.4,19.2z" />
    </g>
    {/* SoMedia text - bottom part */}
    <g>
      <path d="M38.3,85.3v11.3h-2.9V85.3c0-2-0.7-4.1-5.8-4.1c-3.1,0-9,2.4-9,5.9v9.5h-2.9V85.3c0-2-0.7-4.1-5.8-4.1c-3.1,0-9,2.4-9,5.9v9.5H0V79h2.9v2.7c2.5-2.1,6.2-3.4,9-3.4c4.9,0,7.2,1.8,8.1,3.9c2.5-2.4,6.5-3.9,9.6-3.9C36.8,78.4,38.3,82.2,38.3,85.3L38.3,85.3z" />
      <path d="M64.7,90.4l2.5,1.4c-0.1,0.2-3.2,5.5-12,5.5c-8.6,0-12.6-4.8-12.6-9.3c0-2.9,1.3-9.8,13.2-9.8c11.1,0,11.5,8.8,11.5,8.9c0,0.4,0,1.5,0,1.5H45.6c0.3,3,3.4,5.9,9.6,5.9C62.3,94.5,64.7,90.4,64.7,90.4L64.7,90.4z M45.9,85.7h18.3c-0.6-1.8-2.6-4.6-8.3-4.6C51.9,81.1,47.2,82,45.9,85.7z" />
      <path d="M94.6,72.3v24.3h-2.9v-2.4c-1.8,1.5-4.8,2.8-9.5,2.8c-3.6,0-6.3-1-8.2-2.8c-2.7-2.7-2.6-6.3-2.6-7.4v-0.2c0-1.8,1.9-8.4,11.3-8.4c4.1,0,7,1.6,8.9,3.4v-9.4L94.6,72.3L94.6,72.3z M91.7,88L91.7,88c0-0.9-0.2-1.9-0.7-2.7c-1.1-1.8-3.4-4.2-8.2-4.2c-3.4,0-5.4,1-6.6,2.2c-1.4,1.4-2,3.4-1.7,5.3c0.2,1.1,0.6,2.5,1.7,3.5c1.3,1.3,3.4,2,6.1,2c3.9,0,6.3-1,7.7-2.2C91,91.1,91.7,89.6,91.7,88L91.7,88z" />
      <path d="M99.8,75.7v-3.4h2.9v3.4H99.8z M99.8,96.6V79h2.9v17.6H99.8z" />
      <path d="M128.9,97.3c-0.1-0.1-0.9-1.4-1.4-3.2c-4.1,3-11.6,3-11.7,3c-4.1,0-8.4-1.3-8.4-5.2c0-4.7,4.5-5.1,11.9-5.9c5.1-0.5,7.3-1.6,8-2.1c0-0.4-0.2-0.9-0.6-1.4c-0.8-0.8-2.6-1.7-7.2-1.7c-8.2,0-9.2,3.4-9.2,3.4l-2.8-0.6c0.1-0.6,1.4-5.7,12-5.7c4.6,0,7.6,0.8,9.3,2.6c1.5,1.5,1.4,3.2,1.4,3.9v7.7c0,1.8,1.1,3.4,1.1,3.4L128.9,97.3L128.9,97.3z M127.3,89.3v-2c-1.6,0.7-4,1.3-7.7,1.7c-8.2,0.8-9.3,1.4-9.3,3s3.3,2.3,5.5,2.3C118.1,94.3,127.3,93.4,127.3,89.3L127.3,89.3z" />
    </g>
  </svg>
);
````

## File: src/lib/firebase.ts
````typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
````

## File: src/vite-env.d.ts
````typescript
/// <reference types="vite/client" />
````

## File: .env.example
````
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
````

## File: .firebaserc
````
{
  "projects": {
    "default": "proposal-6beb2"
  }
}
````

## File: firebase.json
````json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
````

## File: proposal-generator.code-workspace
````
{
	"folders": [
		{
			"path": "."
		},
		{
			"path": "../../../../Library/Mobile Documents/iCloud~md~obsidian/Documents/Maestro"
		}
	],
	"settings": {}
}
````

## File: tailwind.config.cjs
````javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
                serif: ['Lora', 'serif'],
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
````

## File: tsconfig.json
````json
{
    "compilerOptions": {
        "target": "ESNext",
        "useDefineForClassFields": true,
        "lib": [
            "DOM",
            "DOM.Iterable",
            "ESNext"
        ],
        "allowJs": false,
        "skipLibCheck": true,
        "esModuleInterop": false,
        "allowSyntheticDefaultImports": true,
        "strict": true,
        "forceConsistentCasingInFileNames": true,
        "module": "ESNext",
        "moduleResolution": "Node",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx",
        "baseUrl": ".",
        "paths": {
            "@/*": [
                "./src/*"
            ]
        }
    },
    "include": [
        "src"
    ],
    "references": [
        {
            "path": "./tsconfig.node.json"
        }
    ]
}
````

## File: tsconfig.node.json
````json
{
    "compilerOptions": {
        "composite": true,
        "skipLibCheck": true,
        "module": "ESNext",
        "moduleResolution": "bundler",
        "allowSyntheticDefaultImports": true,
        "strict": true
    },
    "include": [
        "vite.config.ts"
    ]
}
````

## File: .github/workflows/post-deploy.yml
````yaml
name: "Post-Deploy: Cabinet Update via Jules"

on:
  pull_request:
    types: [closed]
    branches: [main, master]

jobs:
  notify-jules:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - name: Checkout project
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Collect changed files
        id: diff
        run: |
          git diff \
            ${{ github.event.pull_request.base.sha }} \
            ${{ github.event.pull_request.merge_commit_sha }} \
            --name-only > /tmp/changed_files.txt || true

          SECURITY_SENSITIVE=false
          if grep -qiE "(auth|api|payment|pii|secret|password|token|\.env)" /tmp/changed_files.txt 2>/dev/null; then
            SECURITY_SENSITIVE=true
          fi

          {
            echo "changed_files<<EOF"
            cat /tmp/changed_files.txt
            echo "EOF"
            echo "security_sensitive=$SECURITY_SENSITIVE"
          } >> "$GITHUB_OUTPUT"

      - name: Open cabinet issue for Jules
        uses: actions/github-script@v7
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
          PR_BODY: ${{ github.event.pull_request.body }}
          PR_URL: ${{ github.event.pull_request.html_url }}
          CHANGED_FILES: ${{ steps.diff.outputs.changed_files }}
          SECURITY_SENSITIVE: ${{ steps.diff.outputs.security_sensitive }}
        with:
          github-token: ${{ secrets.CABINET_TOKEN }}
          script: |
            const project = context.repo.repo;
            const prTitle = process.env.PR_TITLE || '(no title)';
            const prBody = process.env.PR_BODY || '(no description)';
            const prUrl = process.env.PR_URL || '';
            const changedFiles = process.env.CHANGED_FILES || '';
            const securitySensitive = process.env.SECURITY_SENSITIVE === 'true';

            const securityNote = securitySensitive
              ? '\n> Warning: Security-sensitive files changed. Also check `knowledge/reference/' + project + '-security-audit.md`.'
              : '';

            const body = [
              '## Post-Deploy Cabinet Update',
              '',
              '**Project:** `' + project + '`',
              '**PR:** [' + prTitle + '](' + prUrl + ')',
              '**Description:** ' + prBody,
              '',
              '### Files changed',
              '```',
              changedFiles,
              '```',
              securityNote,
              '',
              '### Instructions for Jules',
              '',
              'Please update the cabinet documentation based on what changed in this PR.',
              '',
              '| What changed | Update this cabinet file |',
              '|---|---|',
              '| Architecture / API / data model | `knowledge/reference/' + project + '-architecture.md` |',
              '| New coding convention | `knowledge/standards/' + project + '-standards.md` |',
              '| Project status / decisions | `projects/' + project + '/project.' + project + '.md` |',
              '| Security finding | `knowledge/reference/' + project + '-security-audit.md` |',
              '',
              '**Rules:** Only update what actually changed. Do not create new files.',
              'If nothing significant changed for cabinet docs, close this issue with a comment.',
              '',
              'cc @google-labs-jules'
            ].join('\n');

            await github.rest.issues.create({
              owner: 'KobiHaz',
              repo: 'cabinet',
              title: '[post-deploy] ' + project + ' -- ' + prTitle,
              body: body,
              labels: ['post-deploy', 'jules']
            });

            console.log('Issue created in KobiHaz/cabinet for Jules.');
````

## File: src/contexts/AuthContext.tsx
````typescript
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signUp, logout }),
    [user, loading, signIn, signUp, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
````

## File: src/contexts/EditContext.tsx
````typescript
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DocVariant } from '@/lib/firestore';
import type { ProposalData, QuoteData } from '@/projects/types';

export interface EditingDoc {
  id: string;
  type: 'proposal' | 'agreement';
  variant: DocVariant;
  data: ProposalData | QuoteData;
}

type EditContextValue = {
  editingDoc: EditingDoc | null;
  setEditingDoc: (doc: EditingDoc | null) => void;
};

const EditContext = createContext<EditContextValue | null>(null);

export function EditProvider({ children }: { children: ReactNode }) {
  const [editingDoc, setEditingDoc] = useState<EditingDoc | null>(null);
  const value = useMemo(
    () => ({ editingDoc, setEditingDoc }),
    [editingDoc, setEditingDoc]
  );
  return (
    <EditContext.Provider value={value}>
      {children}
    </EditContext.Provider>
  );
}

export function useEdit(): EditContextValue {
  const context = useContext(EditContext);
  if (context === null) {
    throw new Error('useEdit must be used within an EditProvider');
  }
  return context;
}
````

## File: src/lib/utils.ts
````typescript
import { format, parseISO } from 'date-fns';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format YYYY-MM-DD to DD/MM/YYYY for display. Returns placeholder if empty or invalid. */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '_________';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}
````

## File: src/projects/LoginPage.tsx
````typescript
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'אימייל או סיסמה שגויים',
  'auth/invalid-email': 'כתובת אימייל לא תקינה',
  'auth/weak-password': 'הסיסמה חלשה מדי – צריך לפחות 6 תווים',
  'auth/email-already-in-use': 'כתובת האימייל כבר רשומה במערכת',
  'auth/user-disabled': 'המשתמש הושבת',
  'auth/too-many-requests': 'יותר מדי ניסיונות – נסה שוב מאוחר יותר',
  'auth/operation-not-allowed': 'אימייל/סיסמה לא מופעל ב-Firebase Console. הפעל ב-Authentication → Sign-in method',
};

function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof (error as { code: string }).code === 'string') {
    const code = (error as { code: string }).code;
    return FIREBASE_ERROR_MESSAGES[code] ?? `שגיאה: ${code}. נסה שוב.`;
  }
  const msg = error && typeof error === 'object' && 'message' in error ? String((error as { message: string }).message) : '';
  return msg ? `שגיאה: ${msg}` : 'אירעה שגיאה. נסה שוב.';
}

export function LoginPage() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (showSignUp) {
      if (password !== confirmPassword) {
        setError('הסיסמאות אינן תואמות');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (showSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-md border-border overflow-hidden">
        <div className="h-1 bg-primary" aria-hidden />
        <CardContent className="p-8 pt-8">
          <h2 className="text-xl font-semibold text-primary mb-6 text-center">
            {showSignUp ? 'צור משתמש חדש (פעם אחת)' : 'התחברות'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={showSignUp ? 'new-password' : 'current-password'}
                required
                minLength={showSignUp ? 6 : undefined}
              />
            </div>
            {showSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive font-medium" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="w-full mt-1">
              {showSignUp ? 'צור משתמש' : 'התחבר'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
````

## File: src/projects/presets.ts
````typescript
export interface AgreementPreset {
  subtitle: string;
  section1Title: string;
  section1Content: string;
  section2Title: string;
  section5Content: string;
}

export const agreementPresets: Record<'crm' | 'automation', AgreementPreset> = {
  crm: {
    subtitle: 'לאספקת שירותי פיתוח ותחזוקת תוכנה',
    section1Title: 'מהות השירות',
    section1Content:
      'הספק יפתח עבור הלקוח מערכת CRM/אפליקציה (להלן: "המערכת") המבוססת על טכנולוגיית ענן ושירותי צד ג\', בהתאם למסמך האפיון המפורט המצורף כנספח ב\'.',
    section2Title: 'שלב ההקמה (Development Phase)',
    section5Content:
      'קוד המקור של המערכת. הספק מוותר על כל זכות קניינית במערכת לאחר מסירתה הסופית וקבלת התשלום, למעט שימוש בספריות קוד פתוח או רכיבי מדף קיימים.',
  },
  automation: {
    subtitle: 'לאספקת שירותי אוטומציה ואינטגרציה',
    section1Title: 'מהות השירות',
    section1Content:
      'הספק יקים עבור הלקוח מערכת אוטומציה ואינטגרציה (להלן: "המערכת") המבוססת על פלטפורמות ענן (כגון Make.com, Zapier וכיוצא בזה) ושירותי צד ג\', בהתאם למסמך האפיון המפורט המצורף כנספח ב\'.',
    section2Title: 'שלב ההקמה (Integration Phase)',
    section5Content:
      'הלוגיקה, התסריטים והסצנריונים של המערכת. הספק מוותר על כל זכות קניינית במערכת לאחר מסירתה הסופית וקבלת התשלום, למעט שימוש בשירותי מדף או רכיבים קיימים.',
  },
};
````

## File: src/projects/ProposalForm.tsx
````typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ProposalData } from './types';
import { Plus, Trash2 } from 'lucide-react';

interface ProposalFormProps {
  data: ProposalData;
  onChange: (data: ProposalData) => void;
}

export const ProposalForm: React.FC<ProposalFormProps> = ({ data, onChange }) => {
  const handleChange = <K extends keyof ProposalData>(field: K, value: ProposalData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const updateSpecSection = (idx: number, updates: Partial<ProposalData['specSections'][0]>) => {
    const next = [...data.specSections];
    next[idx] = { ...next[idx], ...updates };
    handleChange('specSections', next);
  };

  const addSpecSection = () => handleChange('specSections', [...data.specSections, { title: '', items: [''] }]);
  const removeSpecSection = (idx: number) =>
    handleChange('specSections', data.specSections.filter((_, i) => i !== idx));

  const updateSpecItems = (secIdx: number, items: string[]) =>
    updateSpecSection(secIdx, { items });
  const addSpecItem = (secIdx: number) =>
    updateSpecItems(secIdx, [...data.specSections[secIdx].items, '']);
  const removeSpecItem = (secIdx: number, itemIdx: number) =>
    updateSpecItems(secIdx, data.specSections[secIdx].items.filter((_, i) => i !== itemIdx));

  const updateBasePackage = (updates: Partial<ProposalData['basePackage']>) =>
    handleChange('basePackage', { ...data.basePackage, ...updates });
  const addBaseItem = () => updateBasePackage({ items: [...data.basePackage.items, ''] });
  const removeBaseItem = (idx: number) =>
    updateBasePackage({ items: data.basePackage.items.filter((_, i) => i !== idx) });

  const updateAddOn = (idx: number, updates: Partial<ProposalData['addOns'][0]>) => {
    const next = [...data.addOns];
    next[idx] = { ...next[idx], ...updates };
    handleChange('addOns', next);
  };
  const addAddOn = () => handleChange('addOns', [...data.addOns, { title: '', items: [''] }]);
  const removeAddOn = (idx: number) => handleChange('addOns', data.addOns.filter((_, i) => i !== idx));
  const addAddOnItem = (addonIdx: number) =>
    updateAddOn(addonIdx, { items: [...data.addOns[addonIdx].items, ''] });
  const removeAddOnItem = (addonIdx: number, itemIdx: number) =>
    updateAddOn(addonIdx, { items: data.addOns[addonIdx].items.filter((_, i) => i !== itemIdx) });

  const updatePricingRow = (idx: number, updates: Partial<ProposalData['pricingRows'][0]>) => {
    const next = [...data.pricingRows];
    next[idx] = { ...next[idx], ...updates };
    handleChange('pricingRows', next);
  };
  const addPricingRow = () =>
    handleChange('pricingRows', [...data.pricingRows, { plan: '', setupCost: 0, monthlyCost: null, notes: '' }]);
  const removePricingRow = (idx: number) =>
    handleChange('pricingRows', data.pricingRows.filter((_, i) => i !== idx));

  const updateBlocker = (idx: number, value: string) => {
    const next = [...data.blockers];
    next[idx] = value;
    handleChange('blockers', next);
  };
  const addBlocker = () => handleChange('blockers', [...data.blockers, '']);
  const removeBlocker = (idx: number) =>
    handleChange('blockers', data.blockers.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>כותרת</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>תאריך</Label>
            <Input
              type="date"
              value={data.date}
              onChange={(e) => handleChange('date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>לכבוד</Label>
            <Input value={data.recipient} onChange={(e) => handleChange('recipient', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>מאת</Label>
            <Input value={data.sender} onChange={(e) => handleChange('sender', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>הנדון</Label>
            <Input value={data.subject} onChange={(e) => handleChange('subject', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1. מבוא ורציונל</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full min-h-[120px] px-3 py-2 text-sm border rounded-md border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
            value={data.intro}
            onChange={(e) => handleChange('intro', e.target.value)}
            placeholder="טקסט המבוא..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>2. מפרט טכני</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addSpecSection} className="gap-1">
            <Plus size={14} /> הוסף סעיף
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.specSections.map((sec, secIdx) => (
            <div key={secIdx} className="p-4 rounded-md border border-slate-200 space-y-3">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="כותרת סעיף"
                  value={sec.title}
                  onChange={(e) => updateSpecSection(secIdx, { title: e.target.value })}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSpecSection(secIdx)}
                  className="shrink-0"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              {sec.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex gap-2">
                  <Input
                    placeholder="פריט"
                    value={item}
                    onChange={(e) => {
                      const n = [...sec.items];
                      n[itemIdx] = e.target.value;
                      updateSpecItems(secIdx, n);
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSpecItem(secIdx, itemIdx)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addSpecItem(secIdx)}>
                <Plus size={14} className="ml-1" /> הוסף פריט
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. חבילת בסיס</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>כותרת חבילה</Label>
            <Input
              value={data.basePackage.title}
              onChange={(e) => updateBasePackage({ title: e.target.value })}
            />
          </div>
          {data.basePackage.items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                placeholder="פריט"
                value={item}
                onChange={(e) => {
                  const n = [...data.basePackage.items];
                  n[idx] = e.target.value;
                  updateBasePackage({ items: n });
                }}
                className="flex-1"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeBaseItem(idx)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addBaseItem}>
            <Plus size={14} className="ml-1" /> הוסף פריט
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>3. תוספות (Add-ons)</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addAddOn} className="gap-1">
            <Plus size={14} /> הוסף תוספת
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.addOns.map((addon, addonIdx) => (
            <div key={addonIdx} className="p-4 rounded-md border border-slate-200 space-y-3">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="כותרת תוספת"
                  value={addon.title}
                  onChange={(e) => updateAddOn(addonIdx, { title: e.target.value })}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeAddOn(addonIdx)}>
                  <Trash2 size={16} />
                </Button>
              </div>
              {addon.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex gap-2">
                  <Input
                    placeholder="פריט"
                    value={item}
                    onChange={(e) => {
                      const n = [...addon.items];
                      n[itemIdx] = e.target.value;
                      updateAddOn(addonIdx, { items: n });
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAddOnItem(addonIdx, itemIdx)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addAddOnItem(addonIdx)}>
                <Plus size={14} className="ml-1" /> הוסף פריט
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>4. טבלת מחירים</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addPricingRow} className="gap-1">
            <Plus size={14} /> הוסף שורה
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.pricingRows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-2 p-3 rounded border border-slate-100">
              <div className="col-span-2 flex justify-between items-center">
                <Label className="text-xs">מסלול {idx + 1}</Label>
                <Button type="button" variant="ghost" size="icon" onClick={() => removePricingRow(idx)}>
                  <Trash2 size={14} />
                </Button>
              </div>
              <Input
                placeholder="מסלול"
                value={row.plan}
                onChange={(e) => updatePricingRow(idx, { plan: e.target.value })}
              />
              <Input
                type="number"
                placeholder="עלות הקמה (₪)"
                value={row.setupCost || ''}
                onChange={(e) =>
                  updatePricingRow(idx, { setupCost: e.target.value ? Number(e.target.value) : 0 })
                }
              />
              <Input
                type="number"
                placeholder="עלות חודשית (₪) - השאר ריק ל־-"
                value={row.monthlyCost ?? ''}
                onChange={(e) =>
                  updatePricingRow(idx, {
                    monthlyCost: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
              <Input
                placeholder="הערות"
                value={row.notes}
                onChange={(e) => updatePricingRow(idx, { notes: e.target.value })}
                className="col-span-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>5. דרישות תחילת עבודה (Blockers)</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addBlocker} className="gap-1">
            <Plus size={14} /> הוסף
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.blockers.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <Input
                placeholder="דרישה"
                value={item}
                onChange={(e) => updateBlocker(idx, e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeBlocker(idx)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>הערת מע״מ</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="המחירים אינם כוללים מע״מ"
            value={data.taxNote ?? ''}
            onChange={(e) => handleChange('taxNote', e.target.value)}
          />
        </CardContent>
      </Card>
    </div>
  );
};
````

## File: src/projects/QuoteForm.tsx
````typescript
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { QuoteData } from './types';

function parseNumberInput(value: string): number {
  const trimmed = value.trim();
  return trimmed === '' ? 0 : Number(trimmed) || 0;
}

interface QuoteFormProps {
    data: QuoteData;
    onChange: (data: QuoteData) => void;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({ data, onChange }) => {
    const handleChange = <K extends keyof QuoteData>(field: K, value: QuoteData[K]) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-6 text-right" dir="rtl">
            <Card>
                <CardHeader>
                    <CardTitle>פרטי הסכם</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>תאריך</Label>
                            <Input
                                type="date"
                                value={data.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>שם הספק</Label>
                            <Input
                                value={data.developerName}
                                onChange={(e) => handleChange('developerName', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ת.ז/ח.פ מפתח</Label>
                            <Input
                                value={data.developerId}
                                onChange={(e) => handleChange('developerId', e.target.value)}
                            />
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>שם הלקוח</Label>
                            <Input
                                value={data.clientName}
                                onChange={(e) => handleChange('clientName', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ח.פ/ע.מ לקוח</Label>
                            <Input
                                value={data.clientId}
                                onChange={(e) => handleChange('clientId', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>מודל תשלום</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <RadioGroup
                        value={data.paymentModel}
                        onValueChange={(val) => handleChange('paymentModel', val as 'fixed' | 'hourly')}
                        className="flex flex-col gap-3"
                        dir="rtl"
                    >
                        <div className="flex items-center gap-2 w-full justify-start">
                            <RadioGroupItem value="fixed" id="fixed" />
                            <Label htmlFor="fixed" className="cursor-pointer">מחיר פרויקטלי (Fixed)</Label>
                        </div>
                        <div className="flex items-center gap-2 w-full justify-start">
                            <RadioGroupItem value="hourly" id="hourly" />
                            <Label htmlFor="hourly" className="cursor-pointer">לפי שעה (Hourly)</Label>
                        </div>
                    </RadioGroup>

                    {data.paymentModel === 'fixed' && (
                        <div className="space-y-4 mt-4 p-4 bg-secondary/20 rounded-md">
                            <div className="space-y-2">
                                <Label>מחיר גלובלי (ללא מע"מ)</Label>
                                <Input
                                    type="number"
                                    value={data.fixedPriceAmount || ''}
                                    onChange={(e) => handleChange('fixedPriceAmount', parseNumberInput(e.target.value))}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <Label>מקדמה (%)</Label>
                                    <Input
                                        type="number"
                                        value={data.advancePaymentPercent}
                                        onChange={(e) => handleChange('advancePaymentPercent', parseNumberInput(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>בטא (%)</Label>
                                    <Input
                                        type="number"
                                        value={data.betaPaymentPercent}
                                        onChange={(e) => handleChange('betaPaymentPercent', parseNumberInput(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>סיום (%)</Label>
                                    <Input
                                        type="number"
                                        value={data.finalPaymentPercent}
                                        onChange={(e) => handleChange('finalPaymentPercent', parseNumberInput(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {data.paymentModel === 'hourly' && (
                        <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-secondary/20 rounded-md">
                            <div className="space-y-2">
                                <Label>תעריף שעתי</Label>
                                <Input
                                    type="number"
                                    value={data.hourlyRate || ''}
                                    onChange={(e) => handleChange('hourlyRate', parseNumberInput(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>צפי שעות</Label>
                                <Input
                                    type="number"
                                    value={data.estimatedHours || ''}
                                    onChange={(e) => handleChange('estimatedHours', parseNumberInput(e.target.value))}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>תחזוקה ושירות</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>ריטיינר חודשי</Label>
                            <Input
                                type="number"
                                value={data.monthlyRetainerAmount || ''}
                                onChange={(e) => handleChange('monthlyRetainerAmount', parseNumberInput(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>תעריף תמיכה</Label>
                            <Input
                                type="number"
                                value={data.supportHourlyRate || ''}
                                onChange={(e) => handleChange('supportHourlyRate', parseNumberInput(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ימי אחריות</Label>
                            <Input
                                type="number"
                                value={data.warrantyDays}
                                onChange={(e) => handleChange('warrantyDays', parseNumberInput(e.target.value))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>תנאים נוספים</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label>לוחות זמנים (ימי עבודה)</Label>
                        <Input
                            type="number"
                            value={data.timelineDays}
                            onChange={(e) => handleChange('timelineDays', parseNumberInput(e.target.value))}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
````

## File: src/index.css
````css
@import "tailwindcss";

@theme {
  /* So Media brand: dark green, pink accent, black/white */
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(0 0% 9%);
  --color-card: hsl(0 0% 100%);
  --color-card-foreground: hsl(0 0% 9%);
  --color-popover: hsl(0 0% 100%);
  --color-popover-foreground: hsl(0 0% 9%);
  --color-primary: hsl(158 75% 22%);
  --color-primary-foreground: hsl(0 0% 100%);
  --color-secondary: hsl(158 30% 95%);
  --color-secondary-foreground: hsl(158 75% 18%);
  --color-muted: hsl(158 20% 94%);
  --color-muted-foreground: hsl(0 0% 40%);
  --color-accent: hsl(330 85% 60%);
  --color-accent-foreground: hsl(0 0% 100%);
  --color-destructive: hsl(0 84.2% 60.2%);
  --color-destructive-foreground: hsl(210 40% 98%);
  --color-border: hsl(158 20% 88%);
  --color-input: hsl(158 20% 88%);
  --color-ring: hsl(158 75% 22%);
  --font-sans: "Heebo", system-ui, sans-serif;
  --font-serif: "Lora", Georgia, serif;
}

@layer base {
  * {
    border-color: hsl(158 20% 88%);
  }
  body {
    @apply bg-background text-foreground font-sans;
  }
}

@media print {
  @page {
    margin: 0;
    size: auto;
  }
  body {
    -webkit-print-color-adjust: exact;
    background: white;
  }
}
````

## File: .cursorrules
````
מקור אמת: Maestro בלבד. See .cursor/rules/maestro-source.mdc
````

## File: firestore.indexes.json
````json
{
  "indexes": [
    {
      "collectionGroup": "proposals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "agreements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
````

## File: firestore.rules
````
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /proposals/{docId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow read, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update: if request.auth != null
        && request.auth.uid == resource.data.userId
        && request.resource.data.userId == resource.data.userId;
    }
    match /agreements/{docId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow read, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update: if request.auth != null
        && request.auth.uid == resource.data.userId
        && request.resource.data.userId == resource.data.userId;
    }
  }
}
````

## File: index.html
````html
<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>מערכת הצעות והסכמים</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
````

## File: postcss.config.cjs
````javascript
module.exports = {
    plugins: {
        '@tailwindcss/postcss': {},
    },
}
````

## File: vite.config.ts
````typescript
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "html2canvas": "html2canvas-pro",
        },
    },
    server: {
        port: 8085,
    },
});
````

## File: src/lib/firestore.ts
````typescript
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ProposalData, QuoteData } from '@/projects/types';

export type DocType = 'proposal' | 'agreement';
export type DocVariant = 'crm' | 'automation';

export interface SavedProposal {
  id: string;
  userId: string;
  variant: DocVariant;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  data: ProposalData;
}

export interface SavedAgreement {
  id: string;
  userId: string;
  variant: DocVariant;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  data: QuoteData;
}

function extractProposalData(raw: Record<string, unknown>): ProposalData {
  const { userId, variant, createdAt, updatedAt, ...data } = raw;
  void userId;
  void variant;
  void createdAt;
  void updatedAt;
  return data as unknown as ProposalData;
}

/** Recursively strip undefined values - Firestore rejects them */
function stripUndefined<T>(obj: T): T {
  if (obj === undefined) return obj;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) result[k] = stripUndefined(v);
  }
  return result as T;
}

const SAVE_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function extractQuoteData(raw: Record<string, unknown>): QuoteData {
  const { userId, variant, createdAt, updatedAt, ...data } = raw;
  void userId;
  void variant;
  void createdAt;
  void updatedAt;
  return data as unknown as QuoteData;
}

export async function saveProposal(
  userId: string,
  variant: DocVariant,
  data: ProposalData,
  docId?: string
): Promise<string> {
  const now = Timestamp.now();
  const payload = stripUndefined({
    userId,
    variant,
    createdAt: now,
    updatedAt: now,
    ...data,
  });
  if (docId) {
    await withTimeout(
      updateDoc(
        doc(db, 'proposals', docId),
        stripUndefined({ ...data, updatedAt: now }) as Record<string, unknown>
      ),
      SAVE_TIMEOUT_MS,
      'saveProposal updateDoc'
    );
    return docId;
  }
  const ref = await withTimeout(
    addDoc(collection(db, 'proposals'), payload),
    SAVE_TIMEOUT_MS,
    'saveProposal addDoc'
  );
  return ref.id;
}

export async function saveAgreement(
  userId: string,
  variant: DocVariant,
  data: QuoteData,
  docId?: string
): Promise<string> {
  const now = Timestamp.now();
  const payload = stripUndefined({
    userId,
    variant,
    createdAt: now,
    updatedAt: now,
    ...data,
  });
  if (docId) {
    await withTimeout(
      updateDoc(
        doc(db, 'agreements', docId),
        stripUndefined({ ...data, updatedAt: now }) as Record<string, unknown>
      ),
      SAVE_TIMEOUT_MS,
      'saveAgreement updateDoc'
    );
    return docId;
  }
  const ref = await withTimeout(
    addDoc(collection(db, 'agreements'), payload),
    SAVE_TIMEOUT_MS,
    'saveAgreement addDoc'
  );
  return ref.id;
}

export async function listProposals(userId: string): Promise<SavedProposal[]> {
  const q = query(
    collection(db, 'proposals'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => {
    const raw = d.data() as Record<string, unknown>;
    const { userId: u, variant: v, createdAt: c, updatedAt: ua } = raw;
    return {
      id: d.id,
      userId: u as string,
      variant: v as DocVariant,
      createdAt: c as Timestamp,
      updatedAt: ua as Timestamp,
      data: extractProposalData(raw),
    };
  });
  return docs;
}

export async function listAgreements(userId: string): Promise<SavedAgreement[]> {
  const q = query(
    collection(db, 'agreements'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => {
    const raw = d.data() as Record<string, unknown>;
    const { userId: u, variant: v, createdAt: c, updatedAt: ua } = raw;
    return {
      id: d.id,
      userId: u as string,
      variant: v as DocVariant,
      createdAt: c as Timestamp,
      updatedAt: ua as Timestamp,
      data: extractQuoteData(raw),
    };
  });
  return docs;
}

export async function deleteProposal(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'proposals', docId));
}

export async function deleteAgreement(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'agreements', docId));
}

export async function getProposal(docId: string): Promise<SavedProposal | null> {
  const d = await getDoc(doc(db, 'proposals', docId));
  if (!d.exists()) return null;
  const raw = d.data() as Record<string, unknown>;
  const { userId: u, variant: v, createdAt: c, updatedAt: ua } = raw;
  return {
    id: d.id,
    userId: u as string,
    variant: v as DocVariant,
    createdAt: c as Timestamp,
    updatedAt: ua as Timestamp,
    data: extractProposalData(raw),
  };
}

export async function getAgreement(docId: string): Promise<SavedAgreement | null> {
  const d = await getDoc(doc(db, 'agreements', docId));
  if (!d.exists()) return null;
  const raw = d.data() as Record<string, unknown>;
  const { userId: u, variant: v, createdAt: c, updatedAt: ua } = raw;
  return {
    id: d.id,
    userId: u as string,
    variant: v as DocVariant,
    createdAt: c as Timestamp,
    updatedAt: ua as Timestamp,
    data: extractQuoteData(raw),
  };
}
````

## File: src/projects/ProposalDocument.tsx
````typescript
import React from 'react';
import { ProposalData } from './types';
import { cn, formatDateDisplay } from '@/lib/utils';
import { Calendar, FileText, Package, Plus, DollarSign, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface ProposalDocumentProps {
  data: ProposalData;
  variant?: 'crm' | 'automation';
}

export const ProposalDocument: React.FC<ProposalDocumentProps> = ({ data, variant }) => {
  const variantLabel = variant === 'automation' ? 'אוטומציות' : 'CRM';
  return (
    <div
      className="w-[210mm] min-h-[297mm] mx-auto bg-white text-foreground shadow-2xl mb-8 text-right overflow-hidden relative print:shadow-none font-sans"
      dir="rtl"
    >
      {/* Header — sharp, editorial */}
      <header className="h-16 bg-primary w-full top-0 absolute print:block flex items-center justify-between px-6 pl-[20mm] pr-[20mm]" dir="ltr">
        <div className="flex items-center gap-2 text-sm text-white/90" dir="ltr">
          <Calendar size={14} className="text-white/70" strokeWidth={2.5} />
          <span>{formatDateDisplay(data.date)}</span>
        </div>
        <div className="flex items-center gap-3" dir="rtl">
          <div className="w-px h-6 bg-white/20" aria-hidden />
          <div className="bg-white/95 rounded-sm px-3 py-1.5 text-black">
            <Logo height="1.75rem" className="print:h-7" />
          </div>
        </div>
      </header>

      {/* Pink accent stripe — So Media brand */}
      <div className="h-0.5 w-full bg-accent top-16 absolute" aria-hidden />

      <div className="p-[20mm] pt-[26mm] relative z-10">
        {/* Meta block */}
        <div className="mb-10 space-y-2">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <p><strong className="font-semibold">לכבוד:</strong> {data.recipient || '_________'}</p>
            <p><strong className="font-semibold">מאת:</strong> {data.sender || '_________'}</p>
            <p><strong className="font-semibold">הנדון:</strong> {data.subject || '_________'}</p>
          </div>
        </div>

        {/* Title */}
        <div className="mb-10">
          <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight border-b-2 border-primary pb-2 inline-block">
            הצעת מחיר – {variantLabel}
          </h1>
        </div>

        {/* 1. מבוא ורציונל */}
        {data.intro && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <span className="text-primary font-serif font-bold">1.</span>
              מבוא ורציונל העבודה
              <FileText size={16} className="text-primary/70" strokeWidth={2} />
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed pr-8 border-r-2 border-primary/20">
              {data.intro}
            </p>
          </section>
        )}

        {/* 2. מפרט טכני */}
        {data.specSections.filter((s) => s.title || s.items.some((i) => i)).length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-foreground mb-3">
              <span className="text-primary font-serif font-bold">2.</span> המפרט הטכני
            </h2>
            <div className="space-y-4 pr-8 border-r-2 border-primary/20">
              {data.specSections.map(
                (sec, idx) =>
                  (sec.title || sec.items.some((i) => i)) && (
                    <div key={idx}>
                      {sec.title && <h3 className="font-semibold text-foreground text-sm mb-1">{sec.title}</h3>}
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {sec.items.filter(Boolean).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
            </div>
          </section>
        )}

        {/* 3. חבילות שירות */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="text-primary font-serif font-bold">3.</span>
            חבילות שירות
            <Package size={16} className="text-primary/70" strokeWidth={2} />
          </h2>
          <div className="space-y-4 pr-8 border-r-2 border-primary/20">
            {(data.basePackage.title || data.basePackage.items.some((i) => i)) && (
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{data.basePackage.title || 'חבילת בסיס'}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {data.basePackage.items.filter(Boolean).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.addOns.map(
              (addon, idx) =>
                (addon.title || addon.items.some((i) => i)) && (
                  <div key={idx}>
                    <h3 className="font-semibold text-foreground text-sm mb-1 flex items-center gap-1">
                      <Plus size={14} className="text-primary" strokeWidth={2.5} /> {addon.title || 'תוספת'}
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {addon.items.filter(Boolean).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )
            )}
          </div>
        </section>

        {/* 4. הצעת מחיר */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="text-primary font-serif font-bold">4.</span>
            הצעת מחיר
            <DollarSign size={16} className="text-primary/70" strokeWidth={2} />
          </h2>
          <div className="pr-8 border-r-2 border-primary/20 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-right p-3 bg-primary text-primary-foreground font-semibold border border-white/20">מסלול</th>
                  <th className="text-right p-3 bg-primary text-primary-foreground font-semibold border border-white/20">עלות הקמה (חד פעמי)</th>
                  <th className="text-right p-3 bg-primary text-primary-foreground font-semibold border border-white/20">עלות חודשית (ריטיינר)</th>
                  <th className="text-right p-3 bg-primary text-primary-foreground font-semibold border border-white/20">הערות</th>
                </tr>
              </thead>
              <tbody>
                {data.pricingRows.map((row, idx) => (
                  <tr key={idx} className={cn("border-b border-border", idx % 2 === 1 && "bg-secondary/50")}>
                    <td className="p-3 font-medium">{row.plan || '-'}</td>
                    <td className="p-3">{row.setupCost != null ? row.setupCost.toLocaleString() + ' ₪' : '-'}</td>
                    <td className="p-3">{row.monthlyCost != null ? row.monthlyCost.toLocaleString() + ' ₪' : '-'}</td>
                    <td className="p-3 text-muted-foreground">{row.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.taxNote && (
            <p className="text-xs text-muted-foreground mt-2 pr-8">{data.taxNote}</p>
          )}
        </section>

        {/* 5. דרישות תחילת עבודה */}
        {data.blockers.filter(Boolean).length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <span className="text-primary font-serif font-bold">5.</span>
              דרישות תחילת עבודה (Blockers)
              <AlertCircle size={16} className="text-primary/70" strokeWidth={2} />
            </h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pr-8 border-r-2 border-primary/20">
              {data.blockers.filter(Boolean).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-14 pt-6 border-t-2 border-primary/20 text-center">
          <p className="font-serif text-base font-semibold text-accent">בכבוד רב</p>
        </footer>
      </div>

      <div className="h-1.5 bg-primary w-full bottom-0 absolute print:block" aria-hidden />
    </div>
  );
};
````

## File: src/projects/TabNav.tsx
````typescript
import React from 'react';
import { cn } from '@/lib/utils';

export type TabId =
  | 'my-proposals'
  | 'proposal-crm'
  | 'proposal-automation'
  | 'agreement-crm'
  | 'agreement-automation';

const TABS: { id: TabId; label: string }[] = [
  { id: 'my-proposals', label: 'ההצעות שלי' },
  { id: 'proposal-crm', label: 'הצעת מחיר CRM' },
  { id: 'proposal-automation', label: 'הצעת מחיר אוטומציות' },
  { id: 'agreement-crm', label: 'הסכם CRM' },
  { id: 'agreement-automation', label: 'הסכם אוטומציות' },
];

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const TabNav: React.FC<TabNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="flex gap-1 border-b border-border bg-background" dir="rtl">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-4 py-3 text-sm font-medium rounded-t-md transition-colors -mb-px',
            activeTab === tab.id
              ? 'text-primary border-b-2 border-primary bg-white'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};
````

## File: src/projects/types.ts
````typescript
export interface ProposalData {
  date: string;
  recipient: string;
  sender: string;
  subject: string;
  intro: string;
  specSections: Array<{ title: string; items: string[] }>;
  basePackage: { title: string; items: string[] };
  addOns: Array<{
    title: string;
    items: string[];
  }>;
  pricingRows: Array<{
    plan: string;
    setupCost: number;
    monthlyCost: number | null;
    notes: string;
  }>;
  blockers: string[];
  taxNote: string;
}

export const defaultProposalData: ProposalData = {
  date: new Date().toISOString().split('T')[0],
  recipient: '',
  sender: '',
  subject: '',
  intro: '',
  specSections: [{ title: '', items: [''] }],
  basePackage: { title: 'חבילת בסיס', items: [''] },
  addOns: [{ title: '', items: [''] }],
  pricingRows: [{ plan: '', setupCost: 0, monthlyCost: null, notes: '' }],
  blockers: [''],
  taxNote: 'המחירים אינם כוללים מע״מ',
};

export interface QuoteData {
  date: string; // YYYY-MM-DD
  clientName: string;
  clientId: string; // H.P / T.Z
  developerName: string;
  developerId: string; // H.P / T.Z

  // Payment Model
  paymentModel: 'fixed' | 'hourly';

  // Fixed Price Details
  fixedPriceAmount: number;
  advancePaymentPercent: number;
  betaPaymentPercent: number;
  finalPaymentPercent: number;

  // Hourly Rate Details
  hourlyRate: number;
  estimatedHours: number;

  // Maintenance
  monthlyRetainerAmount: number;

  // Support
  supportHourlyRate: number;
  warrantyDays: number;

  // Advanced Terms
  timelineDays: number;
  cancellationTerms: string;
  clientObligations: string;
  browserSupport: string;
  exclusions: string;
}
````

## File: src/main.tsx
````typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from '@/contexts/AuthContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>,
)
````

## File: src/projects/QuoteDocument.tsx
````typescript
import React from 'react';
import { QuoteData } from './types';
import { agreementPresets } from './presets';
import { cn, formatDateDisplay } from '@/lib/utils';
import {
  Calendar, User, Building2, Check, CreditCard,
  Shield, Lock, FileSignature,
  Clock, Ban, Globe, Info, Crown
} from 'lucide-react';
import { Logo } from '@/components/Logo';

interface QuoteDocumentProps {
  data: QuoteData;
  variant?: 'crm' | 'automation';
}

export const QuoteDocument: React.FC<QuoteDocumentProps> = ({ data, variant = 'crm' }) => {
  const preset = agreementPresets[variant];
  return (
    <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-foreground shadow-2xl mb-8 text-right overflow-hidden relative print:shadow-none font-sans" dir="rtl">

      {/* Header — same as ProposalDocument: date left, logo right */}
      <header className="h-16 bg-primary w-full top-0 absolute print:block flex items-center justify-between px-6 pl-[20mm] pr-[20mm]" dir="ltr">
        <div className="flex items-center gap-2 text-sm text-white/90" dir="ltr">
          <Calendar size={14} className="text-white/70" strokeWidth={2.5} />
          <span>{formatDateDisplay(data.date)}</span>
        </div>
        <div className="flex items-center gap-3" dir="rtl">
          <div className="w-px h-6 bg-white/20" aria-hidden />
          <div className="bg-white/95 rounded-sm px-3 py-1.5 text-black">
            <Logo height="1.75rem" className="print:h-7" />
          </div>
        </div>
      </header>

      <div className="h-0.5 w-full bg-accent top-16 absolute" aria-hidden />

      <div className="p-[20mm] pt-[26mm] relative z-10">

        {/* Title Section */}
        <header className="text-center mb-12 relative">
          <div className="inline-block border-b-2 border-primary pb-2 mb-2">
            <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">
              הסכם התקשרות
            </h1>
          </div>
          <p className="text-lg text-muted-foreground font-medium">{preset.subtitle}</p>

          <div className="absolute top-0 left-0 text-xs text-muted-foreground border border-border p-2 rounded-sm bg-secondary print:hidden">
            מסמך עבודה
          </div>
        </header>

        {/* Parties Section */}
        <div className="mb-10 bg-secondary/70 p-6 rounded-sm border border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-primary" aria-hidden />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2 font-bold uppercase tracking-wider">
                <Building2 size={16} className="text-primary" strokeWidth={2} />
                צד א' (הלקוח)
              </div>
              <div className="text-xl font-bold text-foreground">
                {data.clientName || '________________'}
              </div>
              <div className="text-sm text-muted-foreground">
                ח.פ./ע.מ: <span className="font-mono font-medium">{data.clientId || '________'}</span>
              </div>
            </div>

            <div className="space-y-1 md:border-r md:pr-8 md:border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2 font-bold uppercase tracking-wider">
                <User size={16} className="text-primary" strokeWidth={2} />
                שם הספק
              </div>
              <div className="text-xl font-bold text-foreground">
                {data.developerName || '________________'}
              </div>
              <div className="text-sm text-muted-foreground">
                ת.ז/ח.פ: <span className="font-mono font-medium">{data.developerId || '________'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">

          <Section number="1" title={preset.section1Title} icon={<CreditCard size={16} className="text-primary/70" strokeWidth={2} />}>
            <p className="leading-relaxed text-muted-foreground">
              {preset.section1Content}
            </p>
          </Section>

          <Section number="2" title={preset.section2Title} icon={<Lock size={16} className="text-primary/70" strokeWidth={2} />}>
            <div className="grid gap-4">
              <PaymentOption
                selected={data.paymentModel === 'fixed'}
                title="אפשרות א': מחיר פרויקטלי גלובלי (Fixed Price)"
              >
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-bold min-w-24 text-foreground">עלות כוללת:</span>
                    <span>הלקוח ישלם סכום סופי של <span className="font-mono font-bold text-lg bg-accent/10 text-accent border border-accent/30 px-1 rounded-sm">{data.fixedPriceAmount?.toLocaleString() || '_________'}</span> ₪ + מע"מ עבור פיתוח המערכת לפי האפיון.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold min-w-24 text-foreground">אבני דרך:</span>
                    <span>תשלום מקדמה ({data.advancePaymentPercent}%) עם החתימה; תשלום בטא ({data.betaPaymentPercent}%) עם הצגת גרסת בדיקה; יתרה ({data.finalPaymentPercent}%) עם מסירת הקוד והעלאה לאוויר.</span>
                  </li>
                </ul>
              </PaymentOption>

              <PaymentOption
                selected={data.paymentModel === 'hourly'}
                title="אפשרות ב': ריטיינר שעות עבודה (Hourly Rate)"
              >
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-bold min-w-24 text-foreground">תעריף שעה:</span>
                    <span><span className="font-mono font-bold text-lg bg-accent/10 text-accent border border-accent/30 px-1 rounded-sm">{data.hourlyRate?.toLocaleString() || '_________'}</span> ₪ + מע"מ.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold min-w-24 text-foreground">הערכת שעות:</span>
                    <span>המערכת מוערכת בכ-<span className="font-bold">{data.estimatedHours?.toLocaleString() || '_________'}</span> שעות עבודה.</span>
                  </li>
                </ul>
              </PaymentOption>
            </div>
          </Section>

          <Section number="3" title="לוחות זמנים ושיתוף פעולה" icon={<Clock size={16} className="text-primary/70" strokeWidth={2} />}>
            <div className="bg-secondary/50 p-4 rounded-sm border border-border space-y-3">
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span className="font-bold text-foreground min-w-28">לוחות זמנים:</span>
                <span>פיתוח המערכת מוערך בכ-<span className="font-bold">{data.timelineDays || '___'}</span> ימי עבודה מרגע העמדת כל החומרים ע"י הלקוח.</span>
              </div>
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span className="font-bold text-foreground min-w-28">שיתוף פעולה:</span>
                <span>{data.clientObligations}</span>
              </div>
            </div>
          </Section>

          <div className="break-inside-avoid">
            <Section number="4" title="תחזוקה, תמיכה וניהול ענן" icon={<Shield size={16} className="text-primary/70" strokeWidth={2} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-secondary/50 p-4 rounded-sm border border-border">
                  <h3 className="font-bold text-foreground mb-2 border-b border-border pb-1">א. דמי ניהול תשתיות</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>ריטיינר: <span className="font-bold text-foreground">{data.monthlyRetainerAmount?.toLocaleString() || '0'} ₪</span> + מע"מ.</li>
                    <li>כולל: ניהול תשתיות ענן, ניטור וגיבויים.</li>
                  </ul>
                </div>
                <div className="bg-secondary/50 p-4 rounded-sm border border-border">
                  <h3 className="font-bold text-foreground mb-2 border-b border-border pb-1">ב. אחריות ובאגים</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>תיקון באגים חינם למשך {data.warrantyDays} יום.</li>
                    <li>תמיכה בחריגה: <span className="font-bold text-foreground">{data.supportHourlyRate?.toLocaleString() || '0'} ₪</span> לשעה.</li>
                  </ul>
                </div>
              </div>
            </Section>
          </div>

          {/* IP OWNERSHIP - SPECIALLY EMPHASIZED */}
          <Section number="5" title="קניין רוחני ובעלות" icon={<Crown size={16} className="text-primary/70" strokeWidth={2} />}>
            <div className="p-4 bg-primary/5 border-2 border-primary/30 rounded-sm">
              <p className="font-bold text-lg mb-2 flex items-center gap-2 text-primary">
                <Check className="text-primary" size={20} strokeWidth={3} />
                בעלות מלאה ללקוח
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                עם פירעון מלא של כל התשלומים, <span className="font-bold underline text-foreground">הלקוח יקבל בעלות מלאה ובלעדית</span> על {preset.section5Content}
              </p>
              <p className="text-xs mt-2 text-muted-foreground italic">
                * החרגת אחריות: במידה והלקוח יבצע שינוי כלשהו בקוד עצמאית, אחריות הספק תפוג מיידית.
              </p>
            </div>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 break-inside-avoid">
            <Section number="6" title="תנאי ביטול" icon={<Ban size={16} className="text-primary/70" strokeWidth={2} />}>
              <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-sm italic border-r-2 border-border">
                {data.cancellationTerms}
              </p>
            </Section>
            <Section number="7" title="דפדפנים והחרגות" icon={<Globe size={16} className="text-primary/70" strokeWidth={2} />}>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><span className="font-bold text-foreground">תמיכה:</span> {data.browserSupport}</li>
                <li><span className="font-bold text-foreground">לא כלול:</span> {data.exclusions}</li>
              </ul>
            </Section>
          </div>

          <Section number="8" title="הגבלת אחריות" icon={<Info size={16} className="text-primary/70" strokeWidth={2} />}>
            <p className="text-sm text-muted-foreground">
              אחריות הספק לכל נזק מוגבלת לתקרה של הסכום ששולם לו בפועל. הספק לא יהיה אחראי לנזקים עקיפים, אובדן נתונים או הפסד הכנסה.
            </p>
          </Section>

          <div className="mt-16 pt-8 border-t-2 border-border break-inside-avoid">
            <h3 className="text-center font-serif text-xl font-bold mb-12 text-accent">ולראיה באו הצדדים על החתום</h3>

            <div className="flex justify-between items-end px-12 pb-8">
              <div className="text-center">
                <FileSignature className="mx-auto mb-2 text-border" size={40} strokeWidth={1} />
                <div className="w-64 border-b-2 border-foreground mb-3 h-12" />
                <div className="font-bold text-foreground">חתימת הספק</div>
              </div>
              <div className="text-center">
                <FileSignature className="mx-auto mb-2 text-border" size={40} strokeWidth={1} />
                <div className="w-64 border-b-2 border-foreground mb-3 h-12" />
                <div className="font-bold text-foreground">חתימת הלקוח</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="h-1.5 bg-primary w-full bottom-0 absolute print:block" aria-hidden />
    </div>
  );
};

const Section: React.FC<{ number: string; title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ number, title, children, icon }) => (
  <section className="relative">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-7 h-7 rounded-sm bg-primary text-primary-foreground flex items-center justify-center font-bold font-serif shrink-0 text-xs">
        {number}
      </div>
      <h2 className="text-base font-bold text-foreground flex items-center gap-2">
        {title}
        {icon}
      </h2>
    </div>
    <div className="pr-8 text-muted-foreground h-full border-r-2 border-border mr-3">
      {children}
    </div>
  </section>
);

const PaymentOption: React.FC<{ selected: boolean; title: string; children: React.ReactNode }> = ({ selected, title, children }) => (
  <div className={cn(
    "relative p-4 rounded-sm border-2 flex flex-col gap-2 transition-colors",
    selected ? "border-primary bg-white" : "border-border bg-secondary/30 opacity-60 overflow-hidden"
  )}>
    {selected && (
      <div className="absolute top-2 left-2 text-primary">
        <Check size={18} strokeWidth={3} />
      </div>
    )}
    <h3 className={cn("font-bold text-sm", selected ? "text-foreground" : "text-muted-foreground")}>
      {title}
    </h3>
    <div className={selected ? "block" : "hidden"}>
      {children}
    </div>
    {!selected && <div className="text-xs text-muted-foreground">(לא נבחר)</div>}
  </div>
);
````

## File: package.json
````json
{
  "name": "proposal-generator",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "create-user": "node scripts/create-user.js",
    "build": "tsc && vite build",
    "deploy:rules": "firebase deploy --only firestore:rules",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "firebase": "^12.9.0",
    "html2canvas-pro": "^2.0.2",
    "html2pdf.js": "^0.14.0",
    "lucide-react": "^0.563.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "tailwind-merge": "^3.4.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.2.0",
    "@types/react": "^19.2.11",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.3",
    "autoprefixer": "^10.4.24",
    "firebase-admin": "^13.6.1",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.18",
    "typescript": "^5.9.3",
    "vite": "^7.3.1"
  }
}
````

## File: src/projects/MyProposalsPage.tsx
````typescript
import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  listProposals,
  listAgreements,
  deleteProposal,
  deleteAgreement,
  type SavedProposal,
  type SavedAgreement,
} from '@/lib/firestore';
import type { DocVariant } from '@/lib/firestore';

function formatVariant(variant: DocVariant): string {
  return variant === 'automation' ? 'אוטומציות' : 'CRM';
}

type DocItem = SavedProposal | SavedAgreement;

function isProposal(d: DocItem): d is SavedProposal {
  return 'recipient' in (d as SavedProposal).data;
}

export interface EditItemDoc {
  id: string;
  type: 'proposal' | 'agreement';
  variant: DocVariant;
  data: unknown;
}

interface MyProposalsPageProps {
  onEditItem: (doc: EditItemDoc) => void;
}

export function MyProposalsPage({ onEditItem }: MyProposalsPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DocItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadItems = useCallback(async (): Promise<DocItem[]> => {
    if (!user?.uid) return [];
    const [proposals, agreements] = await Promise.all([
      listProposals(user.uid),
      listAgreements(user.uid),
    ]);
    return [...proposals, ...agreements].sort(
      (a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0)
    );
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    setLoading(true);
    loadItems()
      .then((merged) => {
        if (!cancelled) {
          setItems(merged);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid, loadItems]);

  const handleDelete = async (e: React.MouseEvent, doc: DocItem) => {
    e.stopPropagation();
    if (!window.confirm('האם למחוק?')) return;
    setDeletingId(doc.id);
    setError(null);
    try {
      if (isProposal(doc)) {
        await deleteProposal(doc.id);
      } else {
        await deleteAgreement(doc.id);
      }
      setItems((prev) => prev.filter((item) => item.id !== doc.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'לא ניתן למחוק');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClick = (doc: DocItem) => {
    const type = isProposal(doc) ? 'proposal' : 'agreement';
    onEditItem({
      id: doc.id,
      type,
      variant: doc.variant,
      data: doc.data,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div
          className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin"
          role="status"
          aria-label="טוען"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6" dir="rtl">
        <p className="text-destructive text-center py-4">
          שגיאה בטעינה: {error}
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setLoading(true);
              loadItems()
                .then((merged) => {
                  setItems(merged);
                  setError(null);
                })
                .catch((e) => setError(e instanceof Error ? e.message : String(e)))
                .finally(() => setLoading(false));
            }}
            className="text-primary underline"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8" dir="rtl">
        <div className="max-w-md mx-auto text-center py-16 px-6 rounded-xl border border-dashed border-border bg-muted/30">
          <p className="text-muted-foreground text-base leading-relaxed">
            אין הצעות שמורות.
          </p>
          <p className="text-muted-foreground/90 text-sm mt-1">
            צור הצעה חדשה בטאבים למעלה.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-right py-3.5 px-4 text-sm font-semibold text-foreground">סוג</th>
              <th className="text-right py-3.5 px-4 text-sm font-semibold text-foreground">גרסה</th>
              <th className="text-right py-3.5 px-4 text-sm font-semibold text-foreground">נמען / לקוח</th>
              <th className="text-right py-3.5 px-4 text-sm font-semibold text-foreground">תאריך</th>
              <th className="w-12 py-3.5 px-4" aria-label="מחק" />
            </tr>
          </thead>
          <tbody>
            {items.map((doc) => {
              const type = isProposal(doc) ? 'proposal' : 'agreement';
              const name = isProposal(doc)
                ? (doc as SavedProposal).data.recipient
                : (doc as SavedAgreement).data.clientName;
              const date = doc.updatedAt?.toDate?.() ?? new Date();
              return (
                <tr
                  key={`${type}-${doc.id}`}
                  className="border-b border-border last:border-b-0 hover:bg-muted/60 cursor-pointer transition-colors duration-200"
                  onClick={() => handleClick(doc)}
                >
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                        type === 'proposal'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent/15 text-accent'
                      )}
                    >
                      {type === 'proposal' ? 'הצעה' : 'הסכם'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium text-muted-foreground',
                        doc.variant === 'automation' ? 'bg-muted' : 'bg-secondary/60'
                      )}
                    >
                      {formatVariant(doc.variant)}
                    </span>
                  </td>
                  <td className="py-3 px-4">{name || '—'}</td>
                  <td className="py-3 px-4">
                    {date.toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, doc)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors disabled:opacity-50"
                      aria-label="מחק"
                    >
                      {deletingId === doc.id ? (
                        <span className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
````

## File: src/projects/ProposalPage.tsx
````typescript
import React, { useRef, useState } from 'react';
import { ProposalForm } from './ProposalForm';
import { ProposalDocument } from './ProposalDocument';
import { defaultProposalData, type ProposalData } from './types';
import { Button } from '@/components/ui/button';
import { FileDown, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEdit } from '@/contexts/EditContext';
import { saveProposal } from '@/lib/firestore';
import html2pdf from 'html2pdf.js';

interface ProposalPageProps {
  variant: 'crm' | 'automation';
  initialData?: ProposalData;
  docId?: string;
}

const ProposalPage: React.FC<ProposalPageProps> = ({
  variant,
  initialData,
  docId: initialDocId,
}) => {
  const { user } = useAuth();
  const { setEditingDoc } = useEdit();
  const [data, setData] = useState<ProposalData>(
    () => initialData ?? defaultProposalData
  );
  const [docId, setDocId] = useState<string | null>(() => initialDocId ?? null);
  const [saveMessage, setSaveMessage] = useState<'success' | 'error' | 'timeout' | null>(
    null
  );
  const [saveErrorDetail, setSaveErrorDetail] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleSavePdf = async () => {
    const el = pdfRef.current;
    if (!el) return;
    setIsExportingPdf(true);
    try {
      const filename = `הצעה-${data.recipient || 'מסמך'}-${data.date || 'ללא-תאריך'}.pdf`;
      await html2pdf().set({
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(el).save();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSave = async () => {
    if (!user?.uid) {
      setSaveMessage('error');
      return;
    }
    setSaveMessage(null);
    setSaveErrorDetail('');
    setIsSaving(true);
    try {
      const id = await saveProposal(user.uid, variant, data, docId ?? undefined);
      if (!docId) setDocId(id);
      setEditingDoc(null);
      setSaveMessage('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('שגיאה בשמירת הצעה:', err);
      setSaveErrorDetail(msg);
      setSaveMessage(msg.includes('timed out') ? 'timeout' : 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <header className="bg-white border-b sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-800">מערכת הצעות והסכמים</h1>
          <div className="flex items-center gap-2">
            {saveMessage === 'success' && (
              <span className="text-sm text-green-600">נשמר בהצלחה</span>
            )}
            {saveMessage === 'error' && (
              <span className="text-sm text-red-600 max-w-xs truncate block" title={saveErrorDetail}>
                {user
                  ? `שגיאה: ${saveErrorDetail}`
                  : 'יש להתחבר כדי לשמור'}
              </span>
            )}
            {saveMessage === 'timeout' && (
              <span className="text-sm text-red-600">
                חיבור איטי – בדוק אינטרנט ונסה שוב
              </span>
            )}
            <Button
              onClick={handleSave}
              variant="outline"
              className="gap-2"
              disabled={isSaving || !user?.uid}
            >
              <Save size={16} className={isSaving ? 'animate-pulse' : undefined} />
              {isSaving ? 'שומר...' : 'שמור'}
            </Button>
            <Button
              onClick={handleSavePdf}
              className="gap-2"
              disabled={isExportingPdf}
            >
              <FileDown size={16} className={isExportingPdf ? 'animate-pulse' : undefined} />
              {isExportingPdf ? 'מוריד...' : 'שמירה כ-PDF'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 gap-8 grid grid-cols-1 lg:grid-cols-12 print:block print:p-0">
        <div className="lg:col-span-4 space-y-4 print:hidden h-fit sticky top-24 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <ProposalForm data={data} onChange={setData} />
        </div>

        <div className="lg:col-span-8 print:w-full print:absolute print:top-0 print:left-0 print:m-0">
          <div className="print:hidden mb-4 text-sm text-gray-500 text-center">
            תצוגה מקדימה (גודל A4)
          </div>
          <div className="flex justify-center">
            <div ref={pdfRef}>
              <ProposalDocument data={data} variant={variant} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProposalPage;
````

## File: .gitignore
````
# Dependencies
node_modules/

# Worktrees
.worktrees/

# Build
dist/
*.local

# Logs
logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor
.vscode/*
!.vscode/extensions.json
.idea
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.local
.env.*.local

# Firebase service account (never commit!)
*serviceAccount*.json
*service-account*.json

# TypeScript
*.tsbuildinfo
.cursor/
.claude/settings.local.json
.claude/worktrees/
.fuse_hidden*

# Brainstorming visual companion
.superpowers/
````

## File: README.md
````markdown
# proposal-generator

```bash
npm install && npm run dev
```

http://localhost:8085

**כל התיעוד בכספת:** Maestro `02-projects/proposal-generator`
````

## File: src/projects/QuotePage.tsx
````typescript
import React, { useRef, useState } from 'react';
import { QuoteForm } from './QuoteForm';
import { QuoteDocument } from './QuoteDocument';
import { QuoteData } from './types';
import { Button } from '@/components/ui/button';
import { FileDown, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEdit } from '@/contexts/EditContext';
import { saveAgreement } from '@/lib/firestore';
import html2pdf from 'html2pdf.js';

const defaultQuoteData: QuoteData = {
  date: new Date().toISOString().split('T')[0],
  clientName: '',
  clientId: '',
  developerName: '',
  developerId: '',
  paymentModel: 'fixed',
  fixedPriceAmount: 0,
  advancePaymentPercent: 30,
  betaPaymentPercent: 40,
  finalPaymentPercent: 30,
  hourlyRate: 0,
  estimatedHours: 0,
  monthlyRetainerAmount: 0,
  supportHourlyRate: 0,
  warrantyDays: 30,
  timelineDays: 30,
  cancellationTerms:
    'במקרה של ביטול ביוזמת הלקוח, המקדמה לא תוחזר והלקוח ישלם עבור שעות העבודה שבוצעו בפועל.',
  clientObligations:
    'הלקוח מתחייב להעמיד לרשות הספק את כל המידע והגישות הנדרשים תוך 7 ימים.',
  browserSupport: 'Chrome, Safari, Edge (גרסאות אחרונות)',
  exclusions: 'הזנת תכנים, עיצוב גרפי של מותג, רכישת דומיינים.',
};

interface QuotePageProps {
  variant?: 'crm' | 'automation';
  initialData?: QuoteData;
  docId?: string;
}

const QuotePage: React.FC<QuotePageProps> = ({
  variant = 'crm',
  initialData,
  docId: initialDocId,
}) => {
  const { user } = useAuth();
  const { setEditingDoc } = useEdit();
  const [data, setData] = useState<QuoteData>(() => initialData ?? defaultQuoteData);
  const [docId, setDocId] = useState<string | null>(() => initialDocId ?? null);
  const [saveMessage, setSaveMessage] = useState<'success' | 'error' | 'timeout' | null>(null);
  const [saveErrorDetail, setSaveErrorDetail] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleSavePdf = async () => {
    const el = pdfRef.current;
    if (!el) return;
    setIsExportingPdf(true);
    try {
      await html2pdf().set({
        margin: 0,
        filename: `הסכם-${data.clientName || 'מסמך'}-${data.date || 'ללא-תאריך'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(el).save();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSave = async () => {
    if (!user?.uid) {
      setSaveMessage('error');
      return;
    }
    setSaveMessage(null);
    setSaveErrorDetail('');
    setIsSaving(true);
    try {
      const id = await saveAgreement(user.uid, variant, data, docId ?? undefined);
      if (!docId) setDocId(id);
      setEditingDoc(null);
      setSaveMessage('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('שגיאה בשמירת הסכם:', err);
      setSaveErrorDetail(msg);
      setSaveMessage(msg.includes('timed out') ? 'timeout' : 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header - Hidden on print */}
      <header className="bg-white border-b sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-800">מערכת הצעות והסכמים</h1>
          <div className="flex items-center gap-2">
            {saveMessage === 'success' && (
              <span className="text-sm text-green-600">נשמר בהצלחה</span>
            )}
            {saveMessage === 'error' && (
              <span className="text-sm text-red-600 max-w-xs truncate block" title={saveErrorDetail}>
                {user ? `שגיאה: ${saveErrorDetail}` : 'יש להתחבר כדי לשמור'}
              </span>
            )}
            {saveMessage === 'timeout' && (
              <span className="text-sm text-red-600">
                חיבור איטי – בדוק אינטרנט ונסה שוב
              </span>
            )}
            <Button
              onClick={handleSave}
              variant="outline"
              className="gap-2"
              disabled={isSaving || !user?.uid}
            >
              <Save size={16} className={isSaving ? 'animate-pulse' : undefined} />
              {isSaving ? 'שומר...' : 'שמור'}
            </Button>
            <Button
              onClick={handleSavePdf}
              className="gap-2"
              disabled={isExportingPdf}
            >
              <FileDown size={16} className={isExportingPdf ? 'animate-pulse' : undefined} />
              {isExportingPdf ? 'מוריד...' : 'שמירה כ-PDF'}
            </Button>
          </div>
        </div>
      </header>

            <main className="max-w-[1600px] mx-auto p-8 gap-8 grid grid-cols-1 lg:grid-cols-12 print:block print:p-0">
                {/* Form Section - Takes 4 columns, hidden on print */}
                <div className="lg:col-span-4 space-y-4 print:hidden h-fit sticky top-24 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    <QuoteForm data={data} onChange={setData} />
                </div>

                {/* Document Preview Section - Takes 8 columns, full width on print */}
                <div className="lg:col-span-8 print:w-full print:absolute print:top-0 print:left-0 print:m-0">
                    <div className="print:hidden mb-4 text-sm text-gray-500 text-center">
                        תצוגה מקדימה (גודל A4)
                    </div>
                    <div className="flex justify-center">
                        <div ref={pdfRef}>
                            <QuoteDocument data={data} variant={variant} />
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default QuotePage;
````

## File: src/App.tsx
````typescript
import React, { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EditProvider, useEdit } from '@/contexts/EditContext';
import { LoginPage } from './projects/LoginPage';
import QuotePage from './projects/QuotePage';
import ProposalPage from './projects/ProposalPage';
import { MyProposalsPage } from './projects/MyProposalsPage';
import { TabNav, type TabId } from './projects/TabNav';
import type { ProposalData, QuoteData } from './projects/types';
import type { DocVariant } from '@/lib/firestore';

function getTabForDoc(
  type: 'proposal' | 'agreement',
  variant: DocVariant
): Exclude<TabId, 'my-proposals'> {
  switch (type) {
    case 'proposal':
      return variant === 'automation' ? 'proposal-automation' : 'proposal-crm';
    case 'agreement':
      return variant === 'automation' ? 'agreement-automation' : 'agreement-crm';
    default: {
      const _: never = type;
      return _;
    }
  }
}

function AuthenticatedContent() {
  const { logout } = useAuth();
  const { editingDoc, setEditingDoc } = useEdit();
  const [activeTab, setActiveTab] = useState<TabId>('my-proposals');

  const onTabChange = useCallback(
    (tab: TabId) => {
      setEditingDoc(null);
      setActiveTab(tab);
    },
    [setEditingDoc]
  );

  const onEditItem = useCallback(
    (doc: { id: string; type: 'proposal' | 'agreement'; variant: DocVariant; data: unknown }) => {
      setEditingDoc({
        id: doc.id,
        type: doc.type,
        variant: doc.variant,
        data: doc.data as ProposalData | QuoteData,
      });
      setActiveTab(getTabForDoc(doc.type, doc.variant));
    },
    [setEditingDoc]
  );

  if (activeTab === 'my-proposals') {
    return (
      <div className="min-h-screen bg-muted/20">
        <div className="print:hidden border-b border-border bg-secondary/30">
          <header
            className="flex justify-between items-center px-6 py-3"
            dir="rtl"
          >
            <h1 className="text-xl font-semibold text-primary">מערכת הצעות והסכמים</h1>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-md transition-colors duration-200"
            >
              התנתק
            </button>
          </header>
          <TabNav activeTab={activeTab} onTabChange={onTabChange} />
        </div>
        <MyProposalsPage onEditItem={onEditItem} />
      </div>
    );
  }

  const isProposal = activeTab.startsWith('proposal-');
  const variant =
    activeTab === 'proposal-automation' || activeTab === 'agreement-automation'
      ? 'automation'
      : 'crm';

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="print:hidden border-b border-border bg-secondary/30">
        <header
          className="flex justify-between items-center px-6 py-3"
          dir="rtl"
        >
          <h1 className="text-xl font-semibold text-primary">מערכת הצעות והסכמים</h1>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-md transition-colors duration-200"
          >
            התנתק
          </button>
        </header>
        <TabNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>
      {isProposal ? (
        <ProposalPage
          variant={variant}
          {...(editingDoc?.type === 'proposal' && editingDoc.variant === variant
            ? {
                initialData: editingDoc.data as ProposalData,
                docId: editingDoc.id,
              }
            : {})}
        />
      ) : (
        <QuotePage
          variant={variant}
          {...(editingDoc?.type === 'agreement' && editingDoc.variant === variant
            ? {
                initialData: editingDoc.data as QuoteData,
                docId: editingDoc.id,
              }
            : {})}
        />
      )}
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        טוען...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <EditProvider>
      <AuthenticatedContent />
    </EditProvider>
  );
}

export default App;
````