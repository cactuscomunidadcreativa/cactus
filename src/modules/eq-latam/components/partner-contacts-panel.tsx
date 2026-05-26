'use client';

import { useState } from 'react';
import { Mail, MailCheck, X, UserPlus, Copy, CheckCircle } from 'lucide-react';
import { PARTNER_CONTACTS } from '..';
import type { Partner, PartnerContact } from '..';

/**
 * Panel inside a partner edit screen that lists existing contacts
 * and lets Eduardo invite new ones. Phase 1: stores in-memory and
 * fakes the magic-link email. Phase 2: wires Supabase Auth +
 * eq_partner_contacts table with real email send.
 */
export function PartnerContactsPanel({ partner }: { partner: Partner }) {
  const [contacts, setContacts] = useState<PartnerContact[]>(() =>
    PARTNER_CONTACTS.filter(c => c.partner_id === partner.id),
  );
  const [inviting, setInviting] = useState(false);
  const [recentlyCopied, setRecentlyCopied] = useState<string | null>(null);

  const handleInvite = async (c: Omit<PartnerContact, 'id' | 'partner_id'>) => {
    const tempId = `${partner.id}-${c.email.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
    const optimistic: PartnerContact = {
      ...c,
      id: tempId,
      partner_id: partner.id,
      invited_at: new Date().toISOString(),
    };
    setContacts(prev => [...prev, optimistic]);
    setInviting(false);

    // Try real Supabase Auth invite via API; falls back silently to in-memory if not configured.
    try {
      const res = await fetch('/api/eq-latam/invite-partner-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: partner.id,
          name: c.name,
          email: c.email,
          role: c.role,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'unknown' }));
        console.warn('[invite-partner-contact] API non-OK:', error);
        PARTNER_CONTACTS.push(optimistic);
      }
    } catch (err) {
      console.warn('[invite-partner-contact] network error, keeping local:', err);
      PARTNER_CONTACTS.push(optimistic);
    }
  };

  const handleCopyMagicLink = (contact: PartnerContact) => {
    const link = `${window.location.origin}/apps/eq-latam/partner/${partner.id}?invite=${contact.id}`;
    navigator.clipboard.writeText(link);
    setRecentlyCopied(contact.id);
    setTimeout(() => setRecentlyCopied(null), 2000);
  };

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <UserPlus className="w-4 h-4" /> Contactos invitados
        </h4>
        <button
          onClick={() => setInviting(true)}
          className="text-xs px-2.5 py-1 bg-eq-blue text-white rounded-lg hover:opacity-90 flex items-center gap-1"
        >
          <Mail className="w-3 h-3" /> Invitar
        </button>
      </div>

      {contacts.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          Aún no hay contactos invitados para {partner.name}.
        </p>
      ) : (
        <div className="space-y-2">
          {contacts.map(c => (
            <div
              key={c.id}
              className="flex items-center justify-between bg-gray-50 border rounded-lg px-3 py-2 text-sm"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {c.email} · {c.role}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {c.accepted_at ? (
                  <span className="flex items-center gap-0.5 text-emerald-600">
                    <CheckCircle className="w-3 h-3" /> Activo
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-amber-600">
                    <MailCheck className="w-3 h-3" /> Pendiente
                  </span>
                )}
                <button
                  onClick={() => handleCopyMagicLink(c)}
                  className="ml-1 p-1 hover:bg-gray-200 rounded"
                  title="Copiar link de invitación"
                >
                  {recentlyCopied === c.id ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {inviting && (
        <InviteContactModal
          partnerName={partner.name}
          onSave={handleInvite}
          onCancel={() => setInviting(false)}
        />
      )}
    </div>
  );
}

function InviteContactModal({
  partnerName,
  onSave,
  onCancel,
}: {
  partnerName: string;
  onSave: (c: Omit<PartnerContact, 'id' | 'partner_id'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'lead' | 'collaborator'>('lead');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSave({ name, email, role, active: true });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Invitar contacto a {partnerName}</h3>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-eq-navy"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Nombre
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-sm border rounded-lg px-3 py-2"
              placeholder="Ana García"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full text-sm border rounded-lg px-3 py-2"
              placeholder="ana@talentadvisors.com"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Rol
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'lead' | 'collaborator')}
              className="w-full text-sm border rounded-lg px-3 py-2 bg-white"
            >
              <option value="lead">Lead — toma decisiones por el partner</option>
              <option value="collaborator">Colaborador — apoya operación</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-800">
            <strong>Preview:</strong> Recibirá un email con magic-link para
            acceder al portal en{' '}
            <code className="font-mono bg-white px-1 rounded">
              /apps/eq-latam/partner/{partnerName.toLowerCase().replace(/\s+/g, '-')}
            </code>
            . Solo verá los datos de este partner.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="text-sm px-4 py-2 bg-eq-blue text-white rounded-lg hover:opacity-90"
            >
              Enviar invitación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
