import { AreaDashboard } from '@/modules/eq-latam/components/area-dashboard';

/**
 * Public preview route for the EQ Latam Operating Platform v2.
 * No auth required — used for stakeholder review of Fase 0.
 *
 * The production route is /apps/eq-latam (auth-gated).
 */
export default function EqLatamPreviewPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 text-center">
        🔍 PREVIEW PÚBLICO — Fase 0 del EQ Latam Operating Platform. La versión con auth real vive en{' '}
        <code className="font-mono">/apps/eq-latam</code>
      </div>
      <div className="h-[calc(100vh-2.5rem)]">
        <AreaDashboard />
      </div>
    </div>
  );
}
