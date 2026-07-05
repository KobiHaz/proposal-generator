# PDF Generation — xsheva Brand System

> Rebuilt 2026-07-05. The Rav-Bariach proposal is generated from
> `scripts/build-proposal.py` → self-contained HTML → **headless Chrome print** → PDF.
> Canonical design source: claude.ai design system `019ded08-805f-7784-a7bf-2a665a617bb5`.

> ⚠️ **Supersedes the earlier blue / DejaVu / LibreOffice version of this doc, which was
> off-brand.** xsheva's accent is **orange**, not blue; the font is **Space Grotesk**, not
> DejaVu; the render engine is **Chrome**, not LibreOffice.

---

## xsheva design tokens (source of truth)

```python
ORANGE = "#FF6B35"   # THE ONLY accent color (blue #3B6EF8 was legacy — do not use)
NAVY   = "#101622"   # dark surface / cover (hero)
INK    = "#1A2230"   # light-mode body text ; headings #101622
MUTE   = "#66707F"   # muted labels ; on dark: #9AA6B8
LINE   = "#E4E7EC"   # light hairline ; on dark: #282e39 ; row divider #EEF0F3
ROW    = "#FAFBFC"   # subtle even-row fill
```

- **Typeface:** Space Grotesk (Latin only) + **Heebo** (Hebrew) — Space Grotesk has **no
  Hebrew glyphs**, so Heebo carries all Hebrew. Both are **embedded as base64** from
  `scripts/fonts/*.ttf` (variable TTFs) — the PDF renders identically on any machine, no
  network needed. `font-family: 'Space Grotesk','Heebo'` → Chrome picks per glyph.
- **Radii:** 2 (buttons) · 4 (chips) · 8–12 (cards/tables). **Spacing:** 8/16/32/64/96/128.
- **Logo:** staircase glyph `M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z` (48×48), fill
  orange, on the dark cover. **Wordmark: XSHEVA — always all-caps.**
- **Surface strategy:** **dark cover** (hero) + **light body pages** (print collateral is
  light mode per the design system).

### Brand content rules (enforced)
- **No emoji.** (The old 🔴🟠🟡 severity and 🚀 Go-Live were removed.)
- **No exclamation marks.** XSHEVA all-caps. Architecture vocabulary; eyebrows uppercase + orange.

---

## Architecture: HTML → PDF via headless Chrome

```
python3 scripts/build-proposal.py
  → /tmp/proposal_build.html                       (self-contained, fonts inlined)
  → Google Chrome --headless --print-to-pdf        (vector text, real fonts, @page A4)
  → public/samples/proposal-rav-bariach-xsheva.pdf
```

Chrome binary: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
Flags: `--headless=new --no-pdf-header-footer --virtual-time-budget=15000
--run-all-compositor-stages-before-draw --print-to-pdf=<out> file://<html>`.

**Why Chrome (not LibreOffice / html2pdf.js)?** Vector text (not rasterized), real Space
Grotesk + Heebo, faithful CSS `@page` pagination, and full modern-CSS support (flex, grid,
`break-inside`, nth-child) — none of the LibreOffice quirks apply anymore.

---

## Pagination (Chrome print)

- `@page { size:A4; margin:15mm 15mm 16mm }` · `@page:first { margin:0 }` for a full-bleed cover.
- Cover is `min-height:297mm` so it fills page 1; content flows naturally after (no forced
  per-section breaks — that left half-empty pages).
- Keep tables intact: `tr, table { break-inside: avoid }`. Keep a heading with its body:
  `.sec-head { break-after: avoid; break-inside: avoid }` and `.sub { break-after: avoid }`.
- Print background colors: `-webkit-print-color-adjust: exact; print-color-adjust: exact` on `*`.

---

## Helpers in build-proposal.py

`section(num,(title,eyebrow),body)` · `sub()` · `lead()` · `para()` · `bullets()` ·
`table(headers,rows,total=,accent_cols=)` (navy header + orange underline, alt rows, orange
total row) · `chip(level)` severity chips (`high`=solid orange, `mid`=orange-tint, `low`=outline,
**no emoji**) · `stats([(value,label)…])` stat tiles · `note()`.

---

## Rav-Bariach proposal structure (8 pages, 10 sections — MVP/pilot scope)

Cover · 1 מבוא (two independent tracks, **MVP/pilot-first**, priced separately) ·
2 תשתית/ארכיטקטורה/אבטחה (**self-hosted VPS**; Claude API external; **hybrid** security;
**2.4 Prompt-injection defense** — external content is data-not-instructions, guardrails,
output validation, HITL-as-security-gate; **2.5 HITL continuous learning** — 100% review →
labeled data → rising autonomy per process, fine-tuning post-pilot; **2.6 caching** of
validated lookups e.g. project+warranty) · 3 תהליך 1 — רשימות קבלנים (spec) · 4 תהליך 2 — הזמנות (spec) ·
5 ROADMAP (**lean, 4 phases, ~9 weeks**) · 6 תמחור (**split**) · 7 ROI · 8 רישום סיכונים
(14 rows) · 9 SLA · 10 דרישות תחילת עבודה.

**Pricing — split, MVP scope, 550 ₪/hr:** שלב 0 תשתית 20h/11,000 ₪ · תהליך 1 38h/20,900 ₪ ·
תהליך 2 48h/26,400 ₪ = **106h / 58,300 ₪ + VAT** (each process priced separately — client can
start with one). Formal **±20% hours overflow** clause for edge cases. Payment: 4× 14,575 ₪.

**Support/commercial terms:** bug warranty = **2 weeks from Go-Live, final-spec defects only**;
Ad-hoc hourly = **600 ₪/hr**; prepaid **20-hour bank @ 480 ₪/hr** (20% off ad-hoc); monthly
retainer 3,500 ₪. **ROI (recomputed on 58,300):** ~196% yr-1, break-even ~3 months from Go-Live,
297K ₪/yr saving. Rates benchmarked vs Israeli specialized-consulting norms (250–800 ₪/hr).

> History: an earlier version quoted the full-build scope at 220h / 121,000 ₪ (82% ROI). The
> client asked to re-scope to a leaner MVP-first pilot landing at ~58K; edge cases / full
> automation are handled iteratively via the 20% buffer, hourly bank, and post-pilot phases.

---

## Verify after regenerating

```python
import fitz
doc = fitz.open('public/samples/proposal-rav-bariach-xsheva.pdf')
assert doc.page_count == 8
# render pages to PNG and eyeball: orange accent, logo, no emoji, no sliced tables
```

---

## File locations

- Generator: `scripts/build-proposal.py`
- Fonts (embedded): `scripts/fonts/SpaceGrotesk.ttf`, `scripts/fonts/Heebo.ttf`
- Output PDF: `public/samples/proposal-rav-bariach-xsheva.pdf`
- Design spec: `docs/superpowers/specs/2026-07-05-xsheva-rav-bariach-pdf-design.md`
- This doc: `.claude/knowledge/pdf-generation.md`

---

## Deferred (clean follow-up)

In-app React preview tab: the app is a **static** Vite/Firebase frontend and can't run
headless Chrome, so the standalone generator is the right home for a high-fidelity PDF. An
in-app preview would render the document in React and export via the app's `html2pdf.js`
(lower fidelity) — a separate, optional task.
