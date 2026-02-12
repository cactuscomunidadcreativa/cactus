'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PlatformConfig, TokenBudget, AuditLogEntry, UsageAnalytics } from '../types';

export function useAdmin() {
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [budgets, setBudgets] = useState<TokenBudget[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/config');
      if (!res.ok) throw new Error(`Failed to load configs: ${res.status}`);
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configs');
    }
  }, []);

  const saveConfig = useCallback(async (key: string, value: string) => {
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error(`Failed to save config: ${res.status}`);
      await loadConfigs();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save config');
      return false;
    }
  }, [loadConfigs]);

  const loadBudgets = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/budgets');
      if (!res.ok) throw new Error(`Failed to load budgets: ${res.status}`);
      const data = await res.json();
      setBudgets(data.budgets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets');
    }
  }, []);

  const saveBudget = useCallback(async (budget: Partial<TokenBudget> & { user_id: string; app_id: string }) => {
    try {
      const res = await fetch('/api/admin/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budget),
      });
      if (!res.ok) throw new Error(`Failed to save budget: ${res.status}`);
      await loadBudgets();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
      return false;
    }
  }, [loadBudgets]);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error(`Failed to load analytics: ${res.status}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    }
  }, []);

  const loadAuditLog = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/audit');
      if (!res.ok) throw new Error(`Failed to load audit log: ${res.status}`);
      const data = await res.json();
      setAuditLog(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([loadConfigs(), loadBudgets(), loadAnalytics(), loadAuditLog()])
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load admin data'))
      .finally(() => setLoading(false));
  }, [loadConfigs, loadBudgets, loadAnalytics, loadAuditLog]);

  return {
    configs,
    budgets,
    auditLog,
    analytics,
    loading,
    error,
    clearError,
    loadConfigs,
    saveConfig,
    loadBudgets,
    saveBudget,
    loadAnalytics,
    loadAuditLog,
  };
}
