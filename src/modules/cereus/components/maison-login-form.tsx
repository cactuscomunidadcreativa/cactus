'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Loader2 } from 'lucide-react';

export function MaisonLoginForm({ accentColor }: { accentColor: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setError('Service not configured'); return; }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  async function handleOAuth(provider: 'google' | 'github') {
    if (!supabase) { setError('Service not configured'); return; }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-center mb-1">Welcome back</h2>
      <p className="text-gray-500 text-center text-sm mb-6">Sign in to your account</p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">{error}</div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 text-white rounded-md text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: accentColor }}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-gray-400">or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => handleOAuth('google')} className="py-2.5 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
          Google
        </button>
        <button onClick={() => handleOAuth('github')} className="py-2.5 border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
          GitHub
        </button>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium hover:underline" style={{ color: accentColor }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
