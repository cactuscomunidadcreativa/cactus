'use client';

import { useState } from 'react';
import { Copy, Check, Shield, User, MoreVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { WFTeam, WFMember } from '../types';

interface TeamMembersProps {
  team: WFTeam;
  members: WFMember[];
  currentMember: WFMember | null;
  isAdmin: boolean;
  onUpdateRole: (memberId: string, role: 'admin' | 'member') => void;
}

export function TeamMembers({ team, members, currentMember, isAdmin, onUpdateRole }: TeamMembersProps) {
  const t = useTranslations('weekflow.team');
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  function copyCode() {
    navigator.clipboard.writeText(team.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Team code */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{team.name}</h3>
            <p className="text-xs text-muted-foreground">{t('shareCode')}</p>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg font-mono text-lg tracking-[0.2em] hover:bg-muted/80 transition-colors"
          >
            {team.code}
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Members list */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-3">{t('members')} ({members.length})</h3>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <span className="text-2xl">{member.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {member.name}
                  {member.id === currentMember?.id && (
                    <span className="text-xs text-muted-foreground ml-2">(you)</span>
                  )}
                </p>
                {member.email && (
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                )}
              </div>

              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                member.role === 'admin'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {member.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {member.role === 'admin' ? t('admin') : t('member')}
              </span>

              {isAdmin && member.id !== currentMember?.id && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === member.id ? null : member.id)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen === member.id && (
                    <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg z-10 py-1 min-w-[150px]">
                      <button
                        onClick={() => {
                          onUpdateRole(member.id, member.role === 'admin' ? 'member' : 'admin');
                          setMenuOpen(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        {t('changeRole')} → {member.role === 'admin' ? t('member') : t('admin')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
