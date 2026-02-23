import React, { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EditProvider, useEdit } from '@/contexts/EditContext';
import { LoginPage } from './projects/LoginPage';
import QuotePage from './projects/QuotePage';
import ProposalPage from './projects/ProposalPage';
import { MyProposalsPage } from './projects/MyProposalsPage';
import { TabNav, type TabId } from './projects/TabNav';
import type { ProposalData, QuoteData } from './projects/types';
import type { DocVariant } from '@/lib/firestore';

function getTabForDoc(
  type: 'proposal' | 'agreement',
  variant: DocVariant
): Exclude<TabId, 'my-proposals'> {
  switch (type) {
    case 'proposal':
      return variant === 'automation' ? 'proposal-automation' : 'proposal-crm';
    case 'agreement':
      return variant === 'automation' ? 'agreement-automation' : 'agreement-crm';
  }
}

function AuthenticatedContent() {
  const { logout } = useAuth();
  const { editingDoc, setEditingDoc } = useEdit();
  const [activeTab, setActiveTab] = useState<TabId>('my-proposals');

  const onTabChange = useCallback(
    (tab: TabId) => {
      setEditingDoc(null);
      setActiveTab(tab);
    },
    [setEditingDoc]
  );

  const onEditItem = useCallback(
    (doc: { id: string; type: 'proposal' | 'agreement'; variant: DocVariant; data: unknown }) => {
      setEditingDoc({
        id: doc.id,
        type: doc.type,
        variant: doc.variant,
        data: doc.data as ProposalData | QuoteData,
      });
      setActiveTab(getTabForDoc(doc.type, doc.variant));
    },
    [setEditingDoc]
  );

  if (activeTab === 'my-proposals') {
    return (
      <div className="min-h-screen">
        <div className="print:hidden border-b border-slate-200">
          <header
            className="flex justify-between items-center px-4 py-2"
            dir="rtl"
          >
            <h1 className="text-lg font-semibold">מערכת הצעות מחיר</h1>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors"
            >
              התנתק
            </button>
          </header>
          <TabNav activeTab={activeTab} onTabChange={onTabChange} />
        </div>
        <MyProposalsPage onEditItem={onEditItem} />
      </div>
    );
  }

  const isProposal = activeTab.startsWith('proposal-');
  const variant =
    activeTab === 'proposal-automation' || activeTab === 'agreement-automation'
      ? 'automation'
      : 'crm';

  return (
    <div className="min-h-screen">
      <div className="print:hidden border-b border-slate-200">
        <header
          className="flex justify-between items-center px-4 py-2"
          dir="rtl"
        >
          <h1 className="text-lg font-semibold">מערכת הצעות מחיר</h1>
          <button
            type="button"
            onClick={() => void logout()}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors"
          >
            התנתק
          </button>
        </header>
        <TabNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>
      {isProposal ? (
        <ProposalPage
          variant={variant}
          {...(editingDoc?.type === 'proposal' && editingDoc.variant === variant
            ? {
                initialData: editingDoc.data as ProposalData,
                docId: editingDoc.id,
              }
            : {})}
        />
      ) : (
        <QuotePage
          variant={variant}
          {...(editingDoc?.type === 'agreement' && editingDoc.variant === variant
            ? {
                initialData: editingDoc.data as QuoteData,
                docId: editingDoc.id,
              }
            : {})}
        />
      )}
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        טוען...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <EditProvider>
      <AuthenticatedContent />
    </EditProvider>
  );
}

export default App;
