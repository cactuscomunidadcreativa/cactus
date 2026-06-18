'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import type { CompanyOption } from '@/components/shared/company-selector';

interface AppSubscription {
  app_id: string;
  app_name: string;
  app_icon: string;
  app_color: string;
  status: string;
}

interface PlatformShellProps {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
  subscriptions: AppSubscription[];
  isAdmin?: boolean;
  companies?: CompanyOption[];
  activeCompanyId?: string | null;
}

export function PlatformShell({ children, userName, userEmail, subscriptions, isAdmin, companies = [], activeCompanyId = null }: PlatformShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar subscriptions={subscriptions} isAdmin={isAdmin} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50">
            <Sidebar subscriptions={subscriptions} isAdmin={isAdmin} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userName={userName}
          userEmail={userEmail}
          companies={companies}
          activeCompanyId={activeCompanyId}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
