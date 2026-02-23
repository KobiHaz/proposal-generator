import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  listProposals,
  listAgreements,
  deleteProposal,
  deleteAgreement,
  type SavedProposal,
  type SavedAgreement,
} from '@/lib/firestore';
import type { DocVariant } from '@/lib/firestore';

function formatVariant(variant: DocVariant): string {
  return variant === 'automation' ? 'אוטומציות' : 'CRM';
}

type DocItem = SavedProposal | SavedAgreement;

function isProposal(d: DocItem): d is SavedProposal {
  return 'recipient' in (d as SavedProposal).data;
}

export interface EditItemDoc {
  id: string;
  type: 'proposal' | 'agreement';
  variant: DocVariant;
  data: unknown;
}

interface MyProposalsPageProps {
  onEditItem: (doc: EditItemDoc) => void;
}

export function MyProposalsPage({ onEditItem }: MyProposalsPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DocItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async (): Promise<DocItem[]> => {
    if (!user?.uid) return [];
    const [proposals, agreements] = await Promise.all([
      listProposals(user.uid),
      listAgreements(user.uid),
    ]);
    return [...proposals, ...agreements].sort(
      (a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0)
    );
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    setLoading(true);
    loadItems()
      .then((merged) => {
        if (!cancelled) {
          setItems(merged);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid, loadItems]);

  const handleDelete = async (e: React.MouseEvent, doc: DocItem) => {
    e.stopPropagation();
    if (!window.confirm('האם למחוק?')) return;
    if (isProposal(doc)) {
      await deleteProposal(doc.id);
    } else {
      await deleteAgreement(doc.id);
    }
    const merged = await loadItems();
    setItems(merged);
  };

  const handleClick = (doc: DocItem) => {
    const type = isProposal(doc) ? 'proposal' : 'agreement';
    onEditItem({
      id: doc.id,
      type,
      variant: doc.variant,
      data: doc.data,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div
          className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin"
          role="status"
          aria-label="טוען"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6" dir="rtl">
        <p className="text-destructive text-center py-4">
          שגיאה בטעינה: {error}
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setLoading(true);
              loadItems()
                .then((merged) => {
                  setItems(merged);
                  setError(null);
                })
                .catch((e) => setError(e instanceof Error ? e.message : String(e)))
                .finally(() => setLoading(false));
            }}
            className="text-primary underline"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8" dir="rtl">
        <div className="max-w-md mx-auto text-center py-16 px-6 rounded-xl border border-dashed border-border bg-muted/30">
          <p className="text-muted-foreground text-base leading-relaxed">
            אין הצעות שמורות.
          </p>
          <p className="text-muted-foreground/90 text-sm mt-1">
            צור הצעה חדשה בטאבים למעלה.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-right py-3.5 px-4 text-sm font-semibold text-foreground">סוג</th>
              <th className="text-right py-3.5 px-4 text-sm font-semibold text-foreground">גרסה</th>
              <th className="text-right py-3.5 px-4 text-sm font-semibold text-foreground">נמען / לקוח</th>
              <th className="text-right py-3.5 px-4 text-sm font-semibold text-foreground">תאריך</th>
              <th className="w-12 py-3.5 px-4" aria-label="מחק" />
            </tr>
          </thead>
          <tbody>
            {items.map((doc) => {
              const type = isProposal(doc) ? 'proposal' : 'agreement';
              const name = isProposal(doc)
                ? (doc as SavedProposal).data.recipient
                : (doc as SavedAgreement).data.clientName;
              const date = doc.updatedAt?.toDate?.() ?? new Date();
              return (
                <tr
                  key={`${type}-${doc.id}`}
                  className="border-b border-border last:border-b-0 hover:bg-muted/60 cursor-pointer transition-colors duration-200"
                  onClick={() => handleClick(doc)}
                >
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                        type === 'proposal'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent/15 text-accent'
                      )}
                    >
                      {type === 'proposal' ? 'הצעה' : 'הסכם'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium text-muted-foreground',
                        doc.variant === 'automation' ? 'bg-muted' : 'bg-secondary/60'
                      )}
                    >
                      {formatVariant(doc.variant)}
                    </span>
                  </td>
                  <td className="py-3 px-4">{name || '—'}</td>
                  <td className="py-3 px-4">
                    {date.toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, doc)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                      aria-label="מחק"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
