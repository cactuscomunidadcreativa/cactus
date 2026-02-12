-- =====================================================
-- App Clients System - Multi-tenant support for all apps
-- =====================================================

-- Table for app client companies (works for RAMONA, TUNA, SAGUARO, etc.)
CREATE TABLE IF NOT EXISTS app_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL, -- 'ramona', 'tuna', 'saguaro', etc.
  nombre TEXT NOT NULL,

  -- Configuracion general
  config JSONB DEFAULT '{}',

  -- Estado
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table for users assigned to app clients
CREATE TABLE IF NOT EXISTS app_client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES app_clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  nombre_contacto TEXT,
  email TEXT,
  phone TEXT,
  rol TEXT DEFAULT 'user', -- 'admin', 'user', 'viewer'

  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(client_id, user_id)
);

-- Table for app invitations (generic for all apps)
CREATE TABLE IF NOT EXISTS app_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  app_id TEXT NOT NULL,
  client_id UUID REFERENCES app_clients(id) ON DELETE CASCADE,

  email TEXT,
  phone TEXT,
  nombre_contacto TEXT,
  rol TEXT DEFAULT 'user',

  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_app_clients_app ON app_clients(app_id);
CREATE INDEX IF NOT EXISTS idx_app_clients_activo ON app_clients(activo);
CREATE INDEX IF NOT EXISTS idx_app_client_users_user ON app_client_users(user_id);
CREATE INDEX IF NOT EXISTS idx_app_client_users_client ON app_client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_app_invitations_token ON app_invitations(token);
CREATE INDEX IF NOT EXISTS idx_app_invitations_client ON app_invitations(client_id);

-- Enable RLS
ALTER TABLE app_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_clients
CREATE POLICY "Super admin can manage all app clients" ON app_clients
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can view their assigned clients" ON app_clients
  FOR SELECT USING (
    id IN (SELECT client_id FROM app_client_users WHERE user_id = auth.uid() AND activo = true)
  );

-- RLS Policies for app_client_users
CREATE POLICY "Super admin can manage all client users" ON app_client_users
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can view their own assignments" ON app_client_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Client admins can view their client users" ON app_client_users
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM app_client_users
      WHERE user_id = auth.uid() AND rol = 'admin' AND activo = true
    )
  );

-- RLS Policies for app_invitations
CREATE POLICY "Super admin can manage invitations" ON app_invitations
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Anyone can view invitation by token" ON app_invitations
  FOR SELECT USING (true);

-- Helper function to get user's client for an app
CREATE OR REPLACE FUNCTION get_user_app_client(p_user_id UUID, p_app_id TEXT)
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  user_rol TEXT,
  config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as client_id,
    c.nombre as client_name,
    cu.rol as user_rol,
    c.config
  FROM app_clients c
  JOIN app_client_users cu ON cu.client_id = c.id
  WHERE cu.user_id = p_user_id
    AND c.app_id = p_app_id
    AND c.activo = true
    AND cu.activo = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has access to an app
CREATE OR REPLACE FUNCTION user_has_app_access(p_user_id UUID, p_app_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM app_clients c
    JOIN app_client_users cu ON cu.client_id = c.id
    WHERE cu.user_id = p_user_id
      AND c.app_id = p_app_id
      AND c.activo = true
      AND cu.activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
