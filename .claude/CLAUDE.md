# Proposal Generator — Project Workspace

> Refactored 2026-07-25 — retired the React/Firebase app workflow. Proposals are now drafted
> via the **`proposal-kit` skill** and rendered to PDF. No Firebase, no database, no hosting.

Document generation for Kobi's client proposals & agreements (RTL Hebrew). Two brand lines,
each with a proposal (הצעת מחיר) and an engagement agreement (הסכם התקשרות):

| Line | "From" | Service | Design |
|------|--------|---------|--------|
| **So Media** (Kobi as So Media's supplier) | SoMedia CRM · סו מדיה בע״מ ח.פ 516759149 | Lead automation ("מוח לידים חכם", iPlan, WordPress + Meta) | dark-green + pink |
| **XSHEVA** (Kobi direct) | Kobi Hazout · XSHEVA | Strategic AI architecture (ERP, workflow automation) | black + neon-orange #FF6B35 |

---

## Primary workflow — the `proposal-kit` skill

`.claude/skills/proposal-kit/` turns client requirements into a branded A4 PDF.

```
SKILL.md                       intake (brand + doc type) → assemble → draft → render
shared/render.sh               headless-Chrome HTML → A4 PDF (the confirmed pipeline)
shared/section-structure.md    canonical sections per doc type
brands/<somedia|xsheva>/       design-system.md · rules.md · proposal.html · agreement.html
examples/<brand>/              redacted real proposals (phrasing reference)
```

**Render:** `.claude/skills/proposal-kit/shared/render.sh build.html out.pdf`
**Never** persist output to any database. Redacted examples must contain no real client names or ₪ amounts.

---

## Secondary — React renderer (Firebase-free local preview)

The old React app is kept as an **interactive preview for the So Media design** (its
`ProposalDocument`/`QuoteDocument` are the So Media proposal + agreement layout). Firebase,
auth, and saved-proposals were removed.

```sh
npm install
npm run dev    # http://localhost:8085 — form → live A4 preview → "שמירה כ-PDF"
```

**Stack:** React 19 + TypeScript + Vite + Tailwind v4 + Radix UI. Types in `src/projects/types.ts`.

---

## Core Rules

1. **RTL everywhere** — `dir="rtl"` on all main containers / templates.
2. **No `console.log`** — `console.error` for error paths only.
3. **Context memoization** — wrap context values in `useMemo` (renderer).
4. **`parseNumberInput()`** — all number form fields; normalizes empty → 0 (renderer).
5. **Exhaustive switch** — in discriminated unions.
6. **Print/PDF** — templates use inline CSS + `@page { size: A4 }`; renderer uses `@media print` in `index.css`; never `dangerouslySetInnerHTML`.
7. **No Firebase / no persistence** — drafting only; signing (Documenso) is a separate future concern.

## Memory & Plans

- [memory.md](memory.md) — decisions, active context
- Spec: `docs/superpowers/specs/2026-07-25-xsheva-proposal-kit-design.md`
- Plan: `docs/superpowers/plans/2026-07-25-proposal-kit.md`
