'use client';

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// Renderizador Markdown ligero — SIN dependencias. Cubre lo que generan los
// agentes: encabezados (#/##/###), **negritas**, *itálicas*, `código`, enlaces
// [txt](url), listas con viñetas (-/*) y numeradas (1.), citas (>) y párrafos.
// No pretende ser CommonMark completo; pretende que el output deje de verse con
// asteriscos crudos.
// ═══════════════════════════════════════════════════════════════════════════

function renderInline(text: string, kb: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // **bold** | `code` | [txt](url) | *italic* | _italic_
  const re = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))|(\*([^*\n]+)\*)|(_([^_\n]+)_)/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2] !== undefined) out.push(<strong key={`${kb}b${i}`}>{m[2]}</strong>);
    else if (m[4] !== undefined) out.push(<code key={`${kb}c${i}`} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">{m[4]}</code>);
    else if (m[6] !== undefined) out.push(<a key={`${kb}a${i}`} href={m[7]} target="_blank" rel="noopener noreferrer" className="text-cactus-green underline">{m[6]}</a>);
    else if (m[9] !== undefined) out.push(<em key={`${kb}i${i}`}>{m[9]}</em>);
    else if (m[11] !== undefined) out.push(<em key={`${kb}u${i}`}>{m[11]}</em>);
    last = re.lastIndex; i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const isBullet = (s: string) => /^\s*[-*]\s+/.test(s);
const isNumbered = (s: string) => /^\s*\d+\.\s+/.test(s);
const isHeading = (s: string) => /^#{1,6}\s+/.test(s.trim());
const isQuote = (s: string) => /^>\s?/.test(s.trim());

export function Markdown({ text, className }: { text?: string | null; className?: string }) {
  if (!text) return null;
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0; let k = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) { i++; continue; }

    const h = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (h) {
      const lvl = h[1].length;
      const size = lvl <= 1 ? 'text-lg' : lvl === 2 ? 'text-base' : 'text-sm';
      blocks.push(<p key={k++} className={`mb-1 mt-3 font-display font-bold ${size}`}>{renderInline(h[2], `h${k}`)}</p>);
      i++; continue;
    }

    if (isBullet(raw)) {
      const items: string[] = [];
      while (i < lines.length && isBullet(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++; }
      blocks.push(<ul key={k++} className="my-1.5 list-disc space-y-1 pl-5">{items.map((it, j) => <li key={j}>{renderInline(it, `ul${k}_${j}`)}</li>)}</ul>);
      continue;
    }

    if (isNumbered(raw)) {
      const start = parseInt(raw.trim(), 10) || 1; // preserva el número real (las viñetas anidadas parten la lista)
      const items: string[] = [];
      while (i < lines.length && isNumbered(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++; }
      blocks.push(<ol key={k++} start={start} className="my-1.5 list-decimal space-y-1 pl-5">{items.map((it, j) => <li key={j}>{renderInline(it, `ol${k}_${j}`)}</li>)}</ol>);
      continue;
    }

    if (isQuote(raw)) {
      blocks.push(<blockquote key={k++} className="my-1.5 border-l-2 border-border pl-3 italic text-muted-foreground">{renderInline(trimmed.replace(/^>\s?/, ''), `q${k}`)}</blockquote>);
      i++; continue;
    }

    // Párrafo: junta líneas consecutivas "normales".
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !isHeading(lines[i]) && !isBullet(lines[i]) && !isNumbered(lines[i]) && !isQuote(lines[i])) {
      para.push(lines[i].trim()); i++;
    }
    blocks.push(<p key={k++} className="my-1.5 leading-relaxed">{renderInline(para.join(' '), `p${k}`)}</p>);
  }

  return <div className={className}>{blocks}</div>;
}
