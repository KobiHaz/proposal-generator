import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  listProposals,
  listAgreements,
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

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      listProposals(user.uid),
      listAgreements(user.uid),
    ])
      .then(([proposals, agreements]) => {
        if (cancelled) return;
        const merged: DocItem[] = [...proposals, ...agreements].sort(
          (a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0)
        );
        setItems(merged);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

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

  if (items.length === 0) {
    return (
      <div className="p-6" dir="rtl">
        <p className="text-muted-foreground text-center py-12">
          אין הצעות שמורות. צור הצעה חדשה בטאבים למעלה.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-right py-3 px-4 font-medium">סוג</th>
              <th className="text-right py-3 px-4 font-medium">גרסה</th>
              <th className="text-right py-3 px-4 font-medium">נמען / לקוח</th>
              <th className="text-right py-3 px-4 font-medium">תאריך</th>
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
                  className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleClick(doc)}
                >
                  <td className="py-3 px-4">{type === 'proposal' ? 'הצעה' : 'הסכם'}</td>
                  <td className="py-3 px-4">{formatVariant(doc.variant)}</td>
                  <td className="py-3 px-4">{name || '—'}</td>
                  <td className="py-3 px-4">
                    {date.toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
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
