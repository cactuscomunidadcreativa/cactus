-- ============================================================
-- CEREUS White-Label Domain Support
-- Adds custom_domain to app_clients for multi-tenant domain routing
-- ============================================================

-- Add custom_domain column for white-label domain mapping
ALTER TABLE app_clients ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Fast lookup index for middleware domain resolution
CREATE INDEX IF NOT EXISTS idx_app_clients_custom_domain
  ON app_clients(custom_domain)
  WHERE custom_domain IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN app_clients.custom_domain IS 'Custom domain for white-label routing (e.g., privat.pe). Must be unique across all app_clients.';
