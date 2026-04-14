'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Check, RotateCcw, Send, Image as ImageIcon, User } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeedbackRow {
  id: string
  maison_id: string
  entity_type: string
  entity_id: string
  author_id: string
  author_name: string | null
  author_role: string | null
  content: string
  image_urls: string[]
  feedback_type: 'comment' | 'approval' | 'revision_request'
  revision_round: number
  created_at: string
}

interface DesignFeedbackThreadProps {
  entityType: 'garment' | 'variant' | 'order'
  entityId: string
  maisonId: string
  currentUserId: string
  currentUserName: string
  currentUserRole: 'designer' | 'client' | 'advisor' | 'workshop'
  onStatusChange?: (newStatus: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROLE_COLORS: Record<string, string> = {
  designer: 'bg-purple-500',
  client: 'bg-pink-500',
  advisor: 'bg-blue-500',
  workshop: 'bg-amber-500',
}

const ROLE_LABELS: Record<string, string> = {
  designer: 'Disenador',
  client: 'Cliente',
  advisor: 'Asesor',
  workshop: 'Taller',
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  designer: 'bg-purple-100 text-purple-700',
  client: 'bg-pink-100 text-pink-700',
  advisor: 'bg-blue-100 text-blue-700',
  workshop: 'bg-amber-100 text-amber-700',
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const past = new Date(dateStr).getTime()
  const diffMs = now - past

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return 'hace un momento'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`

  const months = Math.floor(days / 30)
  return `hace ${months} mes${months > 1 ? 'es' : ''}`
}

function groupByRound(items: FeedbackRow[]): Map<number, FeedbackRow[]> {
  const map = new Map<number, FeedbackRow[]>()
  for (const item of items) {
    const round = item.revision_round ?? 1
    if (!map.has(round)) map.set(round, [])
    map.get(round)!.push(item)
  }
  return map
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Avatar({ name, role }: { name: string; role: string }) {
  const initial = (name || '?')[0].toUpperCase()
  const bg = ROLE_COLORS[role] || 'bg-gray-400'
  return (
    <div className={`${bg} w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0`}>
      {initial}
    </div>
  )
}

function FeedbackCard({ item }: { item: FeedbackRow }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const role = item.author_role || 'designer'
  const name = item.author_name || 'Anonimo'

  return (
    <div className="flex gap-3 py-3">
      <Avatar name={name} role={role} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900">{name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE_COLORS[role] || 'bg-gray-100 text-gray-600'}`}>
            {ROLE_LABELS[role] || role}
          </span>
          {item.feedback_type === 'approval' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700 flex items-center gap-0.5">
              <Check size={10} /> Aprobado
            </span>
          )}
          {item.feedback_type === 'revision_request' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 flex items-center gap-0.5">
              <RotateCcw size={10} /> Cambios
            </span>
          )}
          <span className="text-[11px] text-gray-400 ml-auto">{timeAgo(item.created_at)}</span>
        </div>
        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{item.content}</p>

        {item.image_urls && item.image_urls.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {item.image_urls.map((url, i) => (
              <button key={i} onClick={() => setExpanded(expanded === url ? null : url)} className="block">
                <img
                  src={url}
                  alt={`Imagen ${i + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:ring-2 hover:ring-purple-300 transition-all"
                />
              </button>
            ))}
          </div>
        )}
        {expanded && (
          <div className="mt-2">
            <img src={expanded} alt="Vista ampliada" className="max-w-full max-h-80 rounded-lg border border-gray-200" />
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DesignFeedbackThread({
  entityType,
  entityId,
  maisonId,
  currentUserId,
  currentUserName,
  currentUserRole,
  onStatusChange,
}: DesignFeedbackThreadProps) {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await fetch(`/api/cereus/feedback?entity_type=${entityType}&entity_id=${entityId}`)
      if (res.ok) {
        const data = await res.json()
        setFeedback(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const currentRound = feedback.length > 0 ? Math.max(...feedback.map(f => f.revision_round || 1)) : 1

  const handleSubmit = async (feedbackType: 'comment' | 'approval' | 'revision_request') => {
    if (!content.trim()) return
    setSubmitting(true)

    const imageUrls: string[] = []
    if (imageUrl.trim()) imageUrls.push(imageUrl.trim())

    try {
      const res = await fetch('/api/cereus/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maison_id: maisonId,
          entity_type: entityType,
          entity_id: entityId,
          author_id: currentUserId,
          author_name: currentUserName,
          author_role: currentUserRole,
          content: content.trim(),
          image_urls: imageUrls,
          feedback_type: feedbackType,
          revision_round: feedbackType === 'revision_request' ? currentRound + 1 : currentRound,
        }),
      })

      if (res.ok) {
        setContent('')
        setImageUrl('')
        setShowImageInput(false)
        await fetchFeedback()

        if (feedbackType === 'approval') onStatusChange?.('approved')
        if (feedbackType === 'revision_request') onStatusChange?.('draft')
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false)
    }
  }

  const grouped = groupByRound(feedback)

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <MessageSquare size={16} className="text-purple-500" />
        <h3 className="text-sm font-semibold text-gray-900">Feedback de Diseno</h3>
        <span className="text-xs text-gray-400 ml-auto">{feedback.length} comentario{feedback.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Thread body */}
      <div className="flex-1 overflow-y-auto max-h-[420px] px-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : feedback.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <User size={32} className="mb-2 opacity-40" />
            <p className="text-sm">Sin comentarios aun.</p>
            <p className="text-xs mt-1">Se el primero en dar feedback.</p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([round, items]) => (
            <div key={round}>
              <div className="sticky top-0 bg-white z-10 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Ronda {round}</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map(item => (
                  <FeedbackCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply area */}
      <div className="border-t border-gray-100 px-4 py-3 space-y-3">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Escribe tu comentario..."
          rows={2}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent placeholder:text-gray-400"
        />

        {showImageInput && (
          <input
            type="text"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="URL de imagen (ej. https://...)"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent placeholder:text-gray-400"
          />
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-50"
            title="Adjuntar imagen"
          >
            <ImageIcon size={16} />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              disabled={!content.trim() || submitting}
              onClick={() => handleSubmit('revision_request')}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <RotateCcw size={12} />
              Solicitar Cambios
            </button>
            <button
              type="button"
              disabled={!content.trim() || submitting}
              onClick={() => handleSubmit('approval')}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Check size={12} />
              Aprobar Diseno
            </button>
            <button
              type="button"
              disabled={!content.trim() || submitting}
              onClick={() => handleSubmit('comment')}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={12} />
              Comentar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
