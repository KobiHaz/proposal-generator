import React, { useState } from 'react';
import { ProposalForm } from './ProposalForm';
import { ProposalDocument } from './ProposalDocument';
import { defaultProposalData } from './types';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface ProposalPageProps {
  variant: 'crm' | 'automation';
}

const ProposalPage: React.FC<ProposalPageProps> = ({ variant }) => {
  const [data, setData] = useState(defaultProposalData);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <header className="bg-white border-b sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">מערכת הצעות מחיר</h1>
          <Button onClick={handlePrint} className="gap-2">
            <Printer size={16} />
            הדפסה / שמירה כ-PDF
          </Button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 gap-8 grid grid-cols-1 lg:grid-cols-12 print:block print:p-0">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @media print {
            @page { margin: 0; size: auto; }
            body { -webkit-print-color-adjust: exact; background: white; }
          }
        `,
          }}
        />

        <div className="lg:col-span-4 space-y-4 print:hidden h-fit sticky top-24 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <ProposalForm data={data} onChange={setData} />
        </div>

        <div className="lg:col-span-8 print:w-full print:absolute print:top-0 print:left-0 print:m-0">
          <div className="print:hidden mb-4 text-sm text-gray-500 text-center">
            תצוגה מקדימה (המסמך יודפס בגודל A4)
          </div>
          <div className="flex justify-center">
            <ProposalDocument data={data} variant={variant} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProposalPage;
