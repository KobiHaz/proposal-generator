# שמירת הצעות והסכמים ב-Firebase — Design Document

**Date:** 2026-02-23  
**Status:** Approved

---

## 1. Goal

Enable users to save proposals (הצעות מחיר) and agreements (הסכמים) to the cloud, view them in a dedicated tab, and edit them later. Authentication via email/password.

---

## 2. Architecture

- **Firebase Auth** — Email/password sign-up and sign-in
- **Firestore** — Two top-level collections: `proposals`, `agreements`. Each document includes `userId`, `variant`, timestamps, and the full document payload
- **5 tabs** — Existing 4 + new "ההצעות שלי" tab that lists all saved documents
- **Explicit save** — User clicks "שמור" to persist; no auto-save

---

## 3. Authentication

- **Screens:** Sign-in (email, password) and Sign-up (email, password, confirm password)
- **When not logged in:** Full-screen login blocks access to app
- **After login:** Full app with 5 tabs
- **Logout button** in header
- **Session persistence** — Firebase Auth handles; user stays logged in until logout

---

## 4. Data Model (Firestore)

### proposals
```ts
{
  userId: string
  variant: 'crm' | 'automation'
  createdAt: Timestamp
  updatedAt: Timestamp
  ...ProposalData  // all fields from types.ts
}
```

### agreements
```ts
{
  userId: string
  variant: 'crm' | 'automation'
  createdAt: Timestamp
  updatedAt: Timestamp
  ...QuoteData  // all fields from types.ts
}
```

**Security rules:** Read/write only when `resource.data.userId == request.auth.uid`

**List display:**
- Proposal: `recipient`, `subject`, date
- Agreement: `clientName`, date

**Sort:** By `updatedAt` descending

---

## 5. UI / UX Flow

**Tabs:** 5 total (4 existing + "ההצעות שלי")

**Save button** on each proposal/agreement page:
- Next to print button
- New doc → create; existing doc → update by ID

**"ההצעות שלי" tab:**
- List of cards (or table) per document
- Each row: type (proposal/agreement), variant, client/recipient, date
- Click → open for edit in relevant tab with data loaded
- Delete option (with confirmation)

---

## 6. Error Handling

- **Auth:** Invalid credentials → inline error; network issue → "בעיית חיבור, נסה שוב"
- **Firestore:** Save failure → "שגיאה בשמירה, נסה שוב"; offline → "אין חיבור לאינטרנט"
- **List loading:** Spinner while loading; empty state → "אין הצעות שמורות"
- No retry logic, offline caching, or extra complexity in v1
