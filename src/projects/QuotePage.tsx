import React, { useState } from 'react';
import { QuoteForm } from './QuoteForm';
import { QuoteDocument } from './QuoteDocument';
import { QuoteData } from './types';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface QuotePageProps {
  variant?: 'crm' | 'automation';
}

const QuotePage: React.FC<QuotePageProps> = ({ variant = 'crm' }) => {
    const [data, setData] = useState<QuoteData>({
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
        cancellationTerms: 'במקרה של ביטול ביוזמת הלקוח, המקדמה לא תוחזר והלקוח ישלם עבור שעות העבודה שבוצעו בפועל.',
        clientObligations: 'הלקוח מתחייב להעמיד לרשות המפתח את כל המידע והגישות הנדרשים תוך 7 ימים.',
        browserSupport: 'Chrome, Safari, Edge (גרסאות אחרונות)',
        exclusions: 'הזנת תכנים, עיצוב גרפי של מותג, רכישת דומיינים.',
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-100" dir="rtl">
            {/* Header - Hidden on print */}
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

                {/* Helper text for print mode alignment */}
                <style dangerouslySetInnerHTML={{
                    __html: `
          @media print {
            @page { margin: 0; size: auto; }
            body { -webkit-print-color-adjust: exact; background: white; }
          }
        `}} />

                {/* Form Section - Takes 4 columns, hidden on print */}
                <div className="lg:col-span-4 space-y-4 print:hidden h-fit sticky top-24 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    <QuoteForm data={data} onChange={setData} />
                </div>

                {/* Document Preview Section - Takes 8 columns, full width on print */}
                <div className="lg:col-span-8 print:w-full print:absolute print:top-0 print:left-0 print:m-0">
                    <div className="print:hidden mb-4 text-sm text-gray-500 text-center">
                        תצוגה מקדימה (המסמך יודפס בגודל A4)
                    </div>
                    <div className="flex justify-center">
                        <QuoteDocument data={data} />
                    </div>
                </div>

            </main>
        </div>
    );
};

export default QuotePage;
