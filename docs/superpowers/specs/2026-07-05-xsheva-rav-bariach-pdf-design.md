# xsheva Rav-Bariach Proposal PDF — Design Spec

> Date: 2026-07-05 · Owner: Kobi Hazout (XSHEVA) · Status: approved

## Goal

Produce a high-fidelity, **on-brand xsheva** PDF proposal for **רב-בריח** (Rav-Bariach process-automation project), replacing the off-brand Cowork draft. The deliverable is the PDF file itself.

## Why this exists

A prior Cowork session generated a Rav-Bariach proposal but used a **wrong/legacy design**: blue `#3B6EF8` accent, DejaVu Sans, lowercase "xsheva", emoji, LibreOffice render. The canonical xsheva design system (claude.ai design `019ded08…`) is materially different. This rebuild corrects the brand and upgrades the render pipeline.

## Canonical xsheva design tokens (source of truth)

| Token | Value |
|---|---|
| Accent (only chromatic color) | Orange `#FF6B35` |
| Dark surface / navy | `#101622` |
| Dark hairline border | `#282e39` |
| Dark secondary text | `#9AA6B8`, muted `#66707F` |
| Light surface | `#FFFFFF` |
| Light body text | `#1A2230`; headings `#101622` |
| Light hairline / divider | `#E4E7EC` / `#EEF0F3`; subtle row `#FAFBFC` |
| Typeface (only) | **Space Grotesk** (300–700), via Google Fonts |
| Radii | 2 (buttons/inputs) · 4 (chips) · 8–12 (cards/tables) |
| Spacing scale | 8 / 16 / 32 / 64 / 96 / 128 |
| Logo glyph | staircase `M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z` (48×48), fill orange |
| Wordmark | **XSHEVA** — always all-caps |

**Brand rules enforced in content:** no emoji (any), no exclamation marks, XSHEVA all-caps, architecture vocabulary. Eyebrows = uppercase, wide tracking, orange.

**Surface strategy:** dark cover (hero treatment: staircase glyph + wordmark + orange eyebrow + decorative orange glow); **light body pages** (print collateral is light mode per the design system).

## Architecture / pipeline

```
scripts/build-proposal.py  →  self-contained HTML (inline CSS, Google Fonts, @page A4)
                           →  Google Chrome --headless --print-to-pdf
                           →  public/samples/proposal-rav-bariach-xsheva.pdf
```

- **Generator:** `scripts/build-proposal.py` — rewritten. Python emits one HTML string. Keeps `tbl()`, `kpi()`, `h1/h2/h3`, `PH` helpers, restyled to xsheva tokens. Cover uses the dark hero; content sections use light mode.
- **Render:** Google Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, flags `--headless --print-to-pdf=<out> --no-pdf-header-footer`. Vector text, real Space Grotesk, CSS `@page` pagination. Verified via Playwright MCP page-count/visual check.
- **Pagination:** explicit `page-break-before/after` on section boundaries; tables kept intact (`break-inside: avoid` on rows / the risk table).

## Content (9 sections, from extracted Cowork PDF)

Cover · 1 מבוא ורציונל · 2 אפיון תהליכים · 3 ארכיטקטורה טכנית (stack table + human-in-the-loop + 3 security tracks) · 4 ROADMAP (6 phases, ~18 weeks) · 5 תמחור (setup @550₪/hr = 121,000₪+VAT, monthly retainer 3,500₪, 4 payment milestones) · 6 ROI (82% yr-1, break-even month 9, 327K–357K₪/yr — as stat tiles + tables) · 7 רישום סיכונים (14 rows, orange-intensity severity) · 8 SLA · 9 דרישות תחילת עבודה.

Severity coding (no emoji): **high** = solid orange chip; **medium** = orange-tint chip (`#FFE7D9`/`#B4400F`); **low** = outline chip (`#D4D9E0`/`#66707F`).

## Out of scope (YAGNI)

- No app rebrand (rest of app stays SoMedia).
- No `ProposalData` model changes; no in-app React tab (static frontend can't run headless Chrome — deferred, clean follow-up).
- No changes to existing SoMedia proposals/agreements or the Python LibreOffice path (replaced).

## Deliverables

1. `scripts/build-proposal.py` (rewritten, real xsheva, full content).
2. `public/samples/proposal-rav-bariach-xsheva.pdf` (generated, verified).
3. `.claude/knowledge/pdf-generation.md` (rewritten to real design + Chrome-print pipeline).
4. Committed to the worktree branch.

## Success criteria

- PDF renders 8–9 A4 pages, Space Grotesk embedded, orange `#FF6B35` accent, staircase logo on cover, no emoji, no sliced tables.
- Content matches the extracted proposal (pricing 121,000₪+VAT, 14 risks, ROI 82%).
- Regenerable via `python3 scripts/build-proposal.py`.
