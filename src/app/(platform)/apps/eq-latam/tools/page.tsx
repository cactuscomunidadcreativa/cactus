import { EqDashboard } from '@/modules/eq-latam/components/eq-dashboard';

/**
 * Legacy tools page — calculator, event analyzer, market comparison, etc.
 * Lives at /apps/eq-latam/tools while we migrate them into the area-first dashboard.
 */
export default function EqLatamToolsPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <EqDashboard />
    </div>
  );
}
