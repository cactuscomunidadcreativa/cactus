'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase not configured');
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/dashboard');
      router.refresh();
    }, 2000);
  }

  return (
    <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-center mb-1">{t('title')}</h2>
      <p className="text-muted-foreground text-center text-sm mb-6">{t('subtitle')}</p>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      {success ? (
        <div className="text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-cactus-green mx-auto mb-3" />
          <p className="font-medium">{t('success')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('redirecting')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              {t('newPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
              {t('confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-cactus-green hover:bg-cactus-green/90 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('submit')}
          </button>
        </form>
      )}
    </div>
  );
}
