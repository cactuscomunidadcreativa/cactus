'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Save, CheckCircle2, XCircle } from 'lucide-react';
import type { PlatformConfig } from '../types';

interface ConfigPanelProps {
  configs: PlatformConfig[];
  onSave: (key: string, value: string) => Promise<boolean>;
}

const API_KEY_CONFIGS = [
  { key: 'anthropic_api_key', labelKey: 'anthropicKey' },
  { key: 'openai_api_key', labelKey: 'openaiKey' },
];

const WA_KEY_CONFIGS = [
  { key: 'twilio_account_sid', labelKey: 'twilioSid' },
  { key: 'twilio_auth_token', labelKey: 'twilioToken' },
  { key: 'twilio_phone_number', labelKey: 'twilioPhone', notSecret: true },
  { key: 'wa_verify_token', labelKey: 'waVerifyToken', notSecret: true },
];

const SETTING_CONFIGS = [
  { key: 'ai_default_provider', labelKey: 'defaultProvider', type: 'select', options: ['claude', 'openai'] },
  { key: 'ai_fallback_enabled', labelKey: 'fallbackEnabled', type: 'toggle' },
  { key: 'global_monthly_token_limit', labelKey: 'globalTokenLimit', type: 'number' },
  { key: 'global_monthly_generation_limit', labelKey: 'globalGenLimit', type: 'number' },
];

const MASKED_VALUE = '••••••••';

export function ConfigPanel({ configs, onSave }: ConfigPanelProps) {
  const t = useTranslations('admin.config');
  // Track which keys had a masked (encrypted) value from the server
  const [maskedKeys] = useState<Set<string>>(() => {
    const set = new Set<string>();
    for (const c of configs) {
      if (c.value === MASKED_VALUE) set.add(c.key);
    }
    return set;
  });
  // Track which keys were edited by the user (dirty)
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const c of configs) {
      // For masked keys, start with empty string (user must type the new key)
      map[c.key] = c.value === MASKED_VALUE ? '' : c.value;
    }
    return map;
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirtyKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  async function handleSave(key: string) {
    // If this key was masked and user didn't edit it, skip
    if (maskedKeys.has(key) && !dirtyKeys.has(key)) {
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
      return;
    }
    setSaving(key);
    const success = await onSave(key, values[key] || '');
    setSaving(null);
    if (success) {
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    }
  }

  function getConfigValue(key: string): string {
    return values[key] || '';
  }

  // A key is "configured" if:
  // - It was masked from server (meaning it has a real value in DB), OR
  // - The user typed something new
  function isKeyConfigured(key: string): boolean {
    const currentVal = getConfigValue(key);
    if (maskedKeys.has(key) && !dirtyKeys.has(key)) return true;
    return !!currentVal;
  }

  function renderKeyInput(key: string, labelKey: string, isSecret = true) {
    const hasSavedValue = maskedKeys.has(key);
    const isDirty = dirtyKeys.has(key);
    const configured = isKeyConfigured(key);

    return (
      <div key={key} className="space-y-2">
        <label className="text-sm font-medium">{t(labelKey)}</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={isSecret && !showKeys[key] ? 'password' : 'text'}
              value={getConfigValue(key)}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={hasSavedValue && !isDirty ? t('keyConfigured') : t('placeholder')}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm pr-10"
            />
            {isSecret && (
              <button
                onClick={() => setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKeys[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
          <button
            onClick={() => handleSave(key)}
            disabled={saving === key}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {saved === key ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved === key ? t('saved') : t('save')}
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {configured ? (
            <><CheckCircle2 className="w-3 h-3 text-green-500" /><span className="text-green-600">{t('connected')}</span></>
          ) : (
            <><XCircle className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">{t('notConnected')}</span></>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* API Keys */}
      <div>
        <h3 className="text-sm font-medium mb-1">{t('apiKeys')}</h3>
        <p className="text-xs text-muted-foreground mb-4">{t('description')}</p>
        <div className="space-y-4">
          {API_KEY_CONFIGS.map(({ key, labelKey }) => renderKeyInput(key, labelKey))}
        </div>
      </div>

      {/* AI Settings */}
      <div>
        <h3 className="text-sm font-medium mb-4">{t('aiSettings')}</h3>
        <div className="space-y-4">
          {SETTING_CONFIGS.map(({ key, labelKey, type, options }) => (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm">{t(labelKey)}</label>
              <div className="flex items-center gap-2">
                {type === 'select' && options && (
                  <select
                    value={getConfigValue(key) || options[0]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="px-3 py-1.5 bg-background border border-input rounded-md text-sm"
                  >
                    {options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {type === 'toggle' && (
                  <button
                    onClick={() => {
                      const current = getConfigValue(key);
                      handleChange(key, current === 'true' ? 'false' : 'true');
                    }}
                    className={`w-10 h-5 rounded-full transition-colors ${getConfigValue(key) === 'true' ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${getConfigValue(key) === 'true' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                )}
                {type === 'number' && (
                  <input
                    type="number"
                    value={getConfigValue(key) || '-1'}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-32 px-3 py-1.5 bg-background border border-input rounded-md text-sm text-right"
                    min={-1}
                  />
                )}
                <button
                  onClick={() => handleSave(key)}
                  disabled={saving === key}
                  className="p-1.5 text-muted-foreground hover:text-foreground"
                >
                  {saved === key ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Save className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp / Twilio */}
      <div>
        <h3 className="text-sm font-medium mb-1">{t('whatsappConfig')}</h3>
        <p className="text-xs text-muted-foreground mb-4">{t('whatsappDescription')}</p>
        <div className="space-y-4">
          {WA_KEY_CONFIGS.map(({ key, labelKey, notSecret }) =>
            renderKeyInput(key, labelKey, !notSecret)
          )}
        </div>
      </div>
    </div>
  );
}
