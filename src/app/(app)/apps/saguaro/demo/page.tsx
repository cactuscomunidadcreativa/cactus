'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, LayoutGrid, BarChart3, Users, Check, ArrowRight } from 'lucide-react';

// Demo emotion data based on Plutchik's wheel
const DEMO_EMOTIONS = [
  { key: 'joy', color: '#FFEB3B', label: 'Alegría', emoji: '😊' },
  { key: 'trust', color: '#66BB6A', label: 'Confianza', emoji: '🤝' },
  { key: 'fear', color: '#4CAF50', label: 'Miedo', emoji: '😰' },
  { key: 'surprise', color: '#42A5F5', label: 'Sorpresa', emoji: '😮' },
  { key: 'sadness', color: '#5C6BC0', label: 'Tristeza', emoji: '😢' },
  { key: 'disgust', color: '#AB47BC', label: 'Disgusto', emoji: '😤' },
  { key: 'anger', color: '#EF5350', label: 'Enojo', emoji: '😠' },
  { key: 'anticipation', color: '#FF9800', label: 'Anticipación', emoji: '🤩' },
];

// Demo tasks for the board
const DEMO_TASKS = [
  { id: '1', text: 'Revisar propuesta de diseño', section: 'priority', status: 'done' },
  { id: '2', text: 'Preparar presentación Q1', section: 'priority', status: 'pending' },
  { id: '3', text: 'Llamada con cliente', section: 'meetings', status: 'pending' },
  { id: '4', text: 'Sync con equipo de dev', section: 'meetings', status: 'done' },
  { id: '5', text: 'Corregir bug en login', section: 'projects', status: 'pending' },
  { id: '6', text: 'Documentar API nueva', section: 'admin', status: 'pending' },
];

// Demo team members for pulse view
const DEMO_TEAM = [
  { id: '1', name: 'María', avatar: '👩‍💼', mood: 4, energy: 5, emotion: 'joy' },
  { id: '2', name: 'Carlos', avatar: '👨‍💻', mood: 3, energy: 3, emotion: 'anticipation' },
  { id: '3', name: 'Ana', avatar: '👩‍🎨', mood: 5, energy: 4, emotion: 'trust' },
  { id: '4', name: 'Pedro', avatar: '👨‍🔬', mood: 2, energy: 2, emotion: 'sadness' },
];

type Tab = 'mood' | 'board' | 'pulse' | 'team';

