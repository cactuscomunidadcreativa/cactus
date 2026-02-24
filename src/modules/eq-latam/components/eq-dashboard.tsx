'use client';

import { useState } from 'react';
import {
  Calculator, Calendar, Users, BarChart3,
  Globe, Briefcase, MessageCircle, ChevronLeft,
} from 'lucide-react';
import type { DashboardTab } from '../types';
import { EqChat } from './eq-chat';
import { QuickCalculator } from './quick-calculator';
import { EventAnalyzer } from './event-analyzer';
import { PartnerProposal } from './partner-proposal';
import { AnnualSimulator } from './annual-simulator';
import { MarketComparison } from './market-comparison';
import { ServicesOverview } from './services-overview';

const TABS: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
  { id: 'calculator', label: 'Calculadora', icon: <Calculator className="w-4 h-4" /> },
  { id: 'event_analyzer', label: 'Eventos', icon: <Calendar className="w-4 h-4" /> },
  { id: 'partner_proposal', label: 'Partner', icon: <Users className="w-4 h-4" /> },
  { id: 'annual_simulator', label: 'Simulador', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'market_comparison', label: 'Mercado', icon: <Globe className="w-4 h-4" /> },
  { id: 'services', label: 'Servicios', icon: <Briefcase className="w-4 h-4" /> },
];

export function EqDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('calculator');
  const [showChat, setShowChat] = useState(true);
  const [mobileView, setMobileView] = useState<'chat' | 'tools'>('chat');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-eq-gradient flex items-center justify-center text-white text-sm font-bold">
              EQ
            </div>
            <div>
              <h1 className="font-display font-bold text-eq-navy text-sm">EQ LATAM MASTER COST</h1>
              <p className="text-xs text-muted-foreground">Pricing Intelligence System</p>
            </div>
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setMobileView('chat')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1 ${mobileView === 'chat' ? 'bg-eq-blue text-white' : 'hover:bg-muted'}`}
            >
              <MessageCircle className="w-3 h-3" /> Chat
            </button>
            <button
              onClick={() => setMobileView('tools')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1 ${mobileView === 'tools' ? 'bg-eq-blue text-white' : 'hover:bg-muted'}`}
            >
              <Calculator className="w-3 h-3" /> Tools
            </button>
          </div>

          {/* Desktop chat toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="hidden md:flex items-center gap-1 text-xs text-muted-foreground hover:text-eq-blue transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {showChat ? 'Ocultar Chat' : 'Mostrar Chat'}
          </button>
        </div>

        {/* Desktop tab bar */}
        <div className="hidden md:flex px-4 gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-eq-cream text-eq-blue border border-b-0'
                  : 'text-muted-foreground hover:text-eq-blue hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile tab bar (only in tools view) */}
        {mobileView === 'tools' && (
          <div className="md:hidden flex px-2 gap-1 overflow-x-auto py-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-eq-blue text-white'
                    : 'text-muted-foreground hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile view */}
        <div className="md:hidden h-full">
          {mobileView === 'chat' ? (
            <EqChat />
          ) : (
            <div className="h-full overflow-y-auto p-4">
              <TabContent tab={activeTab} />
            </div>
          )}
        </div>

        {/* Desktop view */}
        <div className="hidden md:flex h-full">
          {/* Chat panel */}
          {showChat && (
            <div className="w-2/5 border-r">
              <EqChat />
            </div>
          )}

          {/* Tools panel */}
          <div className={`${showChat ? 'w-3/5' : 'w-full'} overflow-y-auto p-5`}>
            <TabContent tab={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TabContent({ tab }: { tab: DashboardTab }) {
  switch (tab) {
    case 'calculator':
      return <QuickCalculator />;
    case 'event_analyzer':
      return <EventAnalyzer />;
    case 'partner_proposal':
      return <PartnerProposal />;
    case 'annual_simulator':
      return <AnnualSimulator />;
    case 'market_comparison':
      return <MarketComparison />;
    case 'services':
      return <ServicesOverview />;
    default:
      return <QuickCalculator />;
  }
}
