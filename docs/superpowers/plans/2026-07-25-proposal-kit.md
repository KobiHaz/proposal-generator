# Proposal Kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Firebase from the repo, keep the React renderer runnable as a local preview, and add a `proposal-kit` skill that drafts branded proposals/agreements (So Media + XSHEVA) from client requirements and renders them to A4 PDF via headless Chrome.

**Architecture:** Two parts. (1) Teardown — delete all Firebase/auth/persistence code; rewire the React pages to local-only state so `npm run build` still passes; the React `ProposalDocument`/`QuoteDocument` remain as the So Media interactive renderer. (2) Skill — a `.claude/skills/proposal-kit/` directory holding, per brand, a design system, HTML templates, a rules library, and a redacted example library, plus a shared headless-Chrome render script. No database, no hosting.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind v4 (renderer, kept); self-contained HTML + inline CSS + headless Chrome (skill output); Markdown reference files.

**Spec:** [`docs/superpowers/specs/2026-07-25-xsheva-proposal-kit-design.md`](../specs/2026-07-25-xsheva-proposal-kit-design.md)

---

## File Structure

**Deleted (Phase 1):** `src/lib/firebase.ts`, `src/lib/firestore.ts`, `src/contexts/AuthContext.tsx`, `src/projects/LoginPage.tsx`, `src/projects/MyProposalsPage.tsx`, `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `.firebaserc`, `scripts/create-user.js`, `scripts/deploy-rules.sh`, `.github/` Firebase workflow.

**Modified (Phase 1):** `src/projects/types.ts` (gains `DocType`/`DocVariant`), `src/contexts/EditContext.tsx`, `src/projects/ProposalPage.tsx`, `src/projects/QuotePage.tsx`, `src/App.tsx`, `src/main.tsx`, `package.json`, `.env.example`.

**Created (Phases 2–4):**
```
.claude/skills/proposal-kit/
  SKILL.md
  shared/render.sh
  shared/section-structure.md
  brands/somedia/{design-system.md, rules.md, proposal.html, agreement.html}
  brands/xsheva/{design-system.md, rules.md, proposal.html, agreement.html}
  examples/somedia/{consul-house, noe, nox-liba}.md
  examples/xsheva/{rav-bariach, ai-tracking-map}.md
```

---

## Phase 1 — Firebase teardown & renderer rewire

### Task 1: Relocate shared types, delete Firebase modules

**Files:**
- Modify: `src/projects/types.ts` (add types at top)
- Delete: `src/lib/firebase.ts`, `src/lib/firestore.ts`, `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `.firebaserc`

- [ ] **Step 1: Add the two types to `src/projects/types.ts`** (top of file, before `ProposalData`)

```typescript
export type DocType = 'proposal' | 'agreement';
export type DocVariant = 'crm' | 'automation';
```

- [ ] **Step 2: Delete Firebase source + config files**

Run:
```bash
git rm src/lib/firebase.ts src/lib/firestore.ts firestore.rules firestore.indexes.json firebase.json .firebaserc
```

- [ ] **Step 3: Point EditContext at the relocated type**

In `src/contexts/EditContext.tsx`, replace:
```typescript
import type { DocVariant } from '@/lib/firestore';
import type { ProposalData, QuoteData } from '@/projects/types';
```
with:
```typescript
import type { DocVariant, ProposalData, QuoteData } from '@/projects/types';
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor: relocate DocType/DocVariant to types.ts, remove Firebase modules"
```

### Task 2: Rewire ProposalPage & QuotePage to local-only (drop auth + save)

**Files:**
- Modify: `src/projects/ProposalPage.tsx`, `src/projects/QuotePage.tsx`

