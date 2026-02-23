import React from 'react';
import { cn } from '@/lib/utils';

export type TabId =
  | 'my-proposals'
  | 'proposal-crm'
  | 'proposal-automation'
  | 'agreement-crm'
  | 'agreement-automation';

const TABS: { id: TabId; label: string }[] = [
  { id: 'my-proposals', label: 'ההצעות שלי' },
  { id: 'proposal-crm', label: 'הצעת מחיר CRM' },
  { id: 'proposal-automation', label: 'הצעת מחיר אוטומציות' },
  { id: 'agreement-crm', label: 'הסכם CRM' },
  { id: 'agreement-automation', label: 'הסכם אוטומציות' },
];

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const TabNav: React.FC<TabNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="flex gap-1 border-b border-border bg-background" dir="rtl">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-4 py-3 text-sm font-medium rounded-t-md transition-colors -mb-px',
            activeTab === tab.id
              ? 'text-primary border-b-2 border-primary bg-white'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};
