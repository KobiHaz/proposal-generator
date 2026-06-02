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
