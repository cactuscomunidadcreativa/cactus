'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Upload,
  Users,
  Package,
  Settings,
  MessageSquare,
  Trash2,
  Edit2,
  Save,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Mail,
  Phone,
  Copy,
  Check,
  Send,
} from 'lucide-react';

interface AgaveClient {
  id: string;
  nombre: string;
  mensajes: Record<string, Record<string, string>>;
  idioma_default: string;
  margen_objetivo: number;
  tipo_costo_default: string;
  moneda: string;
  rangos_margen: any[];
  activo: boolean;
  agave_client_users?: AgaveClientUser[];
}

interface AgaveClientUser {
  id: string;
  user_id: string;
  nombre_contacto: string;
  rol: string;
  activo: boolean;
}

interface AgaveProduct {
  id: string;
  client_id: string;
  codigo: string;
  nombre: string;
  proveedor: string;
  costo_fob: number;
  costo_cif: number;
  costo_internado: number;
  costo_puesto_cliente: number;
  activo: boolean;
}

type AdminSection = 'clients' | 'products' | 'users' | 'config' | 'messages';

export function AgaveAdmin() {
  const [section, setSection] = useState<AdminSection>('clients');
  const [clients, setClients] = useState<AgaveClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<AgaveClient | null>(null);
  const [products, setProducts] = useState<AgaveProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agave/clients');
      const data = await res.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (clientId: string) => {
    try {
      const res = await fetch(`/api/agave/products?clientId=${clientId}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelectClient = (client: AgaveClient) => {
    setSelectedClient(client);
    fetchProducts(client.id);
    setSection('products');
  };

  const sections = [
    { id: 'clients' as AdminSection, icon: Users, label: 'Clientes' },
    { id: 'products' as AdminSection, icon: Package, label: 'Productos', requiresClient: true },
    { id: 'users' as AdminSection, icon: UserPlus, label: 'Usuarios', requiresClient: true },
    { id: 'config' as AdminSection, icon: Settings, label: 'Configuracion', requiresClient: true },
    { id: 'messages' as AdminSection, icon: MessageSquare, label: 'Mensajes', requiresClient: true },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌵</span>
          <h2 className="text-lg font-semibold">AGAVE Admin</h2>
          {selectedClient && (
            <span className="text-sm text-muted-foreground">
              | {selectedClient.nombre}
            </span>
          )}
        </div>
        {selectedClient && (
          <button
            onClick={() => {
              setSelectedClient(null);
              setSection('clients');
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Volver a clientes
          </button>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {sections
          .filter(s => !s.requiresClient || selectedClient)
          .map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setSection(sec.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  section === sec.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {sec.label}
              </button>
            );
          })}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Section content */}
      {section === 'clients' && (
        <ClientsSection
          clients={clients}
          onSelectClient={handleSelectClient}
          onRefresh={fetchClients}
        />
      )}
      {section === 'products' && selectedClient && (
        <ProductsSection
          client={selectedClient}
          products={products}
          onRefresh={() => fetchProducts(selectedClient.id)}
        />
      )}
      {section === 'users' && selectedClient && (
        <UsersSection client={selectedClient} onRefresh={fetchClients} />
      )}
      {section === 'config' && selectedClient && (
        <ConfigSection
          client={selectedClient}
          onUpdate={(updated) => {
            setSelectedClient(updated);
            fetchClients();
          }}
        />
      )}
      {section === 'messages' && selectedClient && (
        <MessagesSection
          client={selectedClient}
          onUpdate={(updated) => {
            setSelectedClient(updated);
            fetchClients();
          }}
        />
      )}
    </div>
  );
}

// === CLIENTS SECTION ===
function ClientsSection({
  clients,
  onSelectClient,
  onRefresh,
}: {
  clients: AgaveClient[];
  onSelectClient: (client: AgaveClient) => void;
  onRefresh: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newClient, setNewClient] = useState({ nombre: '' });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newClient.nombre.trim()) return;
    try {
      setCreating(true);
      const res = await fetch('/api/agave/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });
      if (res.ok) {
        setNewClient({ nombre: '' });
        setShowCreate(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {showCreate && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <input
            type="text"
            placeholder="Nombre del cliente (empresa)"
            value={newClient.nombre}
            onChange={(e) => setNewClient({ ...newClient, nombre: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating || !newClient.nombre.trim()}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50"
            >
              {creating ? 'Creando...' : 'Crear Cliente'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {clients.map((client) => (
          <div
            key={client.id}
            onClick={() => onSelectClient(client)}
            className="bg-card border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{client.nombre}</h3>
                <p className="text-sm text-muted-foreground">
                  {client.agave_client_users?.length || 0} usuario(s) |
                  Margen: {(client.margen_objetivo * 100).toFixed(0)}% |
                  {client.moneda}
                </p>
              </div>
              <div className={`px-2 py-1 rounded text-xs ${client.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {client.activo ? 'Activo' : 'Inactivo'}
              </div>
            </div>
          </div>
        ))}

        {clients.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No hay clientes registrados. Crea uno para comenzar.
          </div>
        )}
      </div>
    </div>
  );
}

