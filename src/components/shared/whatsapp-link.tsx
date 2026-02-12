'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Phone, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface WhatsAppLinkProps {
  userId: string;
}

export function WhatsAppLink({ userId }: WhatsAppLinkProps) {
  const t = useTranslations('whatsapp');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [linkedPhone, setLinkedPhone] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [step, setStep] = useState<'idle' | 'code_sent' | 'linked'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load existing phone link
  useEffect(() => {
    async function loadLink() {
      try {
        const res = await fetch('/api/whatsapp/link');
        if (res.ok) {
          const data = await res.json();
          if (data.phone) {
            setLinkedPhone(data.phone);
            setVerified(data.verified);
            setStep('linked');
          }
        }
      } catch {
        // No link exists, that's fine
      } finally {
        setInitialLoading(false);
      }
    }
    loadLink();
  }, []);

  async function handleSendCode() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/whatsapp/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send code');
      setStep('code_sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/whatsapp/link', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      setLinkedPhone(phone);
      setVerified(true);
      setStep('linked');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlink() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/whatsapp/link', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to unlink');
      }
      setLinkedPhone(null);
      setVerified(false);
      setPhone('');
      setCode('');
      setStep('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t('linkDescription')}</p>

      {step === 'linked' && linkedPhone ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {verified ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-sm font-medium">{linkedPhone}</span>
            <span className="text-xs text-muted-foreground">
              {verified ? t('linked') : t('verifyCode')}
            </span>
          </div>
          <button
            onClick={handleUnlink}
            disabled={loading}
            className="text-xs text-destructive hover:underline"
          >
            {t('unlink')}
          </button>
        </div>
      ) : step === 'code_sent' ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('codePlaceholder')}
            className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
            maxLength={6}
          />
          <button
            onClick={handleVerify}
            disabled={loading || code.length < 4}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t('verify')}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
              className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-md text-sm"
            />
          </div>
          <button
            onClick={handleSendCode}
            disabled={loading || phone.length < 8}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t('sendCode')}
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
