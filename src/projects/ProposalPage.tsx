import React, { useState } from 'react';
import { ProposalForm } from './ProposalForm';
import { ProposalDocument } from './ProposalDocument';
import { defaultProposalData, type ProposalData } from './types';
import { Button } from '@/components/ui/button';
import { Printer, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEdit } from '@/contexts/EditContext';
import { saveProposal } from '@/lib/firestore';

interface ProposalPageProps {
  variant: 'crm' | 'automation';
  initialData?: ProposalData;
  docId?: string;
}

const ProposalPage: React.FC<ProposalPageProps> = ({
  variant,
  initialData,
  docId: initialDocId,
}) => {
  const { user } = useAuth();
  const { setEditingDoc } = useEdit();
  const [data, setData] = useState<ProposalData>(
    () => initialData ?? defaultProposalData
  );
  const [docId, setDocId] = useState<string | null>(() => initialDocId ?? null);
  const [saveMessage, setSaveMessage] = useState<'success' | 'error' | null>(
    null
  );

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaveMessage(null);
    try {
      const id = await saveProposal(user.uid, variant, data, docId ?? undefined);
      if (!docId) setDocId(id);
      setEditingDoc(null);
      setSaveMessage('success');
    } catch {
      setSaveMessage('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <header className="bg-white border-b sticky top-0 z-10 print:hidden shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-800">מערכת הצעות מחיר</h1>
          <div className="flex items-center gap-2">
            {saveMessage === 'success' && (
              <span className="text-sm text-green-600">נשמר בהצלחה</span>
            )}
            {saveMessage === 'error' && (
              <span className="text-sm text-red-600">
                שגיאה בשמירה, נסה שוב
              </span>
            )}
            <Button onClick={handleSave} variant="outline" className="gap-2">
              <Save size={16} />
              שמור
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer size={16} />
              הדפסה / שמירה כ-PDF
            </Button>
          </div>
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
