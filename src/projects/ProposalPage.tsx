import React, { useRef, useState } from 'react';
import { ProposalForm } from './ProposalForm';
import { ProposalDocument } from './ProposalDocument';
import { defaultProposalData, type ProposalData } from './types';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface ProposalPageProps {
  variant: 'crm' | 'automation';
  initialData?: ProposalData;
}

const ProposalPage: React.FC<ProposalPageProps> = ({ variant, initialData }) => {
  const [data, setData] = useState<ProposalData>(
    () => initialData ?? defaultProposalData
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const handleSavePdf = async () => {
    const el = pdfRef.current;
    if (!el) return;
    setIsExportingPdf(true);
    try {
      const filename = `הצעה-${data.recipient || 'מסמך'}-${data.date || 'ללא-תאריך'}.pdf`;
      await html2pdf().set({
        margin: 0,
        filename,
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
        <div className="lg:col-span-4 space-y-4 print:hidden h-fit sticky top-24 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <ProposalForm data={data} onChange={setData} />
        </div>

        <div className="lg:col-span-8 print:w-full print:absolute print:top-0 print:left-0 print:m-0">
          <div className="print:hidden mb-4 text-sm text-gray-500 text-center">
            תצוגה מקדימה (גודל A4)
          </div>
          <div className="flex justify-center">
            <div ref={pdfRef}>
              <ProposalDocument data={data} variant={variant} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProposalPage;
