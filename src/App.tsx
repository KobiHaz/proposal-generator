import React, { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EditProvider, useEdit } from '@/contexts/EditContext';
import { LoginPage } from './projects/LoginPage';
import QuotePage from './projects/QuotePage';
import ProposalPage from './projects/ProposalPage';
import { TabNav, type TabId } from './projects/TabNav';

function AuthenticatedContent() {
  const { setEditingDoc } = useEdit();
  const [activeTab, setActiveTab] = useState<TabId>('my-proposals');

  const onTabChange = useCallback(
    (tab: TabId) => {
      setEditingDoc(null);
      setActiveTab(tab);
    },
    [setEditingDoc]
  );

  if (activeTab === 'my-proposals') {
    return (
      <div className="min-h-screen">
        <div className="print:hidden">
          <TabNav activeTab={activeTab} onTabChange={onTabChange} />
        </div>
        <div className="p-6" dir="rtl">
          ההצעות שלי - רשימה תופיע כאן
        </div>
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
      <div className="print:hidden">
        <TabNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>
      {isProposal ? (
        <ProposalPage variant={variant} />
      ) : (
        <QuotePage variant={variant} />
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
