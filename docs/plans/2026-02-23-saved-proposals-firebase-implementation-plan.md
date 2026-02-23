# Saved Proposals & Agreements (Firebase) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Save proposals and agreements to Firestore, add "ההצעות שלי" tab with list/edit/delete, and require email/password auth.

**Architecture:** Firebase Auth (email/password) gates the app. Firestore holds `proposals` and `agreements` collections. App state includes `editingDoc` for navigating from list to edit. TabNav gains 5th tab; ProposalPage and QuotePage gain Save button and edit-mode support.

**Tech Stack:** React 19, TypeScript, Vite, Firebase (Auth, Firestore), Tailwind CSS

**Design doc:** `docs/plans/2026-02-23-saved-proposals-firebase-design.md`

---

## Task 1: Install Firebase SDK

**Files:**
- Modify: `package.json`

**Step 1: Add Firebase dependency**

```bash
npm install firebase
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add firebase dependency"
```

---

## Task 2: Firebase config and initialization

**Files:**
- Create: `src/lib/firebase.ts`
- Create: `.env.example` (document required env vars)

**Step 1: Create Firebase init**

Create `src/lib/firebase.ts`:

```ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

Create `.env.example`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**Step 2: Verify build**

Run: `npm run build` — should succeed (env vars can be empty for build).

**Step 3: Commit**

```bash
git add src/lib/firebase.ts .env.example
git commit -m "feat: add Firebase config and init"
```

---

## Task 3: Auth context and useAuth hook

**Files:**
- Create: `src/contexts/AuthContext.tsx`

**Step 1: Implement AuthContext**

Create `src/contexts/AuthContext.tsx`:

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value: AuthContextValue = { user, loading, signIn, signUp, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

Ensure `@/` alias exists (check `vite.config.ts` or `tsconfig.json`). Default Vite+React usually uses `@` → `src/`. Adjust import to `../lib/firebase` if no alias.

**Step 2: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: add AuthContext and useAuth"
```

---

## Task 4: Login / Register full-screen component

**Files:**
- Create: `src/projects/LoginPage.tsx`

**Step 1: Create LoginPage**

Create `src/projects/LoginPage.tsx` with:
- RTL layout (`dir="rtl"`)
- Tabs or toggle: "התחברות" | "הרשמה"
- Sign-in form: email, password, button "התחבר"
- Sign-up form: email, password, confirm password, button "הרשם"
- Error state displayed below form
- Call `useAuth().signIn` / `signUp` on submit
- Use existing `Input`, `Button`, `Label` from `@/components/ui/`

**Step 2: Manual verification**

Run `npm run dev`, wrap App in AuthProvider temporarily with LoginPage always shown, verify form renders and submits (will fail without Firebase project).

**Step 3: Commit**

```bash
git add src/projects/LoginPage.tsx
git commit -m "feat: add LoginPage with sign-in and sign-up"
```

---

## Task 5: Wire AuthProvider and login guard in App

**Files:**
- Modify: `src/main.tsx` — wrap with AuthProvider
- Modify: `src/App.tsx` — show LoginPage when not authenticated

**Step 1: Wrap app with AuthProvider**

In `src/main.tsx`:
```tsx
import { AuthProvider } from '@/contexts/AuthContext';
// ...
<AuthProvider>
  <App />
</AuthProvider>
```

**Step 2: Guard App with login**

In `src/App.tsx`:
- Import `useAuth` and `LoginPage`
- If `loading` → render simple "טוען..." or spinner
- If `!user` → render `<LoginPage />` (full screen)
- Else → render existing TabNav + pages

**Step 3: Commit**

```bash
git add src/main.tsx src/App.tsx
git commit -m "feat: gate app with AuthProvider and login"
```

---

## Task 6: Firestore service — save and list

**Files:**
- Create: `src/lib/firestore.ts`

**Step 1: Implement firestore service**

Create `src/lib/firestore.ts`:

