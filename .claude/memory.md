# Memory — Proposal Generator

## Key Decisions

| Date | Decision | Reason |
|------|----------|--------|
| 2026-07-25 | Retired React/Firebase app; drafting via `proposal-kit` skill | UI unused; work moved to chat-driven generation |
| 2026-07-25 | Removed Firebase entirely (auth, Firestore, rules, CI) | No persistence/hosting needed |
| 2026-07-25 | Kept React renderer Firebase-free as So Media preview | Its components ARE the So Media design |
| 2026-07-25 | Two brands: So Media + XSHEVA, each proposal + agreement | Distinct product lines discovered from real PDFs |
| 2026-07-25 | Output = self-contained HTML → headless Chrome → A4 PDF | Confirmed from PDF metadata of past docs |
| 2026-07-25 | Examples redacted (client names + ₪ → placeholders) | Repo safety |

## Active Context

- Skill: `.claude/skills/proposal-kit/` — `brands/{somedia,xsheva}/`, `shared/render.sh`, redacted `examples/`.
- So Media rules: 50/0/50 payment · ₪550 retainer (min 5 mo) · 14-day warranty · ₪350/hr · full IP on payment.
- XSHEVA rules: 25/25/25/25 milestones · hybrid security (VPS + Anthropic API) · ROI + risk tables · SLA.
- React renderer: `npm run dev` → http://localhost:8085 (So Media design, no save/auth).
