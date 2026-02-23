import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from './projects/LoginPage';
import QuotePage from './projects/QuotePage';
import ProposalPage from './projects/ProposalPage';
import { TabNav, type TabId } from './projects/TabNav';

function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('agreement-crm');

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

  const isProposal = activeTab.startsWith('proposal-');
  const variant = activeTab === 'proposal-automation' || activeTab === 'agreement-automation' ? 'automation' : 'crm';

  return (
    <div className="min-h-screen">
      <div className="print:hidden">
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      {isProposal ? (
        <ProposalPage variant={variant} />
      ) : (
        <QuotePage variant={variant} />
      )}
    </div>
  );
}

export default App;
