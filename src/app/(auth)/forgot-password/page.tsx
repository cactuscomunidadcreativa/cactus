'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase not configured');
      return;
    }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?redirect=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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

      {sent ? (
        <div className="text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-cactus-green mx-auto mb-3" />
          <p className="font-medium mb-1">{t('sent')}</p>
          <p className="text-sm text-muted-foreground mb-6">{t('sentDescription')}</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-cactus-green hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('backToLogin')}
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
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

          <div className="text-center mt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('backToLogin')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
