# Proposal Kit — Refactor Design (So Media + XSHEVA)

> Date: 2026-07-25 · Status: approved-pending-review · Owner: Kobi Hazout

## 1. Context

This repo is a React 19 + Firebase web app that generated proposals/quotes via forms,
rendered them with `ProposalDocument`/`QuoteDocument`, and saved them in Firestore. That
UI workflow is retired (cabinet `project.proposal-generator.md`, "Corrected 2026-07-23").
Proposals are now drafted **in chat** and exported to PDF. The valuable output — the branded
document and its reusable "rules" (payment, SLA, IP, warranty, etc.) — lives **only inside
exported PDFs**. There is no saved template and no centralized example library.

### Key discovery: there are TWO product lines, each with proposal + agreement
| Line | "From" / entity | Service | Design | HTML source seen |
|------|-----------------|---------|--------|------------------|
| **So Media** (Kobi as So Media's supplier) | "מאת SoMedia CRM" · סו מדיה בע״מ ח.פ 516759149 | Lead automation — "מוח לידים חכם / The Brain": capture, cleaning, dedup, retry; iPlan integration; WordPress + Meta webhooks | Pink-accent — **identical to the current React `ProposalDocument`/`QuoteDocument`** | `somedia-proposal.html`, `somedia-agreement.html`, `proposal.html`, `agreement.html` |
| **XSHEVA** (Kobi direct) | "מוגש ע״י Kobi Hazout · XSHEVA" | Strategic AI architecture — Priority ERP integration, workflow automation; heavier docs | Black / white / neon-orange `#FF6B35`, Space Grotesk + Inter | `proposal_build.html` (8 pages) |

**Consequence:** the React renderer is **not** dead weight — it *is* the So Media proposal +
agreement design. Keeping it (user's choice) is correct: it's the interactive path for the
So Media line. Only its Firebase/auth/persistence coupling is removed.

### Evidence (PDF metadata — confirmed, not assumed)
- All recent PDFs: Producer `Skia/PDF`, Creator `HeadlessChrome` (148/149), A4 (595×842pt),
  Titles = HTML filenames. i.e. self-contained HTML rendered to PDF by headless Chrome.
- The original `consul house/הצעת מחיר consule house.pdf`: Creator `Cursor Helper`, Title
  `מערכת הצעות מחיר — proposal-generator` → produced by the **old React app**, confirming the
  React design == So Media proposal design.

### Reusable rules extracted from real examples
**So Media** (from `הסכם התקשרות`): payment **50% / 0% / 50%** (signing / beta / delivery)
for Fixed, or Hourly; infra retainer **₪550 + VAT, min 5-month** commitment; **14-day** free
bug fixes; **₪350/hr** for changes/training; **full IP to client** on full payment (warranty
voids if client edits code); cancellation = advance non-refundable + pay hours worked;
browser support Chrome/Safari/Edge; exclusions (Hebrew only, no branding/domains/content
entry/training); liability capped at amount paid.
**So Media proposal sections:** 1 מבוא ורציונל · 2 מפרט טכני · 3 חבילות שירות (בסיס + Add-ons)
· 4 הצעת מחיר (table: מסלול / עלות הקמה / עלות חודשית / הערות) · 5 Blockers · 6 תהליכי עבודה.

**XSHEVA** (from Rav Bariach 8-pager): payment **25/25/25/25** milestones; roadmap/milestones
table; data-security **hybrid model** (self-hosted VPS + Anthropic API); **annual-savings ROI**
calc; **risk table** (severity / mitigation / verification); **SLA** (response / uptime).

## 2. Goals
- Replace the app-based workflow with a **skill** that turns client requirements into a
  branded document, for **both** lines (So Media, XSHEVA) and **both** doc types
  (proposal `הצעת מחיר`, agreement `הסכם התקשרות`).
- **Centralize** design systems, a brand-partitioned rules library, and a **redacted**
  example library so every draft starts from proven material.
- Remove Firebase entirely; keep the React renderer runnable Firebase-free (So Media path).

## 3. Non-goals
- Re-skinning React to XSHEVA (React == So Media design; XSHEVA output is the HTML template).
- Any hosted service, DB, or e-signature (Documenso complements later, out of scope).
- Client-facing UI. Personal drafting workflow only.

## 4. Decisions (locked with user)
| # | Decision |
|---|----------|
| 1 | **Teardown:** strip Firebase; keep the React renderer runnable Firebase-free (So Media interactive path). |
| 2 | **Location:** skill in this repo's `.claude/skills/proposal-kit/`. |
| 3 | **Output:** self-contained HTML → headless-Chrome → A4 PDF (proven pipeline). |
| 4 | **Doc types:** build **both** proposal and agreement, for **both** brands. |
| 5 | **Examples:** **redact** client names + ₪ amounts to placeholders; keep structure/rules. |

## 5. Repo end-state

### 5a. Delete (Firebase + dead surface)
- `src/lib/firebase.ts`, `src/lib/firestore.ts`
- `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `.firebaserc`
- `src/contexts/AuthContext.tsx`, `src/projects/LoginPage.tsx`, `src/projects/MyProposalsPage.tsx`
- Firebase dependency from `package.json` / lockfile
- The GitHub Actions Firebase post-deploy workflow
- Firebase env keys from `.env.example`

### 5b. Keep (Firebase-free — the So Media interactive renderer)
- `ProposalDocument.tsx`, `QuoteDocument.tsx`, `ProposalForm.tsx`, `QuoteForm.tsx`,
  `ProposalPage.tsx`, `QuotePage.tsx`, `TabNav.tsx`, `EditContext.tsx`, `src/components/**`.
- Rewire pages to **local-only** state (no save/load/auth). Remove all imports of the deleted
  Firebase/auth modules so `npm run dev` + `npm run build` still succeed. Trim `App.tsx`
  routing to the two preview pages (no login gate, no "my proposals").

### 5c. Add — the skill
```
.claude/skills/proposal-kit/
  SKILL.md                       # trigger, intake (brand + doc type), end-to-end workflow
  brands/
    somedia/
      design-system.md           # pink-accent design (mirrors React components)
      proposal.html              # reconstructed from somedia-proposal.html
      agreement.html             # reconstructed from somedia-agreement.html
      rules.md                   # 50/0/50, ₪550 retainer + 5-mo min, 14-day warranty,
                                 #   ₪350/hr, IP, cancellation, exclusions, liability cap
    xsheva/
      design-system.md           # black/orange, Space Grotesk + Inter, confidential stamp
      proposal.html              # reconstructed from proposal_build.html (8-page)
      agreement.html             # XSHEVA agreement variant
      rules.md                   # 25/25/25/25, SLA, hybrid-security, ROI, risk
  shared/
    render.sh                    # headless-Chrome HTML → A4 PDF (the proven pipeline)
    section-structure.md         # canonical sections per doc type
  examples/
    somedia/{consul-house,noe,nox-liba}/   # redacted extracted text + note to original
    xsheva/{rav-bariach,ai-tracking-map}/  # redacted extracted text + note to original
```

## 6. Skill workflow (`SKILL.md`)
1. **Intake** — brand (somedia | xsheva), doc type (proposal | agreement), client, industry,
   problem, scope, pricing intent, self-host vs cloud (xsheva), validity date.
2. **Assemble** — load `brands/<brand>/design-system.md`, matching `<doc>.html`, `rules.md`,
   `shared/section-structure.md`, and the closest `examples/<brand>/*`.
3. **Draft** — section-by-section, Hebrew RTL, brand voice; apply the brand's rules.
4. **Fill** the template → `build.html`.
5. **Render** → A4 PDF via `shared/render.sh`. Deliver PDF; persist nothing.

## 7. Rendering pipeline
Formalizes the confirmed method: self-contained HTML (inline CSS, brand tokens,
`@page { size: A4 }`, RTL) printed by the machine's Chrome/Chromium headless.
`render.sh` documents the exact command; Playwright MCP is an available fallback.

## 8. Redaction approach (examples)
Per example: extract text, replace client name → `«CLIENT»`, ₪ figures → `«AMOUNT»`
(keep %), personal contacts → placeholder. Preserve section structure, rule patterns, and
phrasing. Store as `.md`; keep original PDFs out of the repo with a pointer note.

## 9. Testing / verification
- `npm run build` + `npm run dev` succeed; grep `src/` for `firebase|firestore|AuthContext`
  → zero hits.
- Skill produces a filled `build.html` + valid A4 PDF for a sample brief per brand × doc type
  (4 combinations); PDF text extractable (ATS-safe), no layout overflow.
- `examples/` contain no real ₪ amounts or client names (grep check).

## 10. Open items
- Skill name `proposal-kit` (vs `proposals`) — confirm during implementation; low stakes.
- Existing `.claude/skills/proposal-generator/` repomix snapshot references soon-deleted
  files; drop or regenerate after teardown.
- NOE / nox-liba proposals contain copy-paste artifacts from Consul House (e.g. leftover
  `ConsulHouse.co.il`); the redacted examples will note this so drafts don't inherit it.