- [ ] **Step 1: ProposalPage — remove auth/save imports.** Delete these lines from `src/projects/ProposalPage.tsx`:
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useEdit } from '@/contexts/EditContext';
import { saveProposal } from '@/lib/firestore';
```
Change the icon import from `import { FileDown, Save } from 'lucide-react';` to `import { FileDown } from 'lucide-react';`

- [ ] **Step 2: ProposalPage — remove save state + handler.** Delete `const { user } = useAuth();`, `const { setEditingDoc } = useEdit();`, and the state lines `saveMessage`, `saveErrorDetail`, `isSaving`. Delete the entire `handleSave` function (the `const handleSave = async () => { ... };` block). Keep `data`, `setData`, `docId`/`setDocId` may stay unused → also delete `docId`/`setDocId` and the `initialDocId` usage, and drop `docId`/`initialData` from props if no longer referenced (keep `initialData` default via `defaultProposalData`).

- [ ] **Step 3: ProposalPage — remove save UI.** In the header, delete the three `{saveMessage === ...}` spans and the entire "שמור" `<Button onClick={handleSave} ...>` block. Keep only the "שמירה כ-PDF" button.

- [ ] **Step 4: Apply the identical treatment to `src/projects/QuotePage.tsx`** (remove `useAuth`, `useEdit`, `saveAgreement`, `Save` icon, save state, `handleSave`, save spans + button). Keep `defaultQuoteData`, `QuoteForm`, `QuoteDocument`, and the PDF export button.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors referencing `useAuth`, `saveProposal`, `saveAgreement`, or unused vars in these two files. (Other files still error until Task 3 — that's fine; focus on these two.)

- [ ] **Step 6: Commit**

```bash
git add src/projects/ProposalPage.tsx src/projects/QuotePage.tsx
git commit -m "refactor: make Proposal/Quote pages local-only (no auth, no save)"
```

### Task 3: Rewire App.tsx & main.tsx (no auth gate, no my-proposals)

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Rewrite `src/App.tsx`** to remove auth, LoginPage, MyProposalsPage, and the editing flow. Full replacement:

```tsx
import React, { useState } from 'react';
import QuotePage from './projects/QuotePage';
import ProposalPage from './projects/ProposalPage';
import { TabNav, type TabId } from './projects/TabNav';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('proposal-crm');

  const isProposal = activeTab.startsWith('proposal-');
  const variant =
    activeTab === 'proposal-automation' || activeTab === 'agreement-automation'
      ? 'automation'
      : 'crm';

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="print:hidden border-b border-border bg-secondary/30">
        <header className="flex justify-between items-center px-6 py-3" dir="rtl">
          <h1 className="text-xl font-semibold text-primary">מערכת הצעות והסכמים</h1>
        </header>
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      {isProposal ? (
        <ProposalPage variant={variant} />
      ) : (
        <QuotePage variant={variant} />
      )}
    </div>
  );
}

export default App;
```

- [ ] **Step 2: Update `TabNav`** — if `TabId` includes `'my-proposals'` or the nav renders a "my-proposals" tab, remove that entry. Open `src/projects/TabNav.tsx`, delete the `'my-proposals'` member from the `TabId` union and its nav button.

- [ ] **Step 3: Rewrite `src/main.tsx`** to drop `AuthProvider`. Replace its body with (keep `EditProvider` only if `EditContext` is still imported anywhere; App no longer uses it, so remove both):

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 4: Delete now-orphaned context/pages**

Run:
```bash
git rm src/contexts/AuthContext.tsx src/projects/LoginPage.tsx src/projects/MyProposalsPage.tsx
```
If `EditContext.tsx` is no longer imported anywhere (grep `useEdit\|EditProvider` in `src/` → no hits), also `git rm src/contexts/EditContext.tsx`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: remove auth gate, login, and saved-proposals from App"
```

### Task 4: Purge Firebase deps, scripts, CI, env

**Files:**
- Modify: `package.json`, `.env.example`
- Delete: `scripts/create-user.js`, `scripts/deploy-rules.sh`, Firebase GitHub workflow

- [ ] **Step 1: Remove Firebase from `package.json`.** Delete the `"firebase": "^12.9.0"` dependency and the `"firebase-admin": "^13.6.1"` devDependency. Delete the scripts `"create-user"` and `"deploy:rules"`.

- [ ] **Step 2: Delete Firebase scripts + CI**

Run:
```bash
git rm scripts/create-user.js scripts/deploy-rules.sh
ls .github/workflows
```
Then `git rm` the workflow file that deploys to Firebase / runs the post-deploy cabinet update (identified in `d009393`/`19e2dfb`).

- [ ] **Step 3: Strip Firebase keys from `.env.example`.** Remove any `VITE_FIREBASE_*` lines. If the file becomes empty, `git rm .env.example`.

- [ ] **Step 4: Reinstall to refresh the lockfile**

