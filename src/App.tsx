import { useState } from 'react';
import QuotePage from './projects/QuotePage';
import ProposalPage from './projects/ProposalPage';
import { TabNav, type TabId } from './projects/TabNav';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('proposal-crm');

  const isProposal = activeTab.startsWith('proposal-');
  const variant =
    activeTab === 'proposal-automation' || activeTab === 'agreement-automation'
      ? 'automation'
      : 'crm';

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="print:hidden border-b border-border bg-secondary/30">
        <header className="flex justify-between items-center px-6 py-3" dir="rtl">
          <h1 className="text-xl font-semibold text-primary">מערכת הצעות והסכמים</h1>
        </header>
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
