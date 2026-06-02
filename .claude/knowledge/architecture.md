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
