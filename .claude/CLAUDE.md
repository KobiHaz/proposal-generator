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
