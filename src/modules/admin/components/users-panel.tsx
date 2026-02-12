'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Edit3 } from 'lucide-react';
import type { TokenBudget } from '../types';
import { UserBudgetEditor } from './user-budget-editor';

interface UsersPanelProps {
  budgets: TokenBudget[];
  onSaveBudget: (budget: Partial<TokenBudget> & { user_id: string; app_id: string }) => Promise<boolean>;
}

export function UsersPanel({ budgets, onSaveBudget }: UsersPanelProps) {
  const t = useTranslations('admin.users');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<TokenBudget | null>(null);

  const filtered = budgets.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (b.user_email?.toLowerCase().includes(s) || b.user_name?.toLowerCase().includes(s) || b.user_id.includes(s));
  });

  function formatNumber(n: number): string {
    if (n === -1) return t('unlimited');
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search')}
          className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{t('noUsers')}</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium">{t('email')}</th>
                <th className="text-right px-4 py-2 font-medium">{t('tokensUsed')}</th>
                <th className="text-right px-4 py-2 font-medium">{t('generationsUsed')}</th>
                <th className="text-right px-4 py-2 font-medium">{t('tokenLimit')}</th>
                <th className="text-right px-4 py-2 font-medium">{t('genLimit')}</th>
                <th className="text-center px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((budget) => (
                <tr key={budget.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <div>{budget.user_email || budget.user_id.slice(0, 8)}</div>
                    <div className="text-xs text-muted-foreground">{budget.app_id}</div>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs">
                    {formatNumber(budget.monthly_tokens_used)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs">
                    {budget.monthly_generations_used}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs">
                    {formatNumber(budget.monthly_token_limit)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs">
                    {formatNumber(budget.monthly_generation_limit)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => setEditing(budget)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Budget editor modal */}
      {editing && (
        <UserBudgetEditor
          budget={editing}
          onSave={async (updated) => {
            const success = await onSaveBudget(updated);
            if (success) setEditing(null);
            return success;
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
