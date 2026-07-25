# XSHEVA Proposal Kit — Refactor Design

> Date: 2026-07-25 · Status: approved-pending-review · Owner: Kobi Hazout (XSHEVA)

## 1. Context

This repo is a React 19 + Firebase web app that generated proposals/quotes via forms,
rendered them with `ProposalDocument`/`QuoteDocument`, and saved them in Firestore. That
workflow is retired. The cabinet already records the pivot (`project.proposal-generator.md`,
"Corrected 2026-07-23"): the UI is unused, and proposals are now drafted **in chat** using
the **XSHEVA design system**, taking inspiration from real past proposals.

The problem: the valuable output — the XSHEVA-branded document and its reusable "rules"
(payment milestones, SLA, security model, ROI, risk) — lives **only inside exported PDFs**.
There is no saved template and no centralized example library, so every new proposal
re-improvises the design and the terms.

### Evidence gathered
- Recent examples: `proposal-rav-bariach-xsheva.pdf` (8 pages) and
  `הצעת-מחיר-מפת-מעקב-ללמד-AI.pdf` (3 pages).
- **Confirmed production pipeline (from PDF metadata):** Producer `Skia/PDF`, Creator
  `HeadlessChrome/149`, Title `proposal_build.html`, page size A4 (595×842pt). i.e. a
  self-contained HTML file rendered to PDF by headless Chrome.
- XSHEVA brand (from `cabinet/projects/website/docs/xsheva-project-analysis.md`):
  black `#000` / white `#FFF` / neon-orange `#FF6B35`; Space Grotesk (headings) + Inter
  (body); tagline "Multiply Everything"; tone direct, minimalist, confident.
- Reusable structure observed in the Rav Bariach doc: intro & rationale → technical
  approach → data-security hybrid model (self-hosted VPS + Anthropic API) → roadmap /
  milestones table → payment milestones (25/25/25/25 % + ₪) → annual-savings ROI calc →
  risk table (severity / mitigation / verification) → SLA terms (response / uptime).

## 2. Goals
- Replace the app-based workflow with a **skill** that turns client requirements into an
  XSHEVA-branded document.
- **Centralize** the design system, a reusable rules library, and a redacted example
  library so every draft starts from proven material.
- Cover **both** document types: strategic **proposal** (הצעת מחיר) and formal
  **agreement/contract** (payment model, warranty, cancellation).
- Remove Firebase entirely (no Auth, Firestore, hosting, or CI push).

## 3. Non-goals
- Re-skinning the React components to XSHEVA. The React renderer is kept runnable but is a
  legacy/local-preview path, **not** the XSHEVA output engine.
- Any hosted service, database, or e-signature (Documenso complements later, out of scope).
- Client-facing UI. This is a personal drafting workflow.

## 4. Decisions (locked with user)
| # | Decision |
|---|----------|
| 1 | **Teardown:** strip Firebase; keep the React renderer runnable Firebase-free. |
| 2 | **Location:** skill lives in this repo's `.claude/skills/xsheva-proposal/`. |
| 3 | **Output:** self-contained HTML → headless-Chrome → A4 PDF (the proven pipeline). |
| 4 | **Doc types:** build **both** proposal and agreement variants now. |
| 5 | **Examples:** **redact** client names and ₪ amounts to placeholders; keep structure/rules. |

## 5. Repo end-state

### 5a. Delete (Firebase + dead app surface)
- `src/lib/firebase.ts`, `src/lib/firestore.ts`
- `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `.firebaserc`
- `src/contexts/AuthContext.tsx`, `src/projects/LoginPage.tsx`, `src/projects/MyProposalsPage.tsx`
- Firebase dependency from `package.json` / lockfile
- The GitHub Actions workflow that pushes to Firebase / runs post-deploy cabinet update
- Firebase env keys from `.env.example`

### 5b. Keep (Firebase-free local preview)
- `src/projects/ProposalDocument.tsx`, `QuoteDocument.tsx`, `ProposalForm.tsx`,
  `QuoteForm.tsx`, `ProposalPage.tsx`, `QuotePage.tsx`, `TabNav.tsx`, `EditContext.tsx`,
  `src/components/**`.
- Wire pages to **local-only** state (no save/load, no auth). Remove save/list/delete
  buttons and any import of the deleted Firebase/auth modules so `npm run dev` still builds.
- `App.tsx` routing trimmed to the two preview pages (no login gate, no "my proposals").

### 5c. Add — the skill
```
.claude/skills/xsheva-proposal/
  SKILL.md                       # trigger, intake checklist, end-to-end workflow
  brand/
    xsheva-design-system.md      # colors, fonts, spacing, logo, header/footer, confidential stamp
  template/
    proposal.html                # XSHEVA A4 RTL HTML template (rebuilt from example PDFs)
    agreement.html               # formal agreement/contract variant
    render.sh                    # headless-Chrome HTML → A4 PDF one-liner (documented)
  rules/
    section-structure.md         # canonical sections + when to include each
    payment-milestones.md        # 25/25/25/25 model + variants
    sla-terms.md                 # response / uptime boilerplate
    security-hybrid-model.md     # self-hosted VPS + Anthropic API boilerplate
    roi-and-risk.md              # annual-savings calc + risk-table pattern
  examples/
    rav-bariach/                 # extracted text, REDACTED (placeholders for name + ₪)
    ai-tracking-map/             # extracted text, REDACTED
```

## 6. Skill workflow (`SKILL.md`)
Input: client requirements. Steps:
1. **Intake checklist** — client name, industry, problem, scope, self-host vs cloud,
   pricing intent, validity date, doc type (proposal | agreement).
2. **Assemble** — load `brand/`, the matching `template/`, relevant `rules/`, and the
   closest `examples/`.
3. **Draft** — section-by-section, Hebrew RTL, XSHEVA voice; apply the payment/SLA/
   security/ROI/risk rules where relevant.
4. **Fill** the template → `proposal_build.html`.
5. **Render** → A4 PDF via `template/render.sh` (headless Chrome). Deliver the PDF; save
   nothing to any DB.

## 7. Rendering pipeline
Formalizes the confirmed method: a self-contained HTML file (inline CSS, brand tokens,
`@page { size: A4 }`, RTL) printed by the machine's Chrome/Chromium in headless mode.
`render.sh` documents the exact command; Playwright MCP is an available fallback.

## 8. Redaction approach (examples)
For each example: extract text, replace client name → `«CLIENT»`, ₪ figures →
`«AMOUNT»` / percentages kept, any personal contact → placeholder. Preserve section
structure, rule patterns, and phrasing so examples remain useful as drafting references.
Store as `.md` alongside a note pointing to the original PDF location (kept out of the repo).

## 9. Testing / verification
- `npm run build` + `npm run dev` succeed with **zero** Firebase/auth imports remaining
  (grep for `firebase`, `firestore`, `AuthContext` → no hits in `src/`).
- The skill produces a filled `proposal_build.html` and a valid A4 PDF for a sample brief;
  PDF text is extractable (ATS-safe) and layout has no overflow.
- Both `proposal.html` and `agreement.html` render end-to-end from a sample intake.
- Examples in `examples/` contain no real ₪ amounts or client names (grep check).

## 10. Open items
- None blocking. The `references/` repomix codebase snapshot under the existing skill can be
  dropped or regenerated after teardown (it references deleted files) — decide during
  implementation.
