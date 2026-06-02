# Memory — Proposal Generator

## Key Decisions

| Date | Decision | Reason |
|------|----------|--------|
| Feb 2026 | userId immutability enforced in Firestore rule | Prevent ownership hijack on update |
| Feb 2026 | Composite index userId + updatedAt | Required for server-side sorted list queries |
| Feb 2026 | Delete filters local state (no refetch) | Faster UX; avoids unnecessary Firestore read |
| Feb 2026 | parseNumberInput for all number fields | Handles empty string → 0 edge case cleanly |
| 2026 | dir="rtl" on containers (not body) | Allows mixing RTL/LTR in future if needed |

## Resolved Issues

- Firestore security rules updated to enforce userId immutability on update
- Composite index confirmed required for userId + updatedAt queries

## Active Context

- Two variants: `crm` and `automation` for proposals
- Hebrew UI — all main containers `dir="rtl"`
