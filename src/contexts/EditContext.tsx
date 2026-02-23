import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DocVariant } from '@/lib/firestore';
import type { ProposalData, QuoteData } from '@/projects/types';

export interface EditingDoc {
  id: string;
  type: 'proposal' | 'agreement';
  variant: DocVariant;
  data: ProposalData | QuoteData;
}

type EditContextValue = {
  editingDoc: EditingDoc | null;
  setEditingDoc: (doc: EditingDoc | null) => void;
};

const EditContext = createContext<EditContextValue | null>(null);

export function EditProvider({ children }: { children: ReactNode }) {
  const [editingDoc, setEditingDoc] = useState<EditingDoc | null>(null);
  const value = useMemo(
    () => ({ editingDoc, setEditingDoc }),
    [editingDoc, setEditingDoc]
  );
  return (
    <EditContext.Provider value={value}>
      {children}
    </EditContext.Provider>
  );
}

export function useEdit(): EditContextValue {
  const context = useContext(EditContext);
  if (context === null) {
    throw new Error('useEdit must be used within an EditProvider');
  }
  return context;
}