// === PRODUCTS SECTION ===
function ProductsSection({
  client,
  products,
  onRefresh,
}: {
  client: AgaveClient;
  products: AgaveProduct[];
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', client.id);

      const res = await fetch('/api/agave/products', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        onRefresh();
        alert(`Importados ${data.imported} productos`);
      } else {
        alert(data.error || 'Error al importar');
      }
    } catch (err) {
      console.error(err);
      alert('Error al subir archivo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigo && p.codigo.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
          />
        </div>
        <label className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium cursor-pointer hover:bg-primary/90">
          <Upload className="w-4 h-4" />
          {uploading ? 'Subiendo...' : 'Subir Excel'}
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <p className="text-sm text-muted-foreground">
        {filteredProducts.length} de {products.length} productos
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2">Codigo</th>
              <th className="text-left py-2 px-2">Producto</th>
              <th className="text-left py-2 px-2">Proveedor</th>
              <th className="text-right py-2 px-2">FOB</th>
              <th className="text-right py-2 px-2">CIF</th>
              <th className="text-right py-2 px-2">Internado</th>
              <th className="text-right py-2 px-2">Cliente</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="border-b hover:bg-muted/50">
                <td className="py-2 px-2 font-mono text-xs">{product.codigo || '-'}</td>
                <td className="py-2 px-2">{product.nombre}</td>
                <td className="py-2 px-2 text-muted-foreground">{product.proveedor || '-'}</td>
                <td className="py-2 px-2 text-right">{product.costo_fob?.toFixed(2) || '-'}</td>
                <td className="py-2 px-2 text-right">{product.costo_cif?.toFixed(2) || '-'}</td>
                <td className="py-2 px-2 text-right">{product.costo_internado?.toFixed(2) || '-'}</td>
                <td className="py-2 px-2 text-right">{product.costo_puesto_cliente?.toFixed(2) || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No hay productos. Sube un Excel para importar.
        </div>
      )}
    </div>
  );
}

