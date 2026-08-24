# Proposal Generator — Architecture

## Stack

React 19, TypeScript, Vite, Tailwind v4, Radix UI, Lucide, CVA, clsx, tailwind-merge
Firebase Auth + Firestore, html2pdf.js

## Component Flow

```
App.tsx
├── AuthContext       → Firebase Auth, user session
├── LoginPage          → public
└── MyProposalsPage    → protected; the app's only screen.
                          Lists all saved proposals + agreements with
                          search/type/variant filters + reset, and delete.
```

Document creation/editing no longer happens in this UI — proposals and
agreements are generated via chat/skills instead (see
`scripts/build-proposal.py`). This app is a read-only dashboard over the
Firestore-saved documents.

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
- **RTL:** `dir="rtl"` on all main containers
- **Print:** `@media print` in `index.css`; never inline `dangerouslySetInnerHTML`
- **Context values:** always wrapped in `useMemo` for referential stability
