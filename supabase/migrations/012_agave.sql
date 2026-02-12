-- ============================================
-- AGAVE - Pricing Assistant Tables
-- ============================================

-- Clientes AGAVE (cada empresa es un cliente)
-- Múltiples usuarios pueden pertenecer al mismo cliente
CREATE TABLE public.agave_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,

  -- Mensajes personalizados por idioma (NO IA, pre-configurados)
  mensajes JSONB DEFAULT '{
    "es": {
      "saludo": "Hola {nombre}, bienvenido a AGAVE. ¿En qué te ayudo hoy?",
      "sin_productos": "No encontré ese producto. ¿Quieres ver el catálogo completo?",
      "precio_bajo": "⚠️ Este precio está por debajo del margen recomendado.",
      "precio_bueno": "✅ Este precio tiene un margen saludable."
    },
    "en": {
      "saludo": "Hi {nombre}, welcome to AGAVE. How can I help you today?",
      "sin_productos": "I couldn''t find that product. Want to see the full catalog?",
      "precio_bajo": "⚠️ This price is below the recommended margin.",
      "precio_bueno": "✅ This price has a healthy margin."
    },
    "pt": {
      "saludo": "Olá {nombre}, bem-vindo ao AGAVE. Como posso ajudar hoje?",
      "sin_productos": "Não encontrei esse produto. Quer ver o catálogo completo?",
      "precio_bajo": "⚠️ Este preço está abaixo da margem recomendada.",
      "precio_bueno": "✅ Este preço tem uma margem saudável."
    }
  }',
  idioma_default TEXT DEFAULT 'es',

  -- Configuración del cliente
  margen_objetivo DECIMAL(5,4) DEFAULT 0.27,
  tipo_costo_default TEXT DEFAULT 'CIF',
  moneda TEXT DEFAULT 'USD',

  -- Rangos personalizados (JSONB)
  rangos_margen JSONB DEFAULT '[
    {"nombre": "Critico", "min": 0, "max": 0.10, "color": "#DC2626"},
    {"nombre": "Muy Bajo", "min": 0.10, "max": 0.15, "color": "#EA580C"},
    {"nombre": "Bajo", "min": 0.15, "max": 0.20, "color": "#F59E0B"},
    {"nombre": "Aceptable", "min": 0.20, "max": 0.27, "color": "#84CC16"},
    {"nombre": "Bueno", "min": 0.27, "max": 0.32, "color": "#22C55E"},
    {"nombre": "Muy Bueno", "min": 0.32, "max": 0.38, "color": "#14B8A6"},
    {"nombre": "Sobresaliente", "min": 0.38, "max": 0.45, "color": "#0EA5E9"},
    {"nombre": "Excelente", "min": 0.45, "max": 1, "color": "#8B5CF6"}
  ]',

  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Usuarios asignados a clientes AGAVE (many-to-many)
-- Múltiples usuarios pueden acceder al mismo cliente AGAVE
CREATE TABLE public.agave_client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.agave_clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre_contacto TEXT,  -- "Jesús", "María", etc. (nombre personalizado para saludos)
  rol TEXT DEFAULT 'user',  -- 'admin', 'user' (rol dentro del cliente)
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, user_id)
);

-- Productos por cliente
CREATE TABLE public.agave_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.agave_clients(id) ON DELETE CASCADE NOT NULL,

  codigo TEXT,
  nombre TEXT NOT NULL,
  proveedor TEXT,

  -- Costos
  costo_fob DECIMAL(12,4),
  costo_cif DECIMAL(12,4),
  costo_internado DECIMAL(12,4),
  costo_puesto_cliente DECIMAL(12,4),

  -- Precios por categoría (calculados automáticamente o manuales)
  precio_critico DECIMAL(12,4),
  precio_muy_bajo DECIMAL(12,4),
  precio_bajo DECIMAL(12,4),
  precio_aceptable DECIMAL(12,4),
  precio_bueno DECIMAL(12,4),
  precio_muy_bueno DECIMAL(12,4),
  precio_sobresaliente DECIMAL(12,4),
  precio_excelente DECIMAL(12,4),

  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Historial de consultas por cliente
CREATE TABLE public.agave_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.agave_clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- quien hizo la consulta
  producto_id UUID REFERENCES public.agave_products(id) ON DELETE SET NULL,
  pregunta TEXT,
  costo_consultado DECIMAL(12,4),
  precio_recomendado DECIMAL(12,4),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_agave_clients_activo ON public.agave_clients(activo);
