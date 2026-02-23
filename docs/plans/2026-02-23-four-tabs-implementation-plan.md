# Four Tabs: הצעת מחיר + הסכם (CRM + אוטומציות) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend proposal-generator with 4 tabs (הצעת מחיר CRM/אוטומציות, הסכם CRM/אוטומציות), flexible proposal form, and agreement presets.

**Architecture:** 4 flat tabs in App state; ProposalData + ProposalForm + ProposalDocument for price proposals; QuoteData + presets for agreements; shared layout and print.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Radix UI, Lucide React

---

## Task 1: Add ProposalData type and default values

**Files:**
- Modify: `src/projects/types.ts`

**Step 1: Add ProposalData interface**

Add to `src/projects/types.ts`:

```ts
export interface ProposalData {
  date: string;
  recipient: string;
  sender: string;
  subject: string;
  intro: string;
  specSections: Array<{ title: string; items: string[] }>;
  basePackage: { title: string; items: string[] };
  addOns: Array<{ title: string; items: string[] }>;
  pricingRows: Array<{
    plan: string;
    setupCost: number;
    monthlyCost: number | null;
    notes: string;
  }>;
  blockers: string[];
  taxNote?: string;
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
```

**Step 2: Verify types compile**

Run: `cd /Users/kobihazout/.gemini/antigravity/projects/proposal-generator && npm run build`

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/projects/types.ts
git commit -m "feat: add ProposalData type and defaults"
```

---

## Task 2: Create ProposalDocument component

**Files:**
- Create: `src/projects/ProposalDocument.tsx`

**Step 1: Implement ProposalDocument**

Create `src/projects/ProposalDocument.tsx` that renders:
- Header: date, recipient, sender, subject (from ProposalData)
- Intro section (paragraph)
- Spec sections (each: title + bullet list)
- Base package (title + bullets)
- Add-ons (each: title + bullets)
- Pricing table (מסלול | עלות הקמה | עלות חודשית | הערות)
- Blockers list
- Tax note (optional footer)

Use same print-friendly styling as QuoteDocument: `w-[210mm]`, `min-h-[297mm]`, RTL, Hebrew. Use `cn` from `@/lib/utils`. Render `-` or empty string when `monthlyCost` is null.

**Step 2: Verify component renders**

Run: `npm run dev`, add temporary import in App to render `ProposalDocument` with `defaultProposalData`, confirm no errors.

**Step 3: Revert temporary test, commit**

```bash
git add src/projects/ProposalDocument.tsx
git commit -m "feat: add ProposalDocument component"
```

---

## Task 3: Create ProposalForm component

**Files:**
- Create: `src/projects/ProposalForm.tsx`

**Step 1: Implement ProposalForm**

Create form with Cards (same pattern as QuoteForm):
- Header fields: date, recipient, sender, subject
- Intro: textarea
- Spec sections: array of { title, items[] } with Add/Remove section, Add/Remove item per section
- Base package: title + items[] with Add/Remove item
- Add-ons: array of { title, items[] } with Add/Remove add-on, Add/Remove item per add-on
- Pricing table: array of { plan, setupCost, monthlyCost, notes } with Add/Remove row
- Blockers: array of strings with Add/Remove
- Tax note: optional input

Use `Input`, `Label`, `Card`, `Button` from UI. RTL, `dir="rtl"`. `onChange` callback receives full updated ProposalData.

**Step 2: Verify form works**

Wire ProposalForm + ProposalDocument in ProposalPage (create minimal ProposalPage for test), edit fields, confirm document updates.

**Step 3: Commit**

```bash
git add src/projects/ProposalForm.tsx
git commit -m "feat: add ProposalForm component"
```

---

## Task 4: Create ProposalPage component

**Files:**
- Create: `src/projects/ProposalPage.tsx`
- Modify: `src/App.tsx` (later, in Task 6)

**Step 1: Implement ProposalPage**

Create `ProposalPage.tsx`:
- Accept `variant: 'crm' | 'automation'` prop (for future differentiation; can show in document title or header)
- `useState<ProposalData>(defaultProposalData)`
- Same layout as QuotePage: header with print button, form (left 4 cols), document preview (right 8 cols)
- Print styles same as QuotePage

**Step 2: Commit**

```bash
git add src/projects/ProposalPage.tsx
git commit -m "feat: add ProposalPage component"
```

---

## Task 5: Create TabNav component

**Files:**
- Create: `src/projects/TabNav.tsx`

**Step 1: Implement TabNav**

Create tabs component with 4 tabs:
- הצעת מחיר CRM
- הצעת מחיר אוטומציות
- הסכם CRM
- הסכם אוטומציות

Props: `activeTab`, `onTabChange`. Tab type: `'proposal-crm' | 'proposal-automation' | 'agreement-crm' | 'agreement-automation'`.

Use Radix Tabs or simple styled buttons. RTL. Highlight active tab.

**Step 2: Commit**

```bash
git add src/projects/TabNav.tsx
git commit -m "feat: add TabNav component"
```

---

## Task 6: Wire App with tabs and conditional content

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add tab state and routing**

In App:
- `const [activeTab, setActiveTab] = useState<'proposal-crm' | 'proposal-automation' | 'agreement-crm' | 'agreement-automation'>('agreement-crm')`
- Render TabNav with activeTab and onTabChange
- When activeTab starts with `proposal-`: render ProposalPage with variant `crm` or `automation`
- When activeTab starts with `agreement-`: render QuotePage with variant `crm` or `automation`

**Step 2: Update QuotePage to accept variant prop**

Modify QuotePage: add `variant?: 'crm' | 'automation'` prop, default `'crm'`. Pass to QuoteDocument if needed.

**Step 3: Verify all 4 tabs render**

Run `npm run dev`, click each tab, confirm correct page shows. Proposal tabs show ProposalPage, Agreement tabs show QuotePage.

**Step 4: Commit**

```bash
git add src/App.tsx src/projects/QuotePage.tsx
git commit -m "feat: wire App with TabNav and conditional pages"
```

---

## Task 7: Add agreement presets and refactor QuoteDocument for variant

**Files:**
- Create: `src/projects/presets.ts`
- Modify: `src/projects/QuoteDocument.tsx`
- Modify: `src/projects/QuotePage.tsx`

**Step 1: Create presets.ts**

Create `presets.ts` with:
- `agreementPresets.crm`: section titles and content snippets for CRM (e.g. "מהות השירות" → CRM/אפליקציה text)
- `agreementPresets.automation`: section titles and content snippets for automation (e.g. "מהות השירות" → אוטומציה/תשתית text)

Structure: export `AgreementPreset` type and `agreementPresets` object.

**Step 2: Refactor QuoteDocument to use variant**

QuoteDocument accepts `variant: 'crm' | 'automation'`. Use `agreementPresets[variant]` to render variant-specific copy in sections that differ (e.g. Section 1 "מהות השירות"). Keep payment, timeline, maintenance sections shared—they use QuoteData. Only body copy changes.

**Step 3: Pass variant from QuotePage to QuoteDocument**

QuotePage receives variant from App, passes to QuoteDocument.

**Step 4: Verify both variants render correctly**

Switch between הסכם CRM and הסכם אוטומציות, confirm different wording in relevant sections.

**Step 5: Commit**

```bash
git add src/projects/presets.ts src/projects/QuoteDocument.tsx src/projects/QuotePage.tsx
git commit -m "feat: add agreement presets and variant support"
```

---

## Task 8: Add proposal variant differentiation (optional header/subject)

**Files:**
- Modify: `src/projects/ProposalDocument.tsx`
- Modify: `src/projects/ProposalPage.tsx`

**Step 1: Pass variant to ProposalDocument**

ProposalPage passes `variant` to ProposalDocument. Document can show "הצעת מחיר – CRM" or "הצעת מחיר – אוטומציות" in header/title if desired. Minimal change—just a label.

**Step 2: Commit**

```bash
git add src/projects/ProposalDocument.tsx src/projects/ProposalPage.tsx
git commit -m "feat: add variant label to proposal document"
```

---

## Task 9: Test print across all 4 tabs

**Files:**
- No code changes

**Step 1: Manual print test**

Run `npm run dev`. For each tab:
1. Fill minimal data
2. Click הדפסה / שמירה כ-PDF
3. Confirm print preview shows correct document, RTL, no layout breaks

**Step 2: Run lint and build**

```bash
npm run lint
npm run build
```

Expected: No errors.

**Step 3: Commit if any fixes**

---

## Task 10: Update README

**Files:**
- Modify: `README.md`

**Step 1: Document 4 tabs**

Add section describing the four document types and tab navigation.

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README with four-tabs feature"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-02-23-four-tabs-implementation-plan.md`.

Two execution options:

1. **Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel Session (separate)** — Open a new session with executing-plans, batch execution with checkpoints.

**Which approach?**
