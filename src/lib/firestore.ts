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
import type { ProposalData, QuoteData } from '@/projects/types';

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

function extractProposalData(raw: Record<string, unknown>): ProposalData {
  const { userId, variant, createdAt, updatedAt, ...data } = raw;
  void userId;
  void variant;
  void createdAt;
  void updatedAt;
  return data as unknown as ProposalData;
}

/** Recursively strip undefined values - Firestore rejects them */
function stripUndefined<T>(obj: T): T {
  if (obj === undefined) return obj;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) result[k] = stripUndefined(v);
  }
  return result as T;
}

const SAVE_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function extractQuoteData(raw: Record<string, unknown>): QuoteData {
  const { userId, variant, createdAt, updatedAt, ...data } = raw;
  void userId;
  void variant;
  void createdAt;
  void updatedAt;
  return data as unknown as QuoteData;
}

export async function saveProposal(
  userId: string,
  variant: DocVariant,
  data: ProposalData,
  docId?: string
): Promise<string> {
  const now = Timestamp.now();
  const payload = stripUndefined({
    userId,
    variant,
    createdAt: now,
    updatedAt: now,
    ...data,
  });
  if (docId) {
    await withTimeout(
      updateDoc(
        doc(db, 'proposals', docId),
        stripUndefined({ ...data, updatedAt: now }) as Record<string, unknown>
      ),
      SAVE_TIMEOUT_MS,
      'saveProposal updateDoc'
    );
    return docId;
  }
  const ref = await withTimeout(
    addDoc(collection(db, 'proposals'), payload),
    SAVE_TIMEOUT_MS,
    'saveProposal addDoc'
  );
  return ref.id;
}

export async function saveAgreement(
  userId: string,
  variant: DocVariant,
  data: QuoteData,
  docId?: string
): Promise<string> {
  const now = Timestamp.now();
  const payload = stripUndefined({
    userId,
    variant,
    createdAt: now,
    updatedAt: now,
    ...data,
  });
  if (docId) {
    await withTimeout(
      updateDoc(
        doc(db, 'agreements', docId),
        stripUndefined({ ...data, updatedAt: now }) as Record<string, unknown>
      ),
      SAVE_TIMEOUT_MS,
      'saveAgreement updateDoc'
    );
    return docId;
  }
  const ref = await withTimeout(
    addDoc(collection(db, 'agreements'), payload),
    SAVE_TIMEOUT_MS,
    'saveAgreement addDoc'
  );
  return ref.id;
}

export async function listProposals(userId: string): Promise<SavedProposal[]> {
  const q = query(
    collection(db, 'proposals'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => {
    const raw = d.data() as Record<string, unknown>;
    const { userId: u, variant: v, createdAt: c, updatedAt: ua } = raw;
    return {
      id: d.id,
      userId: u as string,
      variant: v as DocVariant,
      createdAt: c as Timestamp,
      updatedAt: ua as Timestamp,
      data: extractProposalData(raw),
    };
  });
  return docs;
}

export async function listAgreements(userId: string): Promise<SavedAgreement[]> {
  const q = query(
    collection(db, 'agreements'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => {
    const raw = d.data() as Record<string, unknown>;
    const { userId: u, variant: v, createdAt: c, updatedAt: ua } = raw;
    return {
      id: d.id,
      userId: u as string,
      variant: v as DocVariant,
      createdAt: c as Timestamp,
      updatedAt: ua as Timestamp,
      data: extractQuoteData(raw),
    };
  });
  return docs;
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
  const raw = d.data() as Record<string, unknown>;
  const { userId: u, variant: v, createdAt: c, updatedAt: ua } = raw;
  return {
    id: d.id,
    userId: u as string,
    variant: v as DocVariant,
    createdAt: c as Timestamp,
    updatedAt: ua as Timestamp,
    data: extractProposalData(raw),
  };
}

export async function getAgreement(docId: string): Promise<SavedAgreement | null> {
  const d = await getDoc(doc(db, 'agreements', docId));
  if (!d.exists()) return null;
  const raw = d.data() as Record<string, unknown>;
  const { userId: u, variant: v, createdAt: c, updatedAt: ua } = raw;
  return {
    id: d.id,
    userId: u as string,
    variant: v as DocVariant,
    createdAt: c as Timestamp,
    updatedAt: ua as Timestamp,
    data: extractQuoteData(raw),
  };
}