// === CONFIG SECTION ===
function ConfigSection({
  client,
  onUpdate,
}: {
  client: AgaveClient;
  onUpdate: (client: AgaveClient) => void;
}) {
  const [form, setForm] = useState({
    margen_objetivo: client.margen_objetivo * 100,
    tipo_costo_default: client.tipo_costo_default,
    moneda: client.moneda,
    idioma_default: client.idioma_default,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/agave/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          margen_objetivo: form.margen_objetivo / 100,
          tipo_costo_default: form.tipo_costo_default,
          moneda: form.moneda,
          idioma_default: form.idioma_default,
        }),
      });
      const data = await res.json();
      if (data.client) {
        onUpdate(data.client);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Margen Objetivo (%)</label>
        <input
          type="range"
          min="10"
          max="50"
          value={form.margen_objetivo}
          onChange={(e) => setForm({ ...form, margen_objetivo: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>10%</span>
          <span className="font-medium text-foreground">{form.margen_objetivo}%</span>
          <span>50%</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tipo de Costo Default</label>
        <select
          value={form.tipo_costo_default}
          onChange={(e) => setForm({ ...form, tipo_costo_default: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg bg-background"
        >
          <option value="FOB">FOB</option>
          <option value="CIF">CIF</option>
          <option value="INTERNADO">Internado</option>
          <option value="PUESTO_CLIENTE">Puesto en Cliente</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Moneda</label>
        <select
          value={form.moneda}
          onChange={(e) => setForm({ ...form, moneda: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg bg-background"
        >
          <option value="USD">USD - Dolares</option>
          <option value="PEN">PEN - Soles</option>
          <option value="EUR">EUR - Euros</option>
          <option value="MXN">MXN - Pesos Mexicanos</option>
          <option value="COP">COP - Pesos Colombianos</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Idioma Default</label>
        <select
          value={form.idioma_default}
          onChange={(e) => setForm({ ...form, idioma_default: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg bg-background"
        >
          <option value="es">Espanol</option>
          <option value="en">English</option>
          <option value="pt">Portugues</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Guardando...' : 'Guardar Configuracion'}
      </button>
    </div>
  );
}

// === MESSAGES SECTION ===
function MessagesSection({
  client,
  onUpdate,
}: {
  client: AgaveClient;
  onUpdate: (client: AgaveClient) => void;
}) {
  const [idioma, setIdioma] = useState(client.idioma_default || 'es');
  const [mensajes, setMensajes] = useState(client.mensajes || {});
  const [saving, setSaving] = useState(false);

  const currentMessages = mensajes[idioma] || {
    saludo: '',
    sin_productos: '',
    precio_bajo: '',
    precio_bueno: '',
  };

  const updateMessage = (key: string, value: string) => {
    setMensajes({
      ...mensajes,
      [idioma]: {
        ...currentMessages,
        [key]: value,
      },
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/agave/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: client.id,
          mensajes,
        }),
      });
      const data = await res.json();
      if (data.client) {
        onUpdate(data.client);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const messageFields = [
    { key: 'saludo', label: 'Saludo', placeholder: 'Hola {nombre}, bienvenido a AGAVE...' },
    { key: 'sin_productos', label: 'Producto no encontrado', placeholder: 'No encontre ese producto...' },
    { key: 'precio_bajo', label: 'Precio por debajo del margen', placeholder: 'Este precio esta por debajo...' },
    { key: 'precio_bueno', label: 'Precio con buen margen', placeholder: 'Este precio tiene un margen saludable...' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Idioma:</label>
        <select
          value={idioma}
          onChange={(e) => setIdioma(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-background"
        >
          <option value="es">Espanol</option>
          <option value="en">English</option>
          <option value="pt">Portugues</option>
        </select>
      </div>

      <p className="text-sm text-muted-foreground">
        Variables disponibles: {'{nombre}'}, {'{producto}'}, {'{precio}'}, {'{margen}'}
      </p>

      <div className="space-y-4">
        {messageFields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium mb-2">{field.label}</label>
            <textarea
              value={currentMessages[field.key] || ''}
              onChange={(e) => updateMessage(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg bg-background resize-none"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Guardando...' : 'Guardar Mensajes'}
      </button>
    </div>
  );
}

// === USERS SECTION (Invitations) ===
interface PendingInvite {
  token: string;
  email?: string;
  phone?: string;
  nombreContacto?: string;
  rol?: string;
  createdAt: string;
  expiresAt: string;
}

function UsersSection({
  client,
  onRefresh,
}: {
  client: AgaveClient;
  onRefresh: () => void;
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    phone: '',
    nombreContacto: '',
    rol: 'user',
    sendVia: 'link',
  });
  const [sending, setSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  // Load pending invites
  useEffect(() => {
    loadPendingInvites();
  }, [client.id]);

  const loadPendingInvites = async () => {
    try {
      const res = await fetch(`/api/agave/invite?clientId=${client.id}`);
      const data = await res.json();
      if (data.invitations) {
        setPendingInvites(data.invitations);
      }
    } catch (err) {
      console.error('Error loading invites:', err);
    } finally {
      setLoadingInvites(false);
    }
  };

  const cancelInvite = async (token: string) => {
    if (!confirm('Cancelar esta invitacion?')) return;
    try {
      await fetch(`/api/agave/invite?token=${token}`, { method: 'DELETE' });
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
      const res = await fetch('/api/agave/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          ...inviteForm,
          idioma: client.idioma_default || 'es',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInviteResult(data);
        loadPendingInvites(); // Refresh pending invites
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

  const users = client.agave_client_users || [];

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
                  <p className="font-medium">{u.nombre_contacto || 'Sin nombre'}</p>
                  <p className="text-sm text-muted-foreground">
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
            No hay usuarios asignados. Invita usuarios para que accedan a AGAVE.
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
                    {inv.nombreContacto || inv.email || inv.phone || 'Sin nombre'}
                  </p>
                  <p className="text-xs text-amber-600">
                    {inv.email && <span className="mr-2">{inv.email}</span>}
                    {inv.phone && <span>{inv.phone}</span>}
                  </p>
                  <p className="text-xs text-amber-500 mt-1">
                    Expira: {new Date(inv.expiresAt).toLocaleDateString()}
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

          <div>
            <label className="block text-sm font-medium mb-2">Enviar via</label>
            <div className="flex gap-2">
              {[
                { value: 'link', label: 'Solo link', icon: Copy },
                { value: 'email', label: 'Email', icon: Mail },
                { value: 'whatsapp', label: 'WhatsApp', icon: Phone },
                { value: 'both', label: 'Ambos', icon: Send },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setInviteForm({ ...inviteForm, sendVia: option.value })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                      inviteForm.sendVia === option.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleInvite}
              disabled={sending || (!inviteForm.email && !inviteForm.phone)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Enviando...' : 'Enviar Invitacion'}
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

          {inviteResult.sentVia?.length > 0 && (
            <p className="text-sm text-green-700">
              Enviado via: {inviteResult.sentVia.join(', ')}
            </p>
          )}

          {inviteResult.whatsappError && (
            <p className="text-sm text-amber-600">
              WhatsApp: {inviteResult.whatsappError}
            </p>
          )}

          {inviteResult.emailError && (
            <p className="text-sm text-amber-600">
              Email: {inviteResult.emailError}
            </p>
          )}

          {/* WhatsApp template for manual sharing */}
          <div className="pt-2 border-t border-green-200">
            <label className="block text-sm font-medium text-green-700 mb-1">
              Mensaje para WhatsApp (copia y envia manualmente):
            </label>
            <div className="relative">
              <textarea
                readOnly
                value={inviteResult.whatsappTemplate}
                rows={5}
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
