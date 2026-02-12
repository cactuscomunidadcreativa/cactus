'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tc = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setError('Supabase not configured'); return; }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  async function handleOAuth(provider: 'google' | 'github') {
    if (!supabase) { setError('Supabase not configured'); return; }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });
    if (error) setError(error.message);
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

      <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder={t('emailPlaceholder')}
              required
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium">
              {t('password')}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-cactus-green hover:underline"
            >
              {t('forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
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

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">{t('orContinueWith')}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleOAuth('google')}
          className="py-2.5 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors"
        >
          {t('google')}
        </button>
        <button
          onClick={() => handleOAuth('github')}
          className="py-2.5 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors"
        >
          {t('github')}
        </button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {t('noAccount')}{' '}
        <Link href="/register" className="text-cactus-green hover:underline font-medium">
          {t('signUp')}
        </Link>
      </p>
    </div>
  );
}
