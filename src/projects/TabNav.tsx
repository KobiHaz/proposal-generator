import React from 'react';
import { cn } from '@/lib/utils';

export type TabId = 'proposal-crm' | 'proposal-automation' | 'agreement-crm' | 'agreement-automation';

const TABS: { id: TabId; label: string }[] = [
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
    <nav className="flex gap-1 border-b border-slate-200" dir="rtl">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-4 py-3 text-sm font-medium rounded-t-md transition-colors',
            activeTab === tab.id
              ? 'bg-white border border-b-0 border-slate-200 text-slate-900 -mb-px'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};
