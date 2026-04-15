'use client'

import { useState } from 'react'
import { Search, UserPlus, Check, X, Loader2, Shield, Mail } from 'lucide-react'

const ALL_APPS = [
  { id: 'cereus', name: 'CEREUS', emoji: '🌸' },
  { id: 'ramona', name: 'RAMONA', emoji: '🎨' },
  { id: 'pita', name: 'PITA', emoji: '📊' },
  { id: 'weekflow', name: 'WEEKFLOW', emoji: '📅' },
  { id: 'agave', name: 'AGAVE', emoji: '🌵' },
  { id: 'tuna', name: 'TUNA', emoji: '🐟' },
  { id: 'saguaro', name: 'SAGUARO', emoji: '🌿' },
]

interface UserSub {
  app_id: string
  status: string
}

interface FoundUser {
  id: string
  email: string
  created_at: string
  full_name?: string
  role?: string
  subscriptions: UserSub[]
}

export function UserManager() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<FoundUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function searchUser() {
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    setUser(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(email.trim())}`)
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
      } else {
        setError(data.error || 'Usuario no encontrado. Debe registrarse primero.')
      }
    } catch {
      setError('Error buscando usuario')
    }
    setLoading(false)
  }

  async function toggleApp(appId: string, activate: boolean) {
    if (!user) return
    setSaving(true)
    setSuccess(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          appId,
          action: activate ? 'activate' : 'deactivate',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(`${activate ? 'Activada' : 'Desactivada'} ${appId} para ${user.email}`)
        // Refresh user data
        const res2 = await fetch(`/api/admin/users?email=${encodeURIComponent(user.email)}`)
        const data2 = await res2.json()
        if (data2.user) setUser(data2.user)
      } else {
        setError(data.error || 'Error actualizando')
      }
    } catch {
      setError('Error actualizando')
    }
    setSaving(false)
  }

  async function activateAll() {
    if (!user) return
    setSaving(true)
    setSuccess(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          action: 'activate-all',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(`Todas las apps activadas para ${user.email}`)
        const res2 = await fetch(`/api/admin/users?email=${encodeURIComponent(user.email)}`)
        const data2 = await res2.json()
        if (data2.user) setUser(data2.user)
      } else {
        setError(data.error || 'Error')
      }
    } catch {
      setError('Error activando apps')
    }
    setSaving(false)
  }

  const hasApp = (appId: string) => user?.subscriptions?.some(s => s.app_id === appId && s.status === 'active')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Gestionar Usuarios</h2>
        <p className="text-sm text-muted-foreground">Busca un usuario por email y activa/desactiva apps</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchUser()}
            placeholder="Email del usuario... ej: malu@privat.pe"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button
          onClick={searchUser}
          disabled={loading || !email.trim()}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Buscar
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-200 rounded-lg text-sm text-green-600">{success}</div>
      )}

      {/* User found */}
      {user && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{user.full_name || user.email}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Rol: <span className="font-medium">{user.role || 'user'}</span>
                {' · '}Registrado: {new Date(user.created_at).toLocaleDateString('es')}
              </p>
            </div>
            <button
              onClick={activateAll}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Activar Todas
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {ALL_APPS.map(app => {
              const active = hasApp(app.id)
              return (
                <button
                  key={app.id}
                  onClick={() => toggleApp(app.id, !active)}
                  disabled={saving}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    active
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <span className="text-2xl block">{app.emoji}</span>
                  <p className="text-xs font-semibold mt-1">{app.name}</p>
                  <p className={`text-[10px] mt-0.5 font-medium ${active ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {active ? '✓ Activa' : 'Inactiva'}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
