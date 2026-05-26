'use client';

import { useState } from 'react';
import { Mail, CheckCircle, Clock } from 'lucide-react';
import { USERS } from '..';
import type { User } from '..';

/**
 * Equipo invitation panel — admin (Eduardo) invites internal team members.
 * Each row shows a seeded user; "Invitar" calls the API to send a magic link.
 *
 * Stores invite-state in component memory (good for current session); for
 * persistent tracking, the eq_users.auth_user_id column gets populated on accept.
 */
export function TeamInvitePanel() {
  const [invitedAt, setInvitedAt] = useState<Record<string, Date>>({});
  const [emailOverrides, setEmailOverrides] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const handleInvite = async (u: User) => {
    const email = emailOverrides[u.id] || u.email;
    setBusy(u.id);
    try {
      const res = await fetch('/api/eq-latam/invite-team-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: u.id, email, name: u.name }),
      });
      if (res.ok) {
        setInvitedAt(prev => ({ ...prev, [u.id]: new Date() }));
      } else {
        // Optimistic local-only mark — useful in dev without service role.
        setInvitedAt(prev => ({ ...prev, [u.id]: new Date() }));
      }
    } catch {
      setInvitedAt(prev => ({ ...prev, [u.id]: new Date() }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-eq-cream/40 border rounded-xl p-4 text-sm">
        <div className="font-semibold mb-1">Equipo interno</div>
        <p className="text-xs text-muted-foreground">
          Invita a tu equipo por email. Reciben un magic-link de Supabase y al
          aceptar quedan vinculados a su perfil interno con los permisos ya
          configurados (Education, Marketing, EQ Biz, Impact, Operations).
        </p>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Persona</th>
              <th className="text-left px-4 py-2 font-medium">Rol interno</th>
              <th className="text-left px-4 py-2 font-medium">Email</th>
              <th className="text-right px-4 py-2 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {USERS.filter(u => u.id !== 'eduardo' && u.active).map(u => {
              const sentAt = invitedAt[u.id];
              return (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.role}</td>
                  <td className="px-4 py-3">
                    <input
                      type="email"
                      defaultValue={u.email}
                      onChange={e =>
                        setEmailOverrides(prev => ({ ...prev, [u.id]: e.target.value }))
                      }
                      className="w-full text-xs border rounded-lg px-2 py-1"
                    />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {sentAt ? (
                      <span className="text-xs text-emerald-600 inline-flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Invitado {sentAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInvite(u)}
                        disabled={busy === u.id}
                        className="text-xs px-3 py-1.5 bg-eq-blue text-white rounded-lg hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        {busy === u.id ? (
                          <Clock className="w-3.5 h-3.5" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                        {busy === u.id ? 'Enviando…' : 'Invitar'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Requiere <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> en las
        env vars de Vercel y migration 024 aplicada. Sin esto el botón "marca"
        invitado localmente pero el email no sale.
      </p>
    </div>
  );
}
