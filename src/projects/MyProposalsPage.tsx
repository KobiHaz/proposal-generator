import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileSignature, FileText, Search, Trash2, X } from 'lucide-react';
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

function getDocName(d: DocItem): string {
  return isProposal(d) ? d.data.recipient : d.data.clientName;
}

type TypeFilter = 'all' | 'proposal' | 'agreement';
type VariantFilter = 'all' | DocVariant;

const selectClassName =
  'h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function MyProposalsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DocItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [variantFilter, setVariantFilter] = useState<VariantFilter>('all');

  const hasActiveFilters = search.trim() !== '' || typeFilter !== 'all' || variantFilter !== 'all';

  const resetFilters = useCallback(() => {
    setSearch('');
    setTypeFilter('all');
    setVariantFilter('all');
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((doc) => {
      const type = isProposal(doc) ? 'proposal' : 'agreement';
      if (typeFilter !== 'all' && type !== typeFilter) return false;
      if (variantFilter !== 'all' && doc.variant !== variantFilter) return false;
      if (query && !getDocName(doc).toLowerCase().includes(query)) return false;
      return true;
    });
  }, [items, search, typeFilter, variantFilter]);

  const proposalCount = useMemo(() => items.filter(isProposal).length, [items]);
  const agreementCount = items.length - proposalCount;

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

  const handleDelete = async (doc: DocItem) => {
    if (!window.confirm('האם למחוק?')) return;
    setDeletingId(doc.id);
    setError(null);
    try {
      if (isProposal(doc)) {
        await deleteProposal(doc.id);
      } else {
        await deleteAgreement(doc.id);
      }
      setItems((prev) => prev.filter((item) => item.id !== doc.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'לא ניתן למחוק');
    } finally {
      setDeletingId(null);
    }
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
            אין הצעות שמורות עדיין.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/60 text-foreground">
            <FileText size={18} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground leading-none">{items.length}</p>
            <p className="text-sm text-muted-foreground mt-1">סה"כ מסמכים</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText size={18} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground leading-none">{proposalCount}</p>
            <p className="text-sm text-muted-foreground mt-1">הצעות מחיר</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
            <FileSignature size={18} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-foreground leading-none">{agreementCount}</p>
            <p className="text-sm text-muted-foreground mt-1">הסכמים</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם נמען / לקוח..."
            className="h-10 w-full rounded-md border border-input bg-background py-2 pr-9 pl-3 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className={selectClassName}
          aria-label="סינון לפי סוג"
        >
          <option value="all">כל הסוגים</option>
          <option value="proposal">הצעה</option>
          <option value="agreement">הסכם</option>
        </select>
        <select
          value={variantFilter}
          onChange={(e) => setVariantFilter(e.target.value as VariantFilter)}
          className={selectClassName}
          aria-label="סינון לפי גרסה"
        >
          <option value="all">כל הגרסאות</option>
          <option value="crm">CRM</option>
          <option value="automation">אוטומציות</option>
        </select>
        <button
          type="button"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
          className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <X size={15} />
          איפוס סינון
        </button>
        <span className="mr-auto text-sm text-muted-foreground">
          מציג {filteredItems.length} מתוך {items.length}
        </span>
      </div>

      {filteredItems.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-16 px-6 rounded-xl border border-dashed border-border bg-muted/30">
          <p className="text-muted-foreground text-base leading-relaxed">
            לא נמצאו תוצאות תואמות לסינון.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="text-primary underline text-sm mt-2"
          >
            אפס את הסינון
          </button>
        </div>
      ) : (
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
            {filteredItems.map((doc) => {
              const type = isProposal(doc) ? 'proposal' : 'agreement';
              const name = getDocName(doc);
              const date = doc.updatedAt?.toDate?.() ?? new Date();
              return (
                <tr
                  key={`${type}-${doc.id}`}
                  className="border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors duration-200"
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
                      onClick={() => handleDelete(doc)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors disabled:opacity-50"
                      aria-label="מחק"
                    >
                      {deletingId === doc.id ? (
                        <span className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
