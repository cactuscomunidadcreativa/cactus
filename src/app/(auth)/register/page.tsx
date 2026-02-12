'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, Loader2 } from 'lucide-react';

interface InviteData {
  appId: string;
  appName: string;
  clientId: string;
  clientName: string;
  email?: string;
  nombreContacto?: string;
  rol?: string;
}

// App emojis for display
const APP_EMOJIS: Record<string, string> = {
  agave: '🌵',
  ramona: '🎨',
  tuna: '🐟',
  saguaro: '🌿',
};

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const searchParams = useSearchParams();

  const inviteToken = searchParams.get('invite');
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  // Load invite data if token present
  useEffect(() => {
    if (inviteToken) {
      loadInviteData();
    }
  }, [inviteToken]);

  async function loadInviteData() {
    try {
      // Try generic app invite first, fallback to AGAVE-specific
      let res = await fetch(`/api/apps/invite/validate?token=${inviteToken}`);
      let data = await res.json();

      // If not found in generic, try AGAVE-specific (for backwards compatibility)
      if (!data.valid) {
        res = await fetch(`/api/agave/invite/validate?token=${inviteToken}`);
        data = await res.json();
        if (data.valid) {
          data.appId = 'agave';
          data.appName = 'AGAVE';
        }
      }

      if (data.valid) {
        setInviteData(data);
        // Pre-fill form with invite data
        if (data.email) setEmail(data.email);
        if (data.nombreContacto) setFullName(data.nombreContacto);
      } else {
        setError(data.error || 'Invitacion invalida o expirada');
      }
    } catch (err) {
      setError('Error validando invitacion');
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setError('Supabase not configured'); return; }
    setLoading(true);
    setError('');

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If this is an invite registration, process the invite
    if (inviteToken && signUpData.user && inviteData) {
      try {
        // Try generic app invite first
        let res = await fetch('/api/apps/invite/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: inviteToken,
            userId: signUpData.user.id,
          }),
        });

        let result = await res.json();

        // If generic fails, try AGAVE-specific (backwards compatibility)
        if (!result.success && inviteData.appId === 'agave') {
          res = await fetch('/api/agave/invite/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: inviteToken,
              userId: signUpData.user.id,
            }),
          });
          result = await res.json();
        }

        if (result.success) {
          // Redirect to the app
          const appId = result.appId || inviteData.appId || 'agave';
          router.push(`/apps/${appId}`);
          router.refresh();
          return;
        }
      } catch (err) {
        console.error('Error processing invite:', err);
      }
    }

    router.push('/dashboard');
    router.refresh();
  }

  async function handleOAuth(provider: 'google' | 'github') {
    if (!supabase) { setError('Supabase not configured'); return; }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard`,
      },
    });
    if (error) setError(error.message);
  }

  if (inviteLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-center text-muted-foreground">Validando invitacion...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
      {inviteData ? (
        <>
          <div className="text-center mb-6">
            <span className="text-4xl">{APP_EMOJIS[inviteData.appId] || '🌵'}</span>
            <h2 className="text-xl font-semibold mt-2">Bienvenido a {inviteData.appName}</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Has sido invitado a <strong>{inviteData.clientName}</strong>
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Crea tu cuenta para acceder
            </p>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-center mb-1">{t('title')}</h2>
          <p className="text-muted-foreground text-center text-sm mb-6">{t('subtitle')}</p>
        </>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-1.5">
            {t('fullName')}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('fullNamePlaceholder')}
              required
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

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
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">
            {t('password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
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
        {t('hasAccount')}{' '}
        <Link href="/login" className="text-cactus-green hover:underline font-medium">
          {t('signIn')}
        </Link>
      </p>
    </div>
  );
}
