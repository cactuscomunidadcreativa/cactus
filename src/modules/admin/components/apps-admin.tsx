'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Users,
  Settings,
  Trash2,
  Edit2,
  Save,
  X,
  UserPlus,
  Mail,
  Phone,
  Copy,
  Check,
  Send,
  ChevronDown,
} from 'lucide-react';

interface AppClient {
  id: string;
  app_id: string;
  nombre: string;
  config: Record<string, any>;
  activo: boolean;
  app_client_users?: ClientUser[];
}

interface ClientUser {
  id: string;
  user_id: string;
  nombre_contacto: string;
  email: string;
  phone: string;
  rol: string;
  activo: boolean;
}

interface PendingInvite {
  token: string;
  email?: string;
  phone?: string;
  nombre_contacto?: string;
  rol?: string;
  created_at: string;
  expires_at: string;
}

// Available apps
const APPS = [
  { id: 'agave', name: 'AGAVE', emoji: '🌵', description: 'Asistente de pricing' },
  { id: 'ramona', name: 'RAMONA', emoji: '🎨', description: 'Contenido para redes' },
  { id: 'tuna', name: 'TUNA', emoji: '🐟', description: 'Estados financieros' },
  { id: 'saguaro', name: 'SAGUARO', emoji: '🌿', description: 'Planificacion semanal' },
];

