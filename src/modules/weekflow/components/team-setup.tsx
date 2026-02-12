'use client';

import { useState } from 'react';
import { Users, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { generateTeamCode, randomAvatar } from '../lib/utils';

interface TeamSetupProps {
  onTeamReady: (teamId: string) => void;
}

export function TeamSetup({ onTeamReady }: TeamSetupProps) {
  const t = useTranslations('weekflow.team');
  const tWf = useTranslations('weekflow');
  const supabase = createClient();

  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!teamName.trim() || !supabase) return;
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const code = generateTeamCode();

    const { data: team, error: teamErr } = await supabase
      .from('wf_teams')
      .insert({ name: teamName.trim(), code, created_by: user.id })
      .select()
      .single();

    if (teamErr || !team) {
      setError(teamErr?.message || 'Error creating team');
      setLoading(false);
      return;
    }

    const { error: memberErr } = await supabase
      .from('wf_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email,
        role: 'admin',
        avatar: randomAvatar(),
      });

    if (memberErr) {
      setError(memberErr.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onTeamReady(team.id);
  }

  async function handleJoin() {
    if (!joinCode.trim() || !supabase) return;
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: team } = await supabase
      .from('wf_teams')
      .select('id')
      .eq('code', joinCode.trim().toUpperCase())
      .single();

    if (!team) {
      setError('Team not found with that code');
      setLoading(false);
      return;
    }

    const { error: memberErr } = await supabase
      .from('wf_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email,
        role: 'member',
        avatar: randomAvatar(),
      });

    if (memberErr) {
      if (memberErr.code === '23505') {
        // Already a member, just navigate
        onTeamReady(team.id);
        return;
      }
      setError(memberErr.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onTeamReady(team.id);
  }

  if (mode === 'choose') {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-12">
        <div className="text-5xl mb-4">🌊</div>
        <h2 className="text-xl font-display font-bold">{tWf('noTeam')}</h2>
        <p className="text-muted-foreground">{tWf('createOrJoin')}</p>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <button
            onClick={() => setMode('create')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Users className="w-8 h-8 text-primary" />
            <span className="font-medium">{t('create')}</span>
          </button>
          <button
            onClick={() => setMode('join')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <ArrowRight className="w-8 h-8 text-primary" />
            <span className="font-medium">{t('join')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 py-12">
      <button
        onClick={() => setMode('choose')}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; {mode === 'create' ? t('join') : t('create')}
      </button>

      <h2 className="text-xl font-display font-bold">
        {mode === 'create' ? t('create') : t('join')}
      </h2>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>
      )}

      {mode === 'create' ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('teamName')}</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder={t('teamNamePlaceholder')}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              autoFocus
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={loading || !teamName.trim()}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? t('creating') : t('create')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('teamCode')}</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder={t('teamCodePlaceholder')}
              maxLength={6}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-center text-2xl tracking-[0.3em] font-mono"
              autoFocus
            />
          </div>
          <button
            onClick={handleJoin}
            disabled={loading || joinCode.length < 6}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? t('joining') : t('join')}
          </button>
        </div>
      )}
    </div>
  );
}
