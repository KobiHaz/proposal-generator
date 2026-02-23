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
      className="w-[210mm] min-h-[297mm] mx-auto bg-white text-slate-800 shadow-2xl mb-8 text-right overflow-hidden relative print:shadow-none"
      dir="rtl"
    >
      {/* Decorative Header Bar */}
      <div className="h-4 bg-gradient-to-l from-slate-900 to-slate-700 w-full top-0 absolute print:block" />

      <div className="p-[20mm] pt-[25mm] relative z-10">
        {/* Header */}
        <header className="mb-10">
          <div className="flex justify-center items-center gap-2 text-sm text-slate-500 bg-slate-50 inline-block px-4 py-1 rounded-full border border-slate-100 mb-4">
            <Calendar size={14} />
            <span>תאריך: {data.date || '_________'}</span>
          </div>
          <div className="space-y-1 text-sm">
            <p><strong>לכבוד:</strong> {data.recipient || '_________'}</p>
            <p><strong>מאת:</strong> {data.sender || '_________'}</p>
            <p><strong>הנדון:</strong> {data.subject || '_________'}</p>
          </div>
        </header>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-black text-slate-900 tracking-wide border-b-2 border-slate-900 pb-2 inline-block">
            הצעת מחיר – {variantLabel}
          </h1>
        </div>

        {/* 1. מבוא ורציונל */}
        {data.intro && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              1. מבוא ורציונל העבודה
              <FileText size={18} className="text-slate-400 opacity-60" />
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed pr-10 border-r border-slate-100">
              {data.intro}
            </p>
          </section>
        )}

        {/* 2. מפרט טכני */}
        {data.specSections.filter((s) => s.title || s.items.some((i) => i)).length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-slate-800 mb-3">2. המפרט הטכני</h2>
            <div className="space-y-4 pr-10 border-r border-slate-100">
              {data.specSections.map(
                (sec, idx) =>
                  (sec.title || sec.items.some((i) => i)) && (
                    <div key={idx}>
                      {sec.title && <h3 className="font-semibold text-slate-800 text-sm mb-1">{sec.title}</h3>}
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
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
          <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            3. חבילות שירות
            <Package size={18} className="text-slate-400 opacity-60" />
          </h2>
          <div className="space-y-4 pr-10 border-r border-slate-100">
            {(data.basePackage.title || data.basePackage.items.some((i) => i)) && (
              <div>
                <h3 className="font-semibold text-slate-800 text-sm mb-1">{data.basePackage.title || 'חבילת בסיס'}</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
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
                    <h3 className="font-semibold text-slate-800 text-sm mb-1 flex items-center gap-1">
                      <Plus size={14} /> {addon.title || 'תוספת'}
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
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
          <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            4. הצעת מחיר
            <DollarSign size={18} className="text-slate-400 opacity-60" />
          </h2>
          <div className="pr-10 border-r border-slate-100 overflow-x-auto">
            <table className="w-full text-sm border border-slate-200 rounded overflow-hidden">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-right p-3 border-b border-slate-200 font-bold">מסלול</th>
                  <th className="text-right p-3 border-b border-slate-200 font-bold">עלות הקמה (חד פעמי)</th>
                  <th className="text-right p-3 border-b border-slate-200 font-bold">עלות חודשית (ריטיינר)</th>
                  <th className="text-right p-3 border-b border-slate-200 font-bold">הערות</th>
                </tr>
              </thead>
              <tbody>
                {data.pricingRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0">
                    <td className="p-3">{row.plan || '-'}</td>
                    <td className="p-3">{row.setupCost != null ? row.setupCost.toLocaleString() + ' ₪' : '-'}</td>
                    <td className="p-3">{row.monthlyCost != null ? row.monthlyCost.toLocaleString() + ' ₪' : '-'}</td>
                    <td className="p-3">{row.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.taxNote && (
            <p className="text-xs text-slate-500 mt-2 pr-10">{data.taxNote}</p>
          )}
        </section>

        {/* 5. דרישות תחילת עבודה */}
        {data.blockers.filter(Boolean).length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              5. דרישות תחילת עבודה (Blockers)
              <AlertCircle size={18} className="text-slate-400 opacity-60" />
            </h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 pr-10 border-r border-slate-100">
              {data.blockers.filter(Boolean).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
          בכבוד רב
        </div>
      </div>

      <div className="h-2 bg-slate-900 w-full bottom-0 absolute print:block" />
    </div>
  );
};