Run: `npm install`
Expected: `firebase` and `firebase-admin` gone from `node_modules`; lockfile updated.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: drop Firebase deps, scripts, CI workflow, and env keys"
```

### Task 5: Verify teardown

- [ ] **Step 1: Grep for any remaining Firebase/auth references**

Run: `grep -rn "firebase\|firestore\|AuthContext\|useAuth\|saveProposal\|saveAgreement" src/`
Expected: **zero** output.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS (tsc clean, vite build succeeds).

- [ ] **Step 3: Dev smoke test**

Run: `npm run dev`, open http://localhost:8085, confirm the tabs render both a proposal and an agreement preview with a working "שמירה כ-PDF" button and no login screen. Stop the server.

- [ ] **Step 4: Commit (if any fixups were needed)**

```bash
git commit -am "test: verify Firebase-free build and local preview" --allow-empty
```

---

## Phase 2 — Skill scaffold & shared assets

### Task 6: Create skill dir, render script, section structure

**Files:**
- Create: `.claude/skills/proposal-kit/shared/render.sh`, `.claude/skills/proposal-kit/shared/section-structure.md`

- [ ] **Step 1: Create `shared/render.sh`** (headless-Chrome HTML → A4 PDF; the proven pipeline)

```bash
#!/usr/bin/env bash
# Render a self-contained HTML file to an A4 PDF using headless Chrome.
# Usage: shared/render.sh <input.html> <output.pdf>
set -euo pipefail
IN="${1:?usage: render.sh <input.html> <output.pdf>}"
OUT="${2:?usage: render.sh <input.html> <output.pdf>}"

CHROME=""
for c in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium" \
  "$(command -v google-chrome || true)" \
  "$(command -v chromium || true)"; do
  if [ -n "$c" ] && [ -x "$c" ]; then CHROME="$c"; break; fi
done
if [ -z "$CHROME" ]; then
  echo "No Chrome/Chromium found. Install Chrome or use the Playwright MCP fallback." >&2
  exit 1
fi

"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$OUT" "file://$(cd "$(dirname "$IN")" && pwd)/$(basename "$IN")"
echo "Wrote $OUT"
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x .claude/skills/proposal-kit/shared/render.sh`

- [ ] **Step 3: Create `shared/section-structure.md`** documenting the canonical section order per doc type:

```markdown
# Canonical section structure

## Proposal (הצעת מחיר)
1. מבוא ורציונל העבודה
2. המפרט הטכני
3. חבילות שירות (חבילת בסיס + Add-ons)
4. הצעת מחיר (טבלה: מסלול / עלות הקמה / עלות חודשית / הערות)
5. דרישות תחילת עבודה (Blockers)
6. תהליכי עבודה

### XSHEVA proposals also use (when relevant)
- אבטחת מידע — מודל היברידי (self-hosted VPS + Anthropic API)
- ROADMAP ולוח זמנים (טבלת milestones)
- אבני תשלום (% + ₪)
- חישוב חיסכון שנתי (ROI)
- ניתוח סיכונים (טבלה: סיכון / חומרה / מיטיגציה)
- SLA ותנאי שירות

## Agreement (הסכם התקשרות)
1. מהות השירות
2. שלב ההקמה — Fixed Price או Hourly (אבני דרך)
3. לוחות זמנים ושיתוף פעולה
4. תחזוקה, תמיכה וניהול (ריטיינר + אחריות)
5. קניין רוחני ובעלות
6. תנאי ביטול
7. דפדפנים והחרגות
8. הגבלת אחריות
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/proposal-kit/shared
git commit -m "feat(skill): add proposal-kit shared render script and section structure"
```

### Task 7: Write `SKILL.md`

**Files:**
- Create: `.claude/skills/proposal-kit/SKILL.md`

- [ ] **Step 1: Create `SKILL.md`**

```markdown
---
name: proposal-kit
description: Draft a branded proposal (הצעת מחיר) or agreement (הסכם התקשרות) for Kobi's client work and render it to an A4 PDF. Use when Kobi shares client requirements and asks to build/draft a proposal, quote, or engagement agreement. Two brands — So Media (lead-automation supplier line) and XSHEVA (strategic AI architecture, direct). Replaces the retired React/Firebase app.
---

# Proposal Kit

Turn client requirements into a finished, branded PDF. Never save to any database.

