'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { LanguageSelector } from '@/components/shared/language-selector';
import { WhatsAppLink } from '@/components/shared/whatsapp-link';
import { CreditCard, Loader2, MessageCircle } from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations('platform.settings');
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email || '');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile) setFullName(profile.full_name || '');
    }
    loadProfile();
  }, []);

  async function handleSave() {
    if (!supabase) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleManageBilling() {
    const response = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold mb-6">{t('title')}</h1>

      {/* Profile */}
      <section className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="font-semibold mb-4">{t('profile')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('fullName')}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t('email')}</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2 bg-muted border border-input rounded-md text-sm text-muted-foreground"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-cactus-green hover:bg-cactus-green/90 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {saved ? '✓' : t('saveChanges')}
          </button>
        </div>
      </section>

      {/* Preferences */}
      <section className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="font-semibold mb-4">{t('preferences')}</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm">{t('language')}</span>
          <LanguageSelector />
        </div>
      </section>

      {/* WhatsApp */}
      <section className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          {t('whatsapp')}
        </h2>
        {userId && <WhatsAppLink userId={userId} />}
      </section>

      {/* Billing */}
      <section className="bg-card border border-border rounded-lg p-6">
        <h2 className="font-semibold mb-4">{t('billing')}</h2>
        <button
          onClick={handleManageBilling}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm hover:bg-muted transition-colors"
        >
          <CreditCard className="h-4 w-4" />
          {t('manageBilling')}
        </button>
      </section>
    </div>
  );
}