```ts
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ProposalData } from '@/projects/types';
import type { QuoteData } from '@/projects/types';

export type DocType = 'proposal' | 'agreement';
export type DocVariant = 'crm' | 'automation';

export interface SavedProposal {
  id: string;
  userId: string;
  variant: DocVariant;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  data: ProposalData;
}

export interface SavedAgreement {
  id: string;
  userId: string;
  variant: DocVariant;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  data: QuoteData;
}

export async function saveProposal(
  userId: string,
  variant: DocVariant,
  data: ProposalData,
  docId?: string
): Promise<string> {
  const now = Timestamp.now();
  const payload = { userId, variant, createdAt: now, updatedAt: now, ...data };
  if (docId) {
    await updateDoc(doc(db, 'proposals', docId), { ...data, updatedAt: now });
    return docId;
  }
  const ref = await addDoc(collection(db, 'proposals'), payload);
  return ref.id;
}

export async function saveAgreement(
  userId: string,
  variant: DocVariant,
  data: QuoteData,
  docId?: string
): Promise<string> {
  const now = Timestamp.now();
  const payload = { userId, variant, createdAt: now, updatedAt: now, ...data };
  if (docId) {
    await updateDoc(doc(db, 'agreements', docId), { ...data, updatedAt: now });
    return docId;
  }
  const ref = await addDoc(collection(db, 'agreements'), payload);
  return ref.id;
}

export async function listProposals(userId: string): Promise<SavedProposal[]> {
  const q = query(
    collection(db, 'proposals'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedProposal));
}

export async function listAgreements(userId: string): Promise<SavedAgreement[]> {
  const q = query(
    collection(db, 'agreements'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedAgreement));
}

export async function deleteProposal(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'proposals', docId));
}

export async function deleteAgreement(docId: string): Promise<void> {
  await deleteDoc(doc(db, 'agreements', docId));
}

export async function getProposal(docId: string): Promise<SavedProposal | null> {
  const d = await getDoc(doc(db, 'proposals', docId));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() } as SavedProposal;
}

export async function getAgreement(docId: string): Promise<SavedAgreement | null> {
  const d = await getDoc(doc(db, 'agreements', docId));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() } as SavedAgreement;
}
```

**Step 2: Commit**

```bash
git add src/lib/firestore.ts
git commit -m "feat: add Firestore save/list/delete service"
```

---

## Task 7: Firestore security rules

**Files:**
- Create: `firestore.rules` (if not exists) or modify existing

**Step 1: Add rules**

Create or update `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /proposals/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /agreements/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

**Step 2: Commit**

```bash
git add firestore.rules
git commit -m "feat: add Firestore security rules for proposals and agreements"
```

---

## Task 8: Firestore composite indexes

**Files:**
- Create: `firestore.indexes.json`

**Step 1: Add composite indexes**

Firestore requires composite indexes for `where` + `orderBy` on different fields. Add a comment or `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "proposals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "agreements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Firebase Console will prompt for index creation when first running the query if indexes are not deployed.

**Step 2: Commit**

```bash
git add firestore.indexes.json
git commit -m "feat: add Firestore composite indexes for proposals and agreements"
```

---

## Task 9: Add 5th tab and EditContext

**Files:**
- Modify: `src/projects/TabNav.tsx`
- Create: `src/contexts/EditContext.tsx`

**Step 1: Extend TabId and TABS**

In `TabNav.tsx`:
- Add `'my-proposals'` to `TabId`
- Add `{ id: 'my-proposals', label: 'ההצעות שלי' }` to TABS

**Step 2: Create EditContext**

Create `src/contexts/EditContext.tsx`:

```tsx
import React, { createContext, useContext, useState } from 'react';
import type { ProposalData } from '@/projects/types';
import type { QuoteData } from '@/projects/types';
import type { DocVariant } from '@/lib/firestore';

export interface EditingDoc {
  id: string;
  type: 'proposal' | 'agreement';
  variant: DocVariant;
  data: ProposalData | QuoteData;
}

interface EditContextValue {
  editingDoc: EditingDoc | null;
  setEditingDoc: (doc: EditingDoc | null) => void;
}

const EditContext = createContext<EditContextValue | null>(null);

export const EditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [editingDoc, setEditingDoc] = useState<EditingDoc | null>(null);
  return (
    <EditContext.Provider value={{ editingDoc, setEditingDoc }}>
      {children}
    </EditContext.Provider>
  );
};

export const useEdit = () => {
  const ctx = useContext(EditContext);
  if (!ctx) throw new Error('useEdit must be used within EditProvider');
  return ctx;
};
```

**Step 3: Wire EditProvider in App**

Wrap the main app content (inside AuthProvider, after login guard) with `EditProvider`.

**Step 4: TabNav clears editingDoc on manual tab change**

When `onTabChange` is called from TabNav, clear `editingDoc` via `useEdit().setEditingDoc(null)` before setting activeTab. App must pass a callback that does both.

**Step 5: Commit**

```bash
git add src/projects/TabNav.tsx src/contexts/EditContext.tsx src/App.tsx
git commit -m "feat: add my-proposals tab and EditContext"
```

---

## Task 10: ProposalPage — Save button and edit mode

**Files:**
- Modify: `src/projects/ProposalPage.tsx`

**Step 1: Add Save button**

- Add "שמור" button next to print in header
- On click: call `saveProposal(userId, variant, data, docId)` from firestore service
- On success: show toast/message "נשמר בהצלחה", set `docId` in state so future saves update
- On error: show "שגיאה בשמירה, נסה שוב"

**Step 2: Support edit mode**

- Accept props: `variant`, `initialData?: ProposalData`, `docId?: string`
- When `initialData` and `docId` are passed (from App, derived from EditContext), initialize state with them
- Clear `editingDoc` in EditContext after successful save so user returns to clean state when switching tabs

**Step 3: App passes edit props**

