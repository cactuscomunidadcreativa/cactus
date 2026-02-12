'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import type { TokenBudget } from '../types';

interface UserBudgetEditorProps {
  budget: TokenBudget;
  onSave: (budget: Partial<TokenBudget> & { user_id: string; app_id: string }) => Promise<boolean>;
  onClose: () => void;
}

export function UserBudgetEditor({ budget, onSave, onClose }: UserBudgetEditorProps) {
  const t = useTranslations('admin.users');
  const [tokenLimit, setTokenLimit] = useState(budget.monthly_token_limit);
  const [genLimit, setGenLimit] = useState(budget.monthly_generation_limit);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({
      user_id: budget.user_id,
      app_id: budget.app_id,
      monthly_token_limit: tokenLimit,
      monthly_generation_limit: genLimit,
    });
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-editor-title"
    >
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 id="budget-editor-title" className="font-medium">{t('editBudget')}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-sm text-muted-foreground">
          {budget.user_email || budget.user_id.slice(0, 8)} &mdash; {budget.app_id}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">
              {t('tokenLimit')} <span className="text-xs text-muted-foreground">(-1 = {t('unlimited')})</span>
            </label>
            <input
              type="number"
              value={tokenLimit}
              onChange={(e) => setTokenLimit(parseInt(e.target.value) || -1)}
              min={-1}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">
              {t('genLimit')} <span className="text-xs text-muted-foreground">(-1 = {t('unlimited')})</span>
            </label>
            <input
              type="number"
              value={genLimit}
              onChange={(e) => setGenLimit(parseInt(e.target.value) || -1)}
              min={-1}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? '...' : t('saveBudget')}
          </button>
        </div>
      </div>
    </div>
  );
}
