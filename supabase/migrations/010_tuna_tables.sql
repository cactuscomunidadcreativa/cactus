-- ============================================
-- TUNA - Sistema de Cierre de Campaña Agrícola
-- Tablas para gestión de datos
-- ============================================

-- Tabla de Campañas
CREATE TABLE IF NOT EXISTS tuna_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  season TEXT NOT NULL CHECK (season IN ('invierno', 'verano')),
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'closing', 'closed')),
  total_budget DECIMAL(15,2) DEFAULT 0,
  total_actual DECIMAL(15,2) DEFAULT 0,
  exchange_rate DECIMAL(10,4) DEFAULT 3.8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Tabla de Uploads
CREATE TABLE IF NOT EXISTS tuna_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES tuna_campaigns(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('presupuesto', 'gastos_op', 'produccion', 'ventas')),
  file_size INTEGER,
  records_processed INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Tabla de Presupuesto por Categoría
CREATE TABLE IF NOT EXISTS tuna_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES tuna_campaigns(id) ON DELETE CASCADE,
  category_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  process TEXT NOT NULL CHECK (process IN ('almacigo', 'campo_definitivo', 'packing')),
  budget_usd DECIMAL(15,2) DEFAULT 0,
  actual_usd DECIMAL(15,2) DEFAULT 0,
  exchange_rate DECIMAL(10,4) DEFAULT 3.8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Órdenes de Producción
CREATE TABLE IF NOT EXISTS tuna_production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES tuna_campaigns(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('A', 'C', 'P')),
  fecha DATE NOT NULL,
  fecha_cierre DATE,
  estado TEXT NOT NULL DEFAULT 'en_proceso' CHECK (estado IN ('en_proceso', 'cerrado', 'cancelado')),
  codigo_producto TEXT,
  descripcion TEXT,
  cantidad_estimada DECIMAL(15,2) DEFAULT 0,
  cantidad_producida DECIMAL(15,2) DEFAULT 0,
  diferencia_cantidad DECIMAL(15,2) DEFAULT 0,
  gastos_periodo JSONB DEFAULT '{}',
  gastos_acumulados JSONB DEFAULT '{}',
  costo_unitario DECIMAL(15,6) DEFAULT 0,
  costo_total DECIMAL(15,2) DEFAULT 0,
  horas_mano_obra DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Varianzas (Comparativo)
CREATE TABLE IF NOT EXISTS tuna_varianzas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES tuna_campaigns(id) ON DELETE CASCADE,
  rubro TEXT NOT NULL,
  budget_usd DECIMAL(15,2) DEFAULT 0,
  actual_usd DECIMAL(15,2) DEFAULT 0,
  variance_usd DECIMAL(15,2) DEFAULT 0,
  variance_percent DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Lotes de Exportación
CREATE TABLE IF NOT EXISTS tuna_export_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES tuna_campaigns(id) ON DELETE CASCADE,
  lote_id TEXT NOT NULL,
  cantidad DECIMAL(15,2) DEFAULT 0,
  valor_venta DECIMAL(15,2) DEFAULT 0,
  costo_venta DECIMAL(15,2) DEFAULT 0,
  utilidad DECIMAL(15,2) DEFAULT 0,
  margen_unitario DECIMAL(15,6) DEFAULT 0,
  margen_percent DECIMAL(10,4) DEFAULT 0,
  varianza_precio DECIMAL(15,2) DEFAULT 0,
  varianza_costo DECIMAL(15,2) DEFAULT 0,
  varianza_rendimiento DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Alertas
CREATE TABLE IF NOT EXISTS tuna_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES tuna_campaigns(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cost_overrun', 'negative_margin', 'unusual_variance', 'data_quality', 'deadline_approaching')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  related_entity TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id)
);

-- Tabla de Configuración
CREATE TABLE IF NOT EXISTS tuna_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, config_key)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tuna_campaigns_user ON tuna_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_tuna_campaigns_status ON tuna_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_tuna_uploads_campaign ON tuna_uploads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tuna_budget_campaign ON tuna_budget(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tuna_orders_campaign ON tuna_production_orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tuna_orders_numero ON tuna_production_orders(numero);
CREATE INDEX IF NOT EXISTS idx_tuna_varianzas_campaign ON tuna_varianzas(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tuna_alerts_campaign ON tuna_alerts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tuna_alerts_severity ON tuna_alerts(severity);

-- RLS Policies
ALTER TABLE tuna_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuna_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuna_budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuna_production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuna_varianzas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuna_export_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuna_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuna_config ENABLE ROW LEVEL SECURITY;

-- Políticas para tuna_campaigns
CREATE POLICY "Users can view own campaigns" ON tuna_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own campaigns" ON tuna_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON tuna_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON tuna_campaigns FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tuna_uploads
CREATE POLICY "Users can view own uploads" ON tuna_uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own uploads" ON tuna_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own uploads" ON tuna_uploads FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para tuna_budget
CREATE POLICY "Users can view own budget" ON tuna_budget FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own budget" ON tuna_budget FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budget" ON tuna_budget FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budget" ON tuna_budget FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tuna_production_orders
CREATE POLICY "Users can view own orders" ON tuna_production_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON tuna_production_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON tuna_production_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own orders" ON tuna_production_orders FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tuna_varianzas
CREATE POLICY "Users can view own varianzas" ON tuna_varianzas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own varianzas" ON tuna_varianzas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own varianzas" ON tuna_varianzas FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tuna_export_lots
CREATE POLICY "Users can view own lots" ON tuna_export_lots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own lots" ON tuna_export_lots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lots" ON tuna_export_lots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lots" ON tuna_export_lots FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tuna_alerts
CREATE POLICY "Users can view own alerts" ON tuna_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own alerts" ON tuna_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON tuna_alerts FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para tuna_config
CREATE POLICY "Users can view own config" ON tuna_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own config" ON tuna_config FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own config" ON tuna_config FOR UPDATE USING (auth.uid() = user_id);

-- Función para calcular KPIs de campaña
CREATE OR REPLACE FUNCTION calculate_campaign_kpis(p_campaign_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_budget', COALESCE(SUM(budget_usd), 0),
    'total_actual', COALESCE(SUM(actual_usd), 0),
    'variance', COALESCE(SUM(actual_usd) - SUM(budget_usd), 0),
    'variance_percent', CASE
      WHEN COALESCE(SUM(budget_usd), 0) > 0
      THEN ((COALESCE(SUM(actual_usd), 0) - COALESCE(SUM(budget_usd), 0)) / SUM(budget_usd)) * 100
      ELSE 0
    END
  ) INTO v_result
  FROM tuna_budget
  WHERE campaign_id = p_campaign_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener resumen de OPs
CREATE OR REPLACE FUNCTION get_orders_summary(p_campaign_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_orders', COUNT(*),
    'closed_orders', COUNT(*) FILTER (WHERE estado = 'cerrado'),
    'open_orders', COUNT(*) FILTER (WHERE estado = 'en_proceso'),
    'total_estimated', COALESCE(SUM(cantidad_estimada), 0),
    'total_produced', COALESCE(SUM(cantidad_producida), 0),
    'total_cost', COALESCE(SUM(costo_total), 0)
  ) INTO v_result
  FROM tuna_production_orders
  WHERE campaign_id = p_campaign_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
