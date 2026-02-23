# Four Tabs: הצעת מחיר + הסכם (CRM + אוטומציות) — Design Document

**Date:** 2026-02-23  
**Status:** Approved

---

## 1. Goal

Extend the proposal-generator app with four document types via tabs:

- **הצעת מחיר CRM** — Price proposal for CRM projects
- **הצעת מחיר אוטומציות** — Price proposal for automation projects
- **הסכם CRM** — Engagement agreement for CRM (existing, refactored)
- **הסכם אוטומציות** — Engagement agreement for automation projects

All documents share RTL Hebrew UI, print-to-PDF, and flexible structure where applicable.

---

## 2. Architecture

- **4 flat tabs** at the top — no router, `activeTab` in state
- **Proposal** and **Agreement** are separate document models
- **Agreement** uses a flexible section structure with CRM/Automation presets
- **Proposal** has a dedicated form and document component with dynamic sections, packages, pricing table, blockers
- Shared layout: form (left) + document preview (right), print button in header

---

## 3. Data Models

### ProposalData

```ts
interface ProposalData {
  date: string;           // YYYY-MM-DD
  recipient: string;      // לכבוד
  sender: string;        // מאת
  subject: string;        // הנדון

  intro: string;         // מבוא ורציונל (free text)

  specSections: Array<{
    title: string;
    items: string[];     // bullet points
  }>;

  basePackage: {
    title: string;
    items: string[];
  };
  addOns: Array<{
    title: string;
    items: string[];
  }>;

  pricingRows: Array<{
    plan: string;
    setupCost: number;
    monthlyCost: number | null;  // null = "-"
    notes: string;
  }>;

  blockers: string[];
  taxNote?: string;      // default: "המחירים אינם כוללים מע״מ"
}
```

### AgreementData (refactored QuoteData)

- Keep existing fields: date, client, developer, payment model, maintenance, support, terms
- Add `variant: 'crm' | 'automation'`
- Replace hardcoded sections with `sections: Array<{ number: string; title: string; content: string }>` — or keep structured for payment/timeline, use sections for body
- **Presets:** `agreementPresets.crm` and `agreementPresets.automation` define default section titles and content templates

---

## 4. File Structure

```
src/
├── App.tsx                    # TabNav + activeTab, renders ProposalPage or QuotePage
├── projects/
│   ├── types.ts               # QuoteData, ProposalData
│   ├── presets.ts             # agreementPresets.crm, agreementPresets.automation
│   ├── TabNav.tsx             # 4-tab navigation
│   ├── QuotePage.tsx          # Agreement (accepts variant)
│   ├── QuoteForm.tsx          # (existing)
│   ├── QuoteDocument.tsx      # AgreementDocument (refactored for presets)
│   ├── ProposalPage.tsx       # Price proposal (accepts variant)
│   ├── ProposalForm.tsx       # Form for ProposalData
│   └── ProposalDocument.tsx   # Rendered proposal document
```

---

## 5. UX / Flow

1. User selects tab → `activeTab` updates
2. `ProposalPage` or `QuotePage` renders with appropriate `variant`
3. Form edits update state → document preview updates live
4. Print button triggers `window.print()` (same as today)
5. Add/remove buttons for: spec sections, add-ons, pricing rows, blockers

---

## 6. Error Handling

- Missing fields → placeholders (`_________`) in document
- Empty arrays → section omitted or "לא צוין"
- Pricing table → minimum 1 row; empty price displays "-"

---

## 7. Implementation Order

1. Add `ProposalData` type, `ProposalForm`, `ProposalDocument`
2. Add `TabNav` + `activeTab` in App
3. Refactor `QuotePage` to accept `variant`, use presets
4. Add Automation preset to Agreement
5. Test print across all 4 tabs