export default function SaguaroDemoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('mood');
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [tasks, setTasks] = useState(DEMO_TASKS);

  const tabs = [
    { key: 'mood' as Tab, icon: <Heart className="w-4 h-4" />, label: 'Check-in' },
    { key: 'board' as Tab, icon: <LayoutGrid className="w-4 h-4" />, label: 'Board' },
    { key: 'pulse' as Tab, icon: <BarChart3 className="w-4 h-4" />, label: 'Pulse' },
    { key: 'team' as Tab, icon: <Users className="w-4 h-4" />, label: 'Equipo' },
  ];

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t
    ));
  };

  const getMoodEmoji = (value: number) => {
    const emojis = ['😞', '😕', '😐', '🙂', '😊'];
    return emojis[value - 1] || '😐';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-background">
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-sm text-emerald-700 dark:text-emerald-300 mb-4">
            <span className="text-lg">🌿</span>
            <span>Demo Interactivo</span>
          </div>
          <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
            SAGUARO
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Equilibra tu semana con check-ins de bienestar, gestión de tareas y pulso emocional del equipo.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Mood Check-in Tab */}
          {activeTab === 'mood' && (
            <div className="space-y-6">
              {/* Mood Sliders */}
              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold mb-4">¿Cómo te sientes hoy?</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Estado de ánimo</label>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getMoodEmoji(mood)}</span>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={mood}
                        onChange={(e) => setMood(Number(e.target.value))}
                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {mood === 1 ? 'Bajo' : mood === 2 ? 'Regular' : mood === 3 ? 'Neutro' : mood === 4 ? 'Bien' : 'Excelente'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Nivel de energía</label>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Bajo</span>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={energy}
                        onChange={(e) => setEnergy(Number(e.target.value))}
                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <span className="text-sm text-muted-foreground">Alto</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emotion Wheel (simplified for demo) */}
              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold mb-1">Rueda de Emociones</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Selecciona la emoción que mejor describe cómo te sientes
                </p>

                <div className="grid grid-cols-4 gap-3">
                  {DEMO_EMOTIONS.map((emotion) => (
                    <button
                      key={emotion.key}
                      onClick={() => setSelectedEmotion(emotion.key)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        selectedEmotion === emotion.key
                          ? 'ring-2 ring-offset-2 scale-105'
                          : 'hover:scale-105 hover:bg-muted/50'
                      }`}
                      style={{
                        backgroundColor: selectedEmotion === emotion.key ? emotion.color + '30' : undefined,
                        ['--tw-ring-color' as any]: emotion.color
                      }}
                    >
                      <span className="text-3xl">{emotion.emoji}</span>
                      <span className="text-xs font-medium">{emotion.label}</span>
                    </button>
                  ))}
                </div>

                {selectedEmotion && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Seleccionaste: <span className="font-semibold text-foreground">
                        {DEMO_EMOTIONS.find(e => e.key === selectedEmotion)?.label}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors">
                Guardar Check-in
              </button>
            </div>
          )}

          {/* Board Tab */}
          {activeTab === 'board' && (
            <div className="space-y-4">
              <div className="bg-card border rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Semana Actual</h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString('es', { month: 'short', day: 'numeric' })} - {
                      new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('es', { month: 'short', day: 'numeric' })
                    }
                  </span>
                </div>

                {['priority', 'meetings', 'projects', 'admin'].map((section) => (
                  <div key={section} className="mb-4 last:mb-0">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {section === 'priority' ? '🎯 Prioridades' :
                       section === 'meetings' ? '📅 Reuniones' :
                       section === 'projects' ? '💼 Proyectos' : '📋 Admin'}
                    </h4>
                    <div className="space-y-2">
                      {tasks.filter(t => t.section === section).map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            task.status === 'done' ? 'bg-muted/50' : 'bg-background'
                          }`}
                        >
                          <button
                            onClick={() => toggleTask(task.id)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              task.status === 'done'
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-muted-foreground/30 hover:border-emerald-500'
                            }`}
                          >
                            {task.status === 'done' && <Check className="w-3 h-3" />}
                          </button>
                          <span className={task.status === 'done' ? 'text-muted-foreground line-through' : ''}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Haz clic en las tareas para marcarlas como completadas
              </p>
            </div>
          )}

          {/* Pulse Tab */}
          {activeTab === 'pulse' && (
            <div className="space-y-4">
              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-semibold mb-4">Pulso del Equipo</h3>

                {/* Team average */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center">
                    <div className="text-3xl mb-1">😊</div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">3.5</div>
                    <div className="text-xs text-muted-foreground">Promedio Ánimo</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
                    <div className="text-3xl mb-1">⚡</div>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">3.5</div>
                    <div className="text-xs text-muted-foreground">Promedio Energía</div>
                  </div>
                </div>

                {/* Team members */}
                <h4 className="text-sm font-semibold mb-3">Miembros del Equipo</h4>
                <div className="space-y-3">
                  {DEMO_TEAM.map((member) => {
                    const emotion = DEMO_EMOTIONS.find(e => e.key === member.emotion);
                    return (
                      <div key={member.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <span className="text-2xl">{member.avatar}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{member.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Ánimo: {member.mood}/5 • Energía: {member.energy}/5
                          </div>
                        </div>
                        {emotion && (
                          <div
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: emotion.color + '30', color: emotion.color }}
                          >
                            {emotion.emoji} {emotion.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Visualiza el estado emocional de tu equipo en tiempo real
              </p>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Mi Equipo</h3>
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                    4 miembros
                  </span>
                </div>

                {/* Team code */}
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="text-xs text-muted-foreground mb-1">Código del equipo</div>
                  <div className="flex items-center gap-2">
                    <code className="text-lg font-mono font-bold tracking-widest">DEMO-2024</code>
                    <button className="text-xs text-emerald-600 hover:text-emerald-700">
                      Copiar
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Comparte este código para que otros se unan a tu equipo
                  </p>
                </div>

                {/* Members list */}
                <div className="space-y-3">
                  {DEMO_TEAM.map((member, i) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <span className="text-2xl">{member.avatar}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {i === 0 ? 'Admin' : 'Miembro'}
                        </div>
                      </div>
                      {i === 0 && (
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                          Tú
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Comenzar Gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/landing/saguaro"
              className="px-6 py-3 border rounded-lg font-medium hover:bg-muted transition-colors"
            >
              Más Info
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Crea tu equipo y comienza a hacer check-ins semanales
          </p>
        </div>

        {/* Feature Cards */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <FeatureCard title="Check-ins" desc="Seguimiento emocional" icon="heart" />
          <FeatureCard title="Board" desc="Organiza tu semana" icon="board" />
          <FeatureCard title="Team Pulse" desc="Pulso del equipo" icon="pulse" />
          <FeatureCard title="Colaboración" desc="Trabaja en equipo" icon="team" />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  const iconMap: Record<string, string> = {
    heart: '💚',
    board: '📋',
    pulse: '📊',
    team: '👥',
  };

  return (
    <div className="bg-white dark:bg-card rounded-lg p-4 text-center border">
      <div className="text-2xl mb-1">{iconMap[icon]}</div>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