CREATE INDEX idx_agave_client_users_client ON public.agave_client_users(client_id);
CREATE INDEX idx_agave_client_users_user ON public.agave_client_users(user_id);
CREATE INDEX idx_agave_client_users_lookup ON public.agave_client_users(user_id, activo);
CREATE INDEX idx_agave_products_client ON public.agave_products(client_id);
CREATE INDEX idx_agave_products_activo ON public.agave_products(client_id, activo);
CREATE INDEX idx_agave_products_nombre ON public.agave_products(client_id, nombre);
CREATE INDEX idx_agave_products_codigo ON public.agave_products(client_id, codigo);
CREATE INDEX idx_agave_queries_client ON public.agave_queries(client_id);
CREATE INDEX idx_agave_queries_user ON public.agave_queries(user_id);
CREATE INDEX idx_agave_queries_created ON public.agave_queries(created_at DESC);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE public.agave_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agave_client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agave_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agave_queries ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user belongs to client
CREATE OR REPLACE FUNCTION public.user_belongs_to_agave_client(p_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agave_client_users
    WHERE client_id = p_client_id
    AND user_id = auth.uid()
    AND activo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Clientes: usuario ve los suyos, admin ve todos
CREATE POLICY "User sees own clients"
  ON public.agave_clients FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT client_id FROM public.agave_client_users WHERE user_id = auth.uid() AND activo = true)
    OR public.is_super_admin()
  );

CREATE POLICY "Admin manages clients"
  ON public.agave_clients FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Service role full access
CREATE POLICY "Service role manages clients"
  ON public.agave_clients FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Client Users: usuario ve los de sus clientes, admin ve todos
CREATE POLICY "User sees own client users"
  ON public.agave_client_users FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR client_id IN (SELECT client_id FROM public.agave_client_users WHERE user_id = auth.uid() AND activo = true)
    OR public.is_super_admin()
  );

CREATE POLICY "Admin manages client users"
  ON public.agave_client_users FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Service role full access
CREATE POLICY "Service role manages client users"
  ON public.agave_client_users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Productos: usuario ve los de su cliente, admin ve todos
CREATE POLICY "User sees own products"
  ON public.agave_products FOR SELECT
  TO authenticated
  USING (
    client_id IN (SELECT client_id FROM public.agave_client_users WHERE user_id = auth.uid() AND activo = true)
    OR public.is_super_admin()
  );

CREATE POLICY "Admin manages products"
  ON public.agave_products FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Service role full access
CREATE POLICY "Service role manages products"
  ON public.agave_products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Queries: usuario ve las de sus clientes, puede crear en sus clientes
CREATE POLICY "User sees own queries"
  ON public.agave_queries FOR SELECT
  TO authenticated
  USING (
    client_id IN (SELECT client_id FROM public.agave_client_users WHERE user_id = auth.uid() AND activo = true)
    OR public.is_super_admin()
  );

CREATE POLICY "User creates own queries"
  ON public.agave_queries FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (SELECT client_id FROM public.agave_client_users WHERE user_id = auth.uid() AND activo = true)
    OR public.is_super_admin()
  );

CREATE POLICY "Admin manages queries"
  ON public.agave_queries FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Service role full access
CREATE POLICY "Service role manages queries"
  ON public.agave_queries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Helper Functions
-- ============================================

-- Get client for user (returns first active client)
CREATE OR REPLACE FUNCTION public.get_agave_client_for_user(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  result UUID;
BEGIN
  SELECT cu.client_id INTO result
  FROM public.agave_client_users cu
  JOIN public.agave_clients c ON c.id = cu.client_id
  WHERE cu.user_id = p_user_id
  AND cu.activo = true
  AND c.activo = true
  LIMIT 1;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's contact name for a client
CREATE OR REPLACE FUNCTION public.get_agave_user_name(p_user_id UUID, p_client_id UUID)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  SELECT nombre_contacto INTO result
  FROM public.agave_client_users
  WHERE user_id = p_user_id
  AND client_id = p_client_id
  AND activo = true;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Calculate prices based on cost and margin ranges
CREATE OR REPLACE FUNCTION public.calculate_agave_prices(
  p_costo DECIMAL,
  p_rangos JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  rangos JSONB;
  rango JSONB;
  result JSONB := '{}';
BEGIN
  -- Use default ranges if not provided
  IF p_rangos IS NULL THEN
    rangos := '[
      {"nombre": "Critico", "min": 0, "max": 0.10},
      {"nombre": "Muy Bajo", "min": 0.10, "max": 0.15},
      {"nombre": "Bajo", "min": 0.15, "max": 0.20},
      {"nombre": "Aceptable", "min": 0.20, "max": 0.27},
      {"nombre": "Bueno", "min": 0.27, "max": 0.32},
      {"nombre": "Muy Bueno", "min": 0.32, "max": 0.38},
      {"nombre": "Sobresaliente", "min": 0.38, "max": 0.45},
      {"nombre": "Excelente", "min": 0.45, "max": 0.50}
    ]';
  ELSE
    rangos := p_rangos;
  END IF;

  -- Calculate price for each margin category
  -- Precio = Costo / (1 - Margen)
  FOR rango IN SELECT * FROM jsonb_array_elements(rangos)
  LOOP
    result := result || jsonb_build_object(
      lower(rango->>'nombre'),
      ROUND(p_costo / (1 - ((rango->>'max')::DECIMAL)), 2)
    );
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
