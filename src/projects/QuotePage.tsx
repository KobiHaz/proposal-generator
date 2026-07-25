import React, { useRef, useState } from 'react';
import { QuoteForm } from './QuoteForm';
import { QuoteDocument } from './QuoteDocument';
import { QuoteData } from './types';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const defaultQuoteData: QuoteData = {
  date: new Date().toISOString().split('T')[0],
  clientName: '',
  clientId: '',
  developerName: '',
  developerId: '',
  paymentModel: 'fixed',
  fixedPriceAmount: 0,
  advancePaymentPercent: 30,
  betaPaymentPercent: 40,
  finalPaymentPercent: 30,
  hourlyRate: 0,
  estimatedHours: 0,
  monthlyRetainerAmount: 0,
  supportHourlyRate: 0,
  warrantyDays: 30,
  timelineDays: 30,
  cancellationTerms:
    'במקרה של ביטול ביוזמת הלקוח, המקדמה לא תוחזר והלקוח ישלם עבור שעות העבודה שבוצעו בפועל.',
  clientObligations:
    'הלקוח מתחייב להעמיד לרשות הספק את כל המידע והגישות הנדרשים תוך 7 ימים.',
  browserSupport: 'Chrome, Safari, Edge (גרסאות אחרונות)',
  exclusions: 'הזנת תכנים, עיצוב גרפי של מותג, רכישת דומיינים.',
};

interface QuotePageProps {
  variant?: 'crm' | 'automation';
  initialData?: QuoteData;
}

const QuotePage: React.FC<QuotePageProps> = ({ variant = 'crm', initialData }) => {
  const [data, setData] = useState<QuoteData>(() => initialData ?? defaultQuoteData);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleSavePdf = async () => {
    const el = pdfRef.current;
    if (!el) return;
    setIsExportingPdf(true);
    try {
      await html2pdf().set({
        margin: 0,
        filename: `הסכם-${data.clientName || 'מסמך'}-${data.date || 'ללא-תאריך'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(el).save();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header - Hidden on print */}
      <header className="bg-white border-b sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-800">מערכת הצעות והסכמים</h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSavePdf}
              className="gap-2"
              disabled={isExportingPdf}
            >
              <FileDown size={16} className={isExportingPdf ? 'animate-pulse' : undefined} />
              {isExportingPdf ? 'מוריד...' : 'שמירה כ-PDF'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 gap-8 grid grid-cols-1 lg:grid-cols-12 print:block print:p-0">
        {/* Form Section - Takes 4 columns, hidden on print */}
        <div className="lg:col-span-4 space-y-4 print:hidden h-fit sticky top-24 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <QuoteForm data={data} onChange={setData} />
        </div>

        {/* Document Preview Section - Takes 8 columns, full width on print */}
        <div className="lg:col-span-8 print:w-full print:absolute print:top-0 print:left-0 print:m-0">
          <div className="print:hidden mb-4 text-sm text-gray-500 text-center">
            תצוגה מקדימה (גודל A4)
          </div>
          <div className="flex justify-center">
            <div ref={pdfRef}>
              <QuoteDocument data={data} variant={variant} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuotePage;
