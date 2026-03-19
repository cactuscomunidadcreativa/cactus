'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, Loader2 } from 'lucide-react';

export function MaisonRegisterForm({ accentColor }: { accentColor: string }) {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setError('Service not configured'); return; }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
        <h2 className="text-xl font-semibold mb-2">Check your email</h2>
        <p className="text-gray-500 text-sm mb-4">
          We sent a confirmation link to <strong>{email}</strong>.
        </p>
        <Link href="/login" className="text-sm font-medium hover:underline" style={{ color: accentColor }}>
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-center mb-1">Create account</h2>
      <p className="text-gray-500 text-center text-sm mb-6">Get started with your atelier</p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">{error}</div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">Full name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </div>

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
              placeholder="Min 6 characters"
              required
              minLength={6}
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
          Create account
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="font-medium hover:underline" style={{ color: accentColor }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