export function AppsAdmin() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [clients, setClients] = useState<AppClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<AppClient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'clients' | 'users'>('clients');

  const fetchClients = useCallback(async (appId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/apps/clients?appId=${appId}`);
      const data = await res.json();

      if (data.clients) {
        setClients(data.clients);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedApp) {
      fetchClients(selectedApp);
    }
  }, [selectedApp, fetchClients]);

  const handleSelectApp = (appId: string) => {
    setSelectedApp(appId);
    setSelectedClient(null);
    setView('clients');
  };

  const handleSelectClient = (client: AppClient) => {
    setSelectedClient(client);
    setView('users');
  };

  return (
    <div className="space-y-6">
      {/* App selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {APPS.map((app) => (
          <button
            key={app.id}
            onClick={() => handleSelectApp(app.id)}
            className={`p-4 rounded-lg border text-left transition-colors ${
              selectedApp === app.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <span className="text-2xl">{app.emoji}</span>
            <h3 className="font-medium mt-2">{app.name}</h3>
            <p className="text-xs text-muted-foreground">{app.description}</p>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {selectedApp && (
        <div className="border rounded-lg p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{APPS.find(a => a.id === selectedApp)?.emoji}</span>
              <h2 className="font-semibold">{APPS.find(a => a.id === selectedApp)?.name}</h2>
              {selectedClient && (
                <>
                  <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
                  <span className="text-muted-foreground">{selectedClient.nombre}</span>
                </>
              )}
            </div>

            {view === 'clients' && (
              <CreateClientButton
                appId={selectedApp}
                onCreated={() => fetchClients(selectedApp)}
              />
            )}

            {view === 'users' && selectedClient && (
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setView('clients');
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Volver a clientes
              </button>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : view === 'clients' ? (
            <ClientsList
              clients={clients}
              onSelect={handleSelectClient}
              onRefresh={() => fetchClients(selectedApp)}
            />
          ) : selectedClient ? (
            <UsersSection
              appId={selectedApp}
              client={selectedClient}
              onRefresh={() => fetchClients(selectedApp)}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

// Create client button with form
function CreateClientButton({
  appId,
  onCreated,
}: {
  appId: string;
  onCreated: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!nombre.trim()) return;

    try {
      setSaving(true);
      const res = await fetch('/api/apps/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, nombre }),
      });

      const data = await res.json();
      if (data.success) {
        setNombre('');
        setShowForm(false);
        onCreated();
      } else {
        alert(data.error || 'Error creando cliente');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Nuevo Cliente
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Nombre del cliente"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="px-3 py-2 border rounded-lg text-sm bg-background"
        autoFocus
      />
      <button
        onClick={handleCreate}
        disabled={saving || !nombre.trim()}
        className="p-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          setShowForm(false);
          setNombre('');
        }}
        className="p-2 text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Clients list
function ClientsList({
  clients,
  onSelect,
  onRefresh,
}: {
  clients: AppClient[];
  onSelect: (client: AppClient) => void;
  onRefresh: () => void;
}) {
  if (clients.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground">
        No hay clientes configurados. Crea uno nuevo para comenzar.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {clients.map((client) => (
        <div
          key={client.id}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 cursor-pointer"
          onClick={() => onSelect(client)}
        >
          <div>
            <p className="font-medium">{client.nombre}</p>
            <p className="text-xs text-muted-foreground">
              {client.app_client_users?.length || 0} usuarios
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${
              client.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {client.activo ? 'Activo' : 'Inactivo'}
            </span>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Users section with invitations
function UsersSection({
  appId,
  client,
  onRefresh,
}: {
  appId: string;
  client: AppClient;
  onRefresh: () => void;
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    phone: '',
    nombreContacto: '',
    rol: 'user',
  });
  const [sending, setSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  useEffect(() => {
    loadPendingInvites();
  }, [client.id]);

  const loadPendingInvites = async () => {
    try {
      const res = await fetch(`/api/apps/invite?clientId=${client.id}`);
      const data = await res.json();
      if (data.invitations) {
        setPendingInvites(data.invitations);
      }
    } catch (err) {
      console.error('Error loading invites:', err);
    }
  };

  const cancelInvite = async (token: string) => {
    if (!confirm('Cancelar esta invitacion?')) return;
    try {
      await fetch(`/api/apps/invite?token=${token}`, { method: 'DELETE' });
      loadPendingInvites();
    } catch (err) {
      console.error('Error canceling invite:', err);
    }
  };

  const handleInvite = async () => {
    if (!inviteForm.email && !inviteForm.phone) {
      alert('Ingresa email o telefono');
      return;
    }

    try {
      setSending(true);
      const res = await fetch('/api/apps/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          clientId: client.id,
          ...inviteForm,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInviteResult(data);
        loadPendingInvites();
        if (data.action === 'assigned') {
          alert('Usuario existente asignado al cliente');
          onRefresh();
          setShowInvite(false);
        }
      } else {
        alert(data.error || 'Error enviando invitacion');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const users = client.app_client_users || [];

  return (
    <div className="space-y-6">
      {/* Current users */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Usuarios con acceso</h3>
          <button
            onClick={() => {
              setShowInvite(!showInvite);
              setInviteResult(null);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            <UserPlus className="w-4 h-4" />
            Invitar Usuario
          </button>
        </div>

        {users.length > 0 ? (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{u.nombre_contacto || u.email || 'Sin nombre'}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.email && <span className="mr-2">{u.email}</span>}
                    {u.rol === 'admin' ? 'Administrador' : 'Usuario'}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay usuarios asignados. Invita usuarios para que accedan.
          </p>
        )}
      </div>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Invitaciones pendientes</h3>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div
                key={inv.token}
                className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <div>
                  <p className="font-medium text-amber-800">
                    {inv.nombre_contacto || inv.email || inv.phone || 'Sin nombre'}
                  </p>
                  <p className="text-xs text-amber-600">
                    {inv.email && <span className="mr-2">{inv.email}</span>}
                    {inv.phone && <span>{inv.phone}</span>}
                  </p>
                  <p className="text-xs text-amber-500 mt-1">
                    Expira: {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                    Pendiente
                  </span>
                  <button
                    onClick={() => cancelInvite(inv.token)}
                    className="p-1 text-amber-600 hover:text-red-600"
                    title="Cancelar invitacion"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite form */}
      {showInvite && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          <h4 className="font-medium">Nueva invitacion</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="+51 999 999 999"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre de contacto</label>
              <input
                type="text"
                placeholder="Juan Perez"
                value={inviteForm.nombreContacto}
                onChange={(e) => setInviteForm({ ...inviteForm, nombreContacto: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Rol</label>
              <select
                value={inviteForm.rol}
                onChange={(e) => setInviteForm({ ...inviteForm, rol: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleInvite}
              disabled={sending || (!inviteForm.email && !inviteForm.phone)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Creando...' : 'Crear Invitacion'}
            </button>
            <button
              onClick={() => {
                setShowInvite(false);
                setInviteResult(null);
              }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Invite result */}
      {inviteResult && inviteResult.inviteUrl && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-green-800">Invitacion creada</h4>

          <div>
            <label className="block text-sm font-medium text-green-700 mb-1">Link de invitacion:</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteResult.inviteUrl}
                className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm"
              />
              <button
                onClick={() => copyToClipboard(inviteResult.inviteUrl)}
                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* WhatsApp template */}
          <div className="pt-2 border-t border-green-200">
            <label className="block text-sm font-medium text-green-700 mb-1">
              Mensaje para WhatsApp:
            </label>
            <div className="relative">
              <textarea
                readOnly
                value={inviteResult.whatsappTemplate}
                rows={4}
                className="w-full px-3 py-2 bg-white border border-green-300 rounded-lg text-sm resize-none"
              />
              <button
                onClick={() => copyToClipboard(inviteResult.whatsappTemplate)}
                className="absolute top-2 right-2 p-1 bg-green-100 rounded hover:bg-green-200"
              >
                <Copy className="w-4 h-4 text-green-700" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
