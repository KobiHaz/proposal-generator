import React from 'react';
import { ProposalData } from './types';
import { cn } from '@/lib/utils';
import { Calendar, FileText, Package, Plus, DollarSign, AlertCircle } from 'lucide-react';

interface ProposalDocumentProps {
  data: ProposalData;
  variant?: 'crm' | 'automation';
}

export const ProposalDocument: React.FC<ProposalDocumentProps> = ({ data, variant }) => {
  const variantLabel = variant === 'automation' ? 'אוטומציות' : 'CRM';
  return (
    <div
      className="w-[210mm] min-h-[297mm] mx-auto bg-white text-foreground shadow-2xl mb-8 text-right overflow-hidden relative print:shadow-none font-sans"
      dir="rtl"
    >
      {/* Header — sharp, editorial */}
      <header className="h-16 bg-primary w-full top-0 absolute print:block flex items-center justify-between px-6 pl-[20mm] pr-[20mm]" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="bg-white/95 rounded-sm px-3 py-1.5">
            <img
              src="https://somediadigital.com/wp-content/uploads/2023/01/logo.svg"
              alt="SoMedia"
              className="h-7 object-contain print:h-7"
            />
          </div>
          <div className="w-px h-6 bg-white/20" aria-hidden />
          <div className="flex items-center gap-2 text-sm text-white/90">
            <Calendar size={14} className="text-white/70" strokeWidth={2.5} />
            <span>{data.date || '_________'}</span>
          </div>
        </div>
      </header>

      {/* Pink accent stripe — So Media brand */}
      <div className="h-0.5 w-full bg-accent top-16 absolute" aria-hidden />

      <div className="p-[20mm] pt-[26mm] relative z-10">
        {/* Meta block */}
        <div className="mb-10 space-y-2">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <p><strong className="font-semibold">לכבוד:</strong> {data.recipient || '_________'}</p>
            <p><strong className="font-semibold">מאת:</strong> {data.sender || '_________'}</p>
            <p><strong className="font-semibold">הנדון:</strong> {data.subject || '_________'}</p>
          </div>
        </div>

        {/* Title */}
        <div className="mb-10">
          <h1 className="font-serif text-2xl font-bold text-foreground tracking-tight border-b-2 border-primary pb-2 inline-block">
            הצעת מחיר – {variantLabel}
          </h1>
        </div>

        {/* 1. מבוא ורציונל */}
        {data.intro && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <span className="text-primary font-serif font-bold">1.</span>
              מבוא ורציונל העבודה
              <FileText size={16} className="text-primary/70" strokeWidth={2} />
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed pr-8 border-r-2 border-primary/20">
              {data.intro}
            </p>
          </section>
        )}

        {/* 2. מפרט טכני */}
        {data.specSections.filter((s) => s.title || s.items.some((i) => i)).length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-foreground mb-3">
              <span className="text-primary font-serif font-bold">2.</span> המפרט הטכני
            </h2>
            <div className="space-y-4 pr-8 border-r-2 border-primary/20">
              {data.specSections.map(
                (sec, idx) =>
                  (sec.title || sec.items.some((i) => i)) && (
                    <div key={idx}>
                      {sec.title && <h3 className="font-semibold text-foreground text-sm mb-1">{sec.title}</h3>}
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {sec.items.filter(Boolean).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
            </div>
          </section>
        )}

        {/* 3. חבילות שירות */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="text-primary font-serif font-bold">3.</span>
            חבילות שירות
            <Package size={16} className="text-primary/70" strokeWidth={2} />
          </h2>
          <div className="space-y-4 pr-8 border-r-2 border-primary/20">
            {(data.basePackage.title || data.basePackage.items.some((i) => i)) && (
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{data.basePackage.title || 'חבילת בסיס'}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {data.basePackage.items.filter(Boolean).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.addOns.map(
              (addon, idx) =>
                (addon.title || addon.items.some((i) => i)) && (
                  <div key={idx}>
                    <h3 className="font-semibold text-foreground text-sm mb-1 flex items-center gap-1">
                      <Plus size={14} className="text-primary" strokeWidth={2.5} /> {addon.title || 'תוספת'}
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {addon.items.filter(Boolean).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )
            )}
          </div>
        </section>

        {/* 4. הצעת מחיר */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="text-primary font-serif font-bold">4.</span>
            הצעת מחיר
            <DollarSign size={16} className="text-primary/70" strokeWidth={2} />
          </h2>
          <div className="pr-8 border-r-2 border-primary/20 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-right p-3 bg-primary text-primary-foreground font-semibold border border-white/20">מסלול</th>
                  <th className="text-right p-3 bg-primary text-primary-foreground font-semibold border border-white/20">עלות הקמה (חד פעמי)</th>
                  <th className="text-right p-3 bg-primary text-primary-foreground font-semibold border border-white/20">עלות חודשית (ריטיינר)</th>
                  <th className="text-right p-3 bg-primary text-primary-foreground font-semibold border border-white/20">הערות</th>
                </tr>
              </thead>
              <tbody>
                {data.pricingRows.map((row, idx) => (
                  <tr key={idx} className={cn("border-b border-border", idx % 2 === 1 && "bg-secondary/50")}>
                    <td className="p-3 font-medium">{row.plan || '-'}</td>
                    <td className="p-3">{row.setupCost != null ? row.setupCost.toLocaleString() + ' ₪' : '-'}</td>
                    <td className="p-3">{row.monthlyCost != null ? row.monthlyCost.toLocaleString() + ' ₪' : '-'}</td>
                    <td className="p-3 text-muted-foreground">{row.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.taxNote && (
            <p className="text-xs text-muted-foreground mt-2 pr-8">{data.taxNote}</p>
          )}
        </section>

        {/* 5. דרישות תחילת עבודה */}
        {data.blockers.filter(Boolean).length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <span className="text-primary font-serif font-bold">5.</span>
              דרישות תחילת עבודה (Blockers)
              <AlertCircle size={16} className="text-primary/70" strokeWidth={2} />
            </h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pr-8 border-r-2 border-primary/20">
              {data.blockers.filter(Boolean).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-14 pt-6 border-t-2 border-primary/20 text-center">
          <p className="font-serif text-base font-semibold text-accent">בכבוד רב</p>
        </footer>
      </div>

      <div className="h-1.5 bg-primary w-full bottom-0 absolute print:block" aria-hidden />
    </div>
  );
};