When rendering ProposalPage, App checks: if `editingDoc` exists and `editingDoc.type === 'proposal'` and `editingDoc.variant === variant`, pass `initialData={editingDoc.data}` and `docId={editingDoc.id}`.

**Step 4: Commit**

```bash
git add src/projects/ProposalPage.tsx src/App.tsx
git commit -m "feat: add Save button and edit mode to ProposalPage"
```

---

## Task 11: QuotePage — Save button and edit mode

**Files:**
- Modify: `src/projects/QuotePage.tsx`

**Step 1: Add Save button and edit mode**

Same pattern as ProposalPage:
- Save button calling `saveAgreement`
- Accept `initialData?: QuoteData`, `docId?: string`
- App passes these when `editingDoc` matches agreement + variant

**Step 2: Commit**

```bash
git add src/projects/QuotePage.tsx src/App.tsx
git commit -m "feat: add Save button and edit mode to QuotePage"
```

---

## Task 12: MyProposalsPage — list saved documents

**Files:**
- Create: `src/projects/MyProposalsPage.tsx`

**Step 1: Implement MyProposalsPage**

- Use `useAuth()` for `user.uid`
- Use `listProposals` and `listAgreements` to fetch
- Show loading spinner while fetching
- Render list (cards or table) with: type (הצעה/הסכם), variant (CRM/אוטומציות), recipient/client name, date
- Each row clickable: on click, call `setEditingDoc({ id, type, variant, data })` and switch tab via callback from App
- Empty state: "אין הצעות שמורות. צור הצעה חדשה בטאבים למעלה."

**Step 2: App renders MyProposalsPage when activeTab === 'my-proposals'**

**Step 3: Pass onEditItem callback**

App provides `onEditItem(doc)` that: `setEditingDoc(doc)`, `setActiveTab(appropriateTab)`.

**Step 4: Commit**

```bash
git add src/projects/MyProposalsPage.tsx src/App.tsx
git commit -m "feat: add MyProposalsPage with list and edit navigation"
```

---

## Task 13: Delete with confirmation

**Files:**
- Modify: `src/projects/MyProposalsPage.tsx`

**Step 1: Add delete button per row**

- Delete icon/button on each list item
- On click: show `window.confirm` or a simple modal: "האם למחוק?"
- On confirm: call `deleteProposal` or `deleteAgreement`, refresh list

**Step 2: Commit**

```bash
git add src/projects/MyProposalsPage.tsx
git commit -m "feat: add delete with confirmation on saved documents"
```

---

## Task 14: Logout button in header

**Files:**
- Modify: `src/App.tsx` or create shared header component

**Step 1: Add logout button**

- In the header area (where TabNav is or a separate bar), add "התנתק" button
- On click: `useAuth().logout()`

**Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add logout button in header"
```

---

## Task 15: Fix Firestore payload structure

**Note:** Firestore `addDoc` stores the object as-is. Our `ProposalData` and `QuoteData` have nested objects. Ensure we're not double-spreading. The payload should be `{ userId, variant, createdAt, updatedAt, ...data }` so the document has all fields at top level. Verify `listProposals` maps correctly — the document structure has `data` as the proposal fields. Adjust if we stored them flat: the design stores full ProposalData/QuoteData in the doc, so the structure should be flat: `{ userId, variant, createdAt, updatedAt, date, recipient, ... }` (all ProposalData fields). Update `SavedProposal` type to match: the doc has `userId`, `variant`, `createdAt`, `updatedAt`, plus all `ProposalData` fields. So `data` in `SavedProposal` could be the subset of fields for ProposalData, extracted from the doc. Simpler: store `{ userId, variant, createdAt, updatedAt, ...proposalData }` — then when reading, we extract `data` as the proposal part. The `SavedProposal` interface has `data: ProposalData` — so we need to separate. On write: `{ userId, variant, createdAt, updatedAt, ...data }`. On read: `const { userId, variant, createdAt, updatedAt, ...data } = doc.data()` and return `{ id, userId, variant, createdAt, updatedAt, data }`. Update firestore.ts list functions to construct `data` from the doc.

**Step 1: Update listProposals/listAgreements to return correct shape**

Exclude `userId`, `variant`, `createdAt`, `updatedAt` from the `data` object when building `SavedProposal`.

**Step 2: Commit**

```bash
git add src/lib/firestore.ts
git commit -m "fix: correct Firestore doc shape for SavedProposal/SavedAgreement"
```

---

## Verification Checklist

After all tasks:
1. Create Firebase project, enable Auth (email/password) and Firestore
2. Deploy rules: `firebase deploy --only firestore:rules`
3. Deploy indexes: `firebase deploy --only firestore:indexes` (if using firebase.json)
4. Set `.env` from `.env.example` with real values
5. Run `npm run dev`, sign up, create proposal, save, switch to "ההצעות שלי", see it listed, click to edit, change and save, verify update
6. Test agreement flow similarly
7. Test delete with confirmation
8. Test logout and re-login