## 1. Intake — confirm before drafting
- **Brand:** `somedia` (Kobi as So Media's supplier — lead automation, iPlan) or `xsheva` (direct — strategic AI architecture).
- **Doc type:** `proposal` (הצעת מחיר) or `agreement` (הסכם התקשרות).
- Client name, industry, the problem, scope of work.
- Pricing intent (setup + monthly, or fixed/hourly). For `xsheva`: self-hosted vs cloud.
- Validity date.

## 2. Assemble
Read, for the chosen brand:
- `brands/<brand>/design-system.md` — tokens, chrome.
- `brands/<brand>/<doctype>.html` — the template to fill.
- `brands/<brand>/rules.md` — payment/SLA/warranty/IP boilerplate. Apply these; do not invent terms.
- `shared/section-structure.md` — section order.
- The closest file in `examples/<brand>/` — phrasing reference (already redacted; never copy a real client name or ₪ figure from it).

## 3. Draft
Write section-by-section in Hebrew, RTL, in the brand voice. Apply the brand's rules for
payment, warranty, IP, exclusions, and (XSHEVA) SLA/ROI/risk. Fill the HTML template into a
working copy `build.html` in the scratchpad.

## 4. Render
`shared/render.sh build.html <client>-<brand>-<doctype>.pdf`
Deliver the PDF. Persist nothing.

## Notes
- So Media line: "מאת SoMedia CRM"; supplier entity סו מדיה בע״מ ח.פ 516759149.
- XSHEVA line: "מוגש ע״י Kobi Hazout · XSHEVA · kobi@xsheva.com"; mark מסמך סודי.
- Interactive alternative for So Media docs: `npm run dev` renders the same design via React forms.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/proposal-kit/SKILL.md
git commit -m "feat(skill): add proposal-kit SKILL.md workflow"
```

---

## Phase 3 — So Media brand

### Task 8: So Media design system + rules

**Files:**
- Create: `.claude/skills/proposal-kit/brands/somedia/design-system.md`, `.../somedia/rules.md`

- [ ] **Step 1: Create `brands/somedia/design-system.md`** (tokens taken verbatim from `src/index.css` + `ProposalDocument.tsx`)

```markdown
# So Media design system

- **Primary (dark green):** hsl(158 75% 22%)  → headings, table header, section numbers
- **Accent (pink):** hsl(330 85% 60%)          → "So Media brand" stripe, footer "בכבוד רב"
- **Foreground:** hsl(0 0% 9%) · **Muted text:** hsl(0 0% 40%)
- **Secondary bg:** hsl(158 30% 95%) · **Border:** hsl(158 20% 88%)
- **Fonts:** body Heebo (system-ui fallback); headings Lora (serif)
- **Page:** A4, `dir="rtl"`, right-aligned. Header bar in primary with date (left) + logo (right); 2px pink accent stripe under header; 6px primary bar at the bottom.
- **From:** "מאת SoMedia CRM"; footer "בכבוד רב".
```

- [ ] **Step 2: Create `brands/somedia/rules.md`** (extracted from the real Consul House / NOE agreements)

```markdown
# So Media — engagement rules (apply verbatim unless the brief overrides)

**Supplier entity:** סו מדיה בע״מ · ח.פ 516759149

## Payment (הקמה)
- **Fixed Price:** 50% מקדמה עם חתימה · 0% בטא עם גרסת בדיקה · 50% עם מסירה/עלייה לאוויר.
- **Hourly:** ריטיינר שעות עבודה — שעה מחויבת ₪350.

## Maintenance / retainer
- ריטיינר ניהול תשתיות ענן: ₪550 + מע״מ / חודש (ניטור, גיבויים).
- התחייבות מינימלית: 5 חודשים אם נבחר ריטיינר.

## Warranty & changes
- 14 יום תיקון באגים חינם.
- שינויים/הדרכה/שינויים ב-iPlan: ₪350 לשעה, אינם כלולים באפיון.
- האחריות פגה מיידית אם הלקוח משנה קוד באופן עצמאי.

## IP
- בעלות מלאה ובלעדית ללקוח על הלוגיקה, התסריטים והסצנריונים — עם פירעון מלא.

## Cancellation
- ביטול ביוזמת הלקוח: המקדמה לא תוחזר; הלקוח משלם עבור שעות שבוצעו בפועל.

## Browser support & exclusions
- תמיכה: Chrome, Safari, Edge (גרסאות אחרונות).
- לא כולל: הזנת תכנים, עיצוב גרפי של מותג, רכישת דומיינים, הדרכה, ותמיכה בשפות מעבר לעברית.

## Liability
- אחריות הספק מוגבלת לסכום ששולם בפועל; אין אחריות לנזקים עקיפים/אובדן נתונים/הפסד הכנסה.

## Pricing anchor (from real deals — use as a starting range, adjust per scope)
- מסלול הקמה בלבד: ~₪5,250 / ₪0 חודשי.
- מסלול מנוהל: ~₪3,500 הקמה / ₪550 חודשי.
- כל המחירים אינם כוללים מע״מ ועלויות מערכות צד ג׳.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/proposal-kit/brands/somedia/design-system.md .claude/skills/proposal-kit/brands/somedia/rules.md
git commit -m "feat(skill): add So Media design system and rules"
```

### Task 9: So Media HTML templates

**Files:**
- Create: `.claude/skills/proposal-kit/brands/somedia/proposal.html`, `.../somedia/agreement.html`

Source of truth: the React components `src/projects/ProposalDocument.tsx` (proposal) and
`src/projects/QuoteDocument.tsx` (agreement) — same design. Port their markup to a standalone
HTML file: convert Tailwind classes to inline `<style>` CSS using the tokens in
`design-system.md`, keep RTL and the A4 frame, and replace data bindings with `{{PLACEHOLDER}}`
tokens the skill fills.

- [ ] **Step 1: Read the two React components** to mirror their structure.

Run: `sed -n '1,200p' src/projects/ProposalDocument.tsx; sed -n '1,262p' src/projects/QuoteDocument.tsx`

- [ ] **Step 2: Create `brands/somedia/proposal.html`** with this skeleton, then port each section body from `ProposalDocument.tsx` (meta block → title → sections 1–5 → footer):

```html
<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 0; }
  :root {
    --primary: hsl(158 75% 22%); --accent: hsl(330 85% 60%);
    --fg: hsl(0 0% 9%); --muted: hsl(0 0% 40%); --border: hsl(158 20% 88%);
    --secondary: hsl(158 30% 95%);
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Heebo", system-ui, sans-serif; color: var(--fg); }
  .page { width: 210mm; min-height: 297mm; background: #fff; position: relative; }
  header.bar { height: 16mm; background: var(--primary); color: #fff;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 20mm; direction: ltr; }
  .accent-stripe { height: 2px; background: var(--accent); }
  .content { padding: 20mm; padding-top: 8mm; }
  h1.title { font-family: "Lora", Georgia, serif; font-size: 22px; font-weight: 700;
    border-bottom: 2px solid var(--primary); display: inline-block; padding-bottom: 6px; }
  h2 { font-size: 16px; font-weight: 700; }
  h2 .num { color: var(--primary); font-family: "Lora", serif; }
  .body { color: var(--muted); font-size: 13px; line-height: 1.7;
    padding-right: 16px; border-right: 2px solid hsl(158 75% 22% / .2); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: var(--primary); color: #fff; text-align: right; padding: 10px;
    border: 1px solid rgba(255,255,255,.2); }
  td { padding: 10px; border-bottom: 1px solid var(--border); }
  tr:nth-child(even) td { background: hsl(158 30% 95% / .5); }
  footer { margin-top: 40px; padding-top: 18px; border-top: 2px solid hsl(158 75% 22% / .2);
    text-align: center; }
  footer .sign { font-family: "Lora", serif; color: var(--accent); font-weight: 600; }
  .bottom-bar { height: 6px; background: var(--primary); position: absolute; bottom: 0; width: 100%; }
</style>
</head>
<body>
  <div class="page">
    <header class="bar"><span>{{DATE}}</span><span>So Media</span></header>
    <div class="accent-stripe"></div>
    <div class="content">
      <p><strong>לכבוד:</strong> {{RECIPIENT}} &nbsp; <strong>מאת:</strong> SoMedia CRM &nbsp; <strong>הנדון:</strong> {{SUBJECT}}</p>
      <h1 class="title">הצעת מחיר – {{VARIANT_LABEL}}</h1>
      <!-- Sections 1–6: port bodies from ProposalDocument.tsx.
           1 מבוא ורציונל · 2 מפרט טכני · 3 חבילות שירות · 4 הצעת מחיר (table) ·
           5 Blockers · 6 תהליכי עבודה. Use {{...}} tokens for filled content. -->
      <footer><span class="sign">בכבוד רב</span></footer>
    </div>
    <div class="bottom-bar"></div>
  </div>
</body>
</html>
```

- [ ] **Step 3: Create `brands/somedia/agreement.html`** the same way, porting `QuoteDocument.tsx`'s sections (מהות השירות → שלב ההקמה → לוחות זמנים → תחזוקה → קניין רוחני → ביטול → דפדפנים והחרגות → הגבלת אחריות + signature block). Reuse the same `<style>`.

- [ ] **Step 4: Smoke-render both templates** (placeholders visible is fine)

Run:
```bash
.claude/skills/proposal-kit/shared/render.sh .claude/skills/proposal-kit/brands/somedia/proposal.html /tmp/somedia-proposal.pdf
.claude/skills/proposal-kit/shared/render.sh .claude/skills/proposal-kit/brands/somedia/agreement.html /tmp/somedia-agreement.pdf
```
Expected: two A4 PDFs written; open to confirm RTL layout, green header, pink stripe.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/proposal-kit/brands/somedia/proposal.html .claude/skills/proposal-kit/brands/somedia/agreement.html
git commit -m "feat(skill): add So Media proposal + agreement HTML templates"
```

### Task 10: So Media redacted examples

**Files:**
- Create: `.claude/skills/proposal-kit/examples/somedia/{consul-house,noe,nox-liba}.md`

- [ ] **Step 1: Extract text from the real PDFs** (they live outside the repo)

Run:
```bash
python3 - <<'PY'
from pypdf import PdfReader
import os
base=os.path.expanduser("~/Downloads")
jobs={
 "consul-house": ["consul house/הצעת מחיר - מעודכן.pdf","consul house/הסכם התקשרות - מעודכן.pdf"],
 "noe": ["הצעות חדשות/NOE/הצעת מחיר.pdf","הצעות חדשות/NOE/הסכם התקשרות.pdf"],
 "nox-liba": ["הצעות חדשות/nox group - liba/הצעת מחיר.pdf"],
}
for name,files in jobs.items():
    parts=[]
    for f in files:
        r=PdfReader(os.path.join(base,f))
        parts.append("\n".join((p.extract_text() or "") for p in r.pages))
    print("=====",name); print("\n\n".join(parts)[:400])
PY
```

- [ ] **Step 2: For each client, write `examples/somedia/<name>.md`** containing the extracted proposal+agreement text with redactions: client name → `«CLIENT»`, every ₪ figure → `«AMOUNT»` (keep %), any domain/personal contact → `«…»`. Add a top note: `> Source: real deal, redacted. Structure/phrasing reference only.` and, for NOE/nox-liba, note the leftover `ConsulHouse.co.il` copy-paste artifact so future drafts don't inherit it.

- [ ] **Step 3: Verify no real values leaked**

Run: `grep -rnE "₪ ?[0-9]|[0-9]{1,3},[0-9]{3}|ConsulHouse\.co\.il" .claude/skills/proposal-kit/examples/somedia/`
Expected: no real ₪ amounts; any `ConsulHouse.co.il` hit is only inside an explanatory note.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/proposal-kit/examples/somedia
git commit -m "feat(skill): add redacted So Media examples (consul-house, noe, nox-liba)"
```

---

## Phase 4 — XSHEVA brand

### Task 11: XSHEVA design system + rules

**Files:**
- Create: `.claude/skills/proposal-kit/brands/xsheva/design-system.md`, `.../xsheva/rules.md`

- [ ] **Step 1: Create `brands/xsheva/design-system.md`**

```markdown
# XSHEVA design system

- **Colors:** black #000, white #FFF, neon-orange #FF6B35 (accent).
- **Fonts:** Space Grotesk (headings), Inter (body). Hebrew fallback: Heebo/system-ui.
- **Voice:** direct, minimalist, confident. Tagline "Multiply Everything".
- **Doc chrome:** cover with "XSHEVA · STRATEGIC AI ARCHITECTURE", title, client, and a meta line:
  "מוגש ע״י Kobi Hazout · XSHEVA · kobi@xsheva.com · מסמך סודי · תוקף: <date>".
- **Page:** A4, `dir="rtl"`, orange section accents on a dark/light editorial layout.
```

- [ ] **Step 2: Create `brands/xsheva/rules.md`** (from the Rav Bariach 8-pager)

```markdown
# XSHEVA — proposal rules

## Payment milestones (default)
25% חתימת הסכם · 25% Sign-off אפיון (שלב 0) · 25% Demo מוצלח · 25% אישור לקוח + Go-Live.
כל המחירים אינם כוללים מע״מ.

## Data security — hybrid model (include for AI/automation scope)
כל התשתית והעיבוד self-hosted על VPS בשליטת הארגון; רק ניתוח הטקסט נשלח ל-Anthropic API.
מסלול self-hosted מלא (Ollama) זמין בעת הצורך.

## Roadmap
טבלת milestones: Milestone / משך / כותרת / שלב — אפיון+POC → פיתוח תהליך 1 (MVP) → תהליך 2 → Go-Live.

## ROI (חישוב חיסכון שנתי)
טבלה: סה"כ שעות אנוש שנתיות → עלות כוח אדם נוכחית → חיסכון שעות (≈60% אוטומציה) → ערך צמצום שגיאות/עיכובים → חיסכון מוערך.

## Risk table
טבלה: # / סיכון / חומרה / מיטיגציה / מצריך אימות.

## SLA
זמן תגובה תקלה קריטית (שעות עבודה) 4ש' · פתרון 48ש' · תקלה רגילה 24ש' · יעד Uptime לרכיבי אוטומציה בשליטתנו.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/proposal-kit/brands/xsheva/design-system.md .claude/skills/proposal-kit/brands/xsheva/rules.md
git commit -m "feat(skill): add XSHEVA design system and rules"
```

### Task 12: XSHEVA HTML templates

**Files:**
- Create: `.claude/skills/proposal-kit/brands/xsheva/proposal.html`, `.../xsheva/agreement.html`

Source of truth: the extracted text of `~/Downloads/proposal-rav-bariach-xsheva.pdf` (8 pages)
for section content/order; `design-system.md` for tokens. There is no saved HTML — reconstruct.

- [ ] **Step 1: Re-extract the Rav Bariach text for reference**

Run:
```bash
python3 - <<'PY'
from pypdf import PdfReader
r=PdfReader("/Users/kobihazout/Downloads/proposal-rav-bariach-xsheva.pdf")
for i,p in enumerate(r.pages): print(f"--- p{i+1} ---\n", (p.extract_text() or "")[:600])
PY
```

- [ ] **Step 2: Create `brands/xsheva/proposal.html`** — multi-page A4 (use `page-break-after: always` between `.page` blocks), black/white editorial with orange accents, Space Grotesk headings + Inter/Heebo body loaded via a local `@font-face` or system fallback. Cover page + sections per `section-structure.md` (intro → technical → security hybrid → roadmap table → payment milestones → ROI table → risk table → SLA). Use `{{TOKENS}}` for filled content. Skeleton:

```html
<!doctype html>
<html lang="he" dir="rtl">
<head><meta charset="utf-8" />
<style>
  @page { size: A4; margin: 0; }
  :root { --ink:#0a0a0a; --paper:#fff; --orange:#FF6B35; --muted:#555; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:"Inter","Heebo",system-ui,sans-serif; color:var(--ink); }
  .page { width:210mm; min-height:297mm; padding:20mm; position:relative; page-break-after:always; }
  .kicker { color:var(--orange); font-weight:700; letter-spacing:.08em; font-size:12px; }
  h1,h2,h3 { font-family:"Space Grotesk","Inter",sans-serif; }
  h2 .num { color:var(--orange); }
  .rule { height:3px; width:48px; background:var(--orange); }
  table { width:100%; border-collapse:collapse; font-size:12px; }
  th { text-align:right; border-bottom:2px solid var(--orange); padding:8px; }
  td { padding:8px; border-bottom:1px solid #e5e5e5; }
  .confidential { position:absolute; bottom:12mm; font-size:10px; color:var(--muted); }
</style></head>
<body>
  <div class="page">
    <div class="kicker">XSHEVA · STRATEGIC AI ARCHITECTURE</div>
    <h1>{{TITLE}}</h1>
    <p>{{CLIENT}}</p>
    <p class="confidential">מוגש ע״י Kobi Hazout · XSHEVA · kobi@xsheva.com · מסמך סודי · תוקף: {{VALID_UNTIL}}</p>
  </div>
  <!-- Additional .page blocks: intro, technical+security, roadmap, payment, ROI, risk, SLA -->
</body>
</html>
```

- [ ] **Step 3: Create `brands/xsheva/agreement.html`** — XSHEVA-styled formal agreement reusing the same `<style>`, with the agreement sections from `shared/section-structure.md` and XSHEVA payment milestones from `rules.md`.

- [ ] **Step 4: Smoke-render both**

Run:
```bash
.claude/skills/proposal-kit/shared/render.sh .claude/skills/proposal-kit/brands/xsheva/proposal.html /tmp/xsheva-proposal.pdf
.claude/skills/proposal-kit/shared/render.sh .claude/skills/proposal-kit/brands/xsheva/agreement.html /tmp/xsheva-agreement.pdf
```
Expected: A4 PDFs; black/white with orange accents, RTL.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/proposal-kit/brands/xsheva/proposal.html .claude/skills/proposal-kit/brands/xsheva/agreement.html
git commit -m "feat(skill): add XSHEVA proposal + agreement HTML templates"
```

### Task 13: XSHEVA redacted examples

**Files:**
- Create: `.claude/skills/proposal-kit/examples/xsheva/{rav-bariach,ai-tracking-map}.md`

- [ ] **Step 1: Extract + redact** both `~/Downloads/proposal-rav-bariach-xsheva.pdf` and `~/Downloads/הצעת-מחיר-מפת-מעקב-ללמד-AI.pdf` (same redaction rules as Task 10: client name → `«CLIENT»`, ₪ → `«AMOUNT»`). Write each to its `.md` with the `> Source: … redacted` note.

- [ ] **Step 2: Verify no real values leaked**

Run: `grep -rnE "₪ ?[0-9]|58,300|14,575" .claude/skills/proposal-kit/examples/xsheva/`
Expected: no real ₪ amounts.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/proposal-kit/examples/xsheva
git commit -m "feat(skill): add redacted XSHEVA examples (rav-bariach, ai-tracking-map)"
```

---

## Phase 5 — End-to-end verification & cleanup

### Task 14: Sample drafts, docs refresh, stale-snapshot cleanup

- [ ] **Step 1: Dry-run the skill for all 4 combinations.** Using a sample brief (e.g. "«CLIENT» — event hall, lead automation, מסלול מנוהל"), fill each template into `/tmp/build.html` and render:
```bash
for f in somedia/proposal somedia/agreement xsheva/proposal xsheva/agreement; do
  cp ".claude/skills/proposal-kit/brands/$f.html" /tmp/build.html
  .claude/skills/proposal-kit/shared/render.sh /tmp/build.html "/tmp/sample-${f//\//-}.pdf"
done
```
Expected: 4 valid A4 PDFs. Confirm text is selectable (ATS-safe) by extracting: `python3 -c "from pypdf import PdfReader; print(len(PdfReader('/tmp/sample-somedia-proposal.pdf').pages))"`.

- [ ] **Step 2: Update project docs.** In `.claude/CLAUDE.md`, replace the "React + Firebase app" framing and the Firestore/data-model/rules sections with: "Document-generation via the `proposal-kit` skill; React renderer kept as a Firebase-free local preview for the So Media line." Update `.claude/memory.md` Active Context accordingly.

- [ ] **Step 3: Handle the stale repomix snapshot.** The `.claude/skills/proposal-generator/` skill references now-deleted files. Either `git rm -r .claude/skills/proposal-generator` or note it as outdated. Recommended: remove it (the new `proposal-kit` supersedes it).

- [ ] **Step 4: Final grep + build gate**

Run: `grep -rn "firebase\|firestore" src/ && echo "LEAK" || echo "clean"; npm run build`
Expected: `clean` then build PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "docs: refresh CLAUDE.md/memory for proposal-kit; remove stale repomix snapshot"
```

---

## Self-review notes
- **Spec coverage:** teardown (Tasks 1–5), both brands × both doc types (Tasks 8–13), rules libraries (8, 11), redacted examples (10, 13), render pipeline (6), SKILL workflow (7), verification (5, 14). All spec sections mapped.
- **Renderer-kept decision:** Tasks 2–3 preserve `ProposalDocument`/`QuoteDocument` + forms, Firebase-free.
- **No DB/persistence** anywhere in Phases 2–5.
- **Redaction** enforced by grep gates in Tasks 10 & 13.
