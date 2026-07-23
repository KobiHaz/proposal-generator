> NEXT SESSION: review this plan before making structural changes to this repo, and report status to Kobi.

# Graph-Audit Follow-up — proposal-generator (2026-07-23)

## Graph snapshot
- **Code symbols:** 130 (293 total graph nodes incl. config/assets).
- **Top hubs (by degree):**
  - `firestore.ts` — 26
  - `App.tsx` — 23
  - `QuoteForm.tsx` — 20
  - `MyProposalsPage.tsx` — 19
  - `ProposalPage.tsx` — 18
- **Import cycles:** none.
- **Age:** ~17 (relative age signal from audit).

## Change-risk hotspots
These are the highest-degree files — the widest blast radius. A change here touches
many dependents, so test and review them carefully:

- **`src/lib/firestore.ts` (degree 26)** — the single data-access layer (save/list/get/delete
  for `proposals` and `agreements`). Every page that reads or writes documents depends on it.
  Any change to its function signatures, query shape, or the `userId ASC` + `updatedAt DESC`
  composite index ripples across the app.
- **`src/App.tsx` (degree 23)** — root/router; wires the auth context and every page. Routing or
  context-provider changes affect the whole tree.
- **`QuoteForm.tsx` (20), `MyProposalsPage.tsx` (19), `ProposalPage.tsx` (18)** — the primary
  page/form components; large surface area for props and shared types (`presets.ts`, `types.ts`).

## Action items
**No structural action required — maintenance / watch-list only.**

- The god-nodes here are *expected* hubs, not smells: `firestore.ts` is a deliberate single
  data-access module and `App.tsx` is the root router. High degree on these is the intended
  architecture, not accidental coupling. No refactor is justified by the graph.
- No import cycles exist — nothing to untangle.
- The four zero-edge nodes reported by the audit are config/entry files
  (`postcss.config.cjs`, `vite-env.d.ts`, `tailwind.config.cjs`, `vite.config.ts`) — these are
  **not** dead code and must not be removed.
- Watch-list only: if `firestore.ts` keeps growing (e.g. new collections beyond `proposals`/
  `agreements`), consider splitting it per-collection at that point. Not needed today.
- Re-run the graph audit after the next significant feature to confirm hubs stay bounded.
