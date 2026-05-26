/**
 * EQ LATAM — PDF generators using jsPDF.
 *
 * Two flavors:
 *   - generatePartnerProposalPDF: for partner cotizing a Full EQ Week
 *   - generateGraduateProposalPDF: for graduate quoting assessments to client
 *
 * Both download as .pdf via the browser. No server-side rendering needed.
 */

'use client';

import { jsPDF } from 'jspdf';

const COLORS = {
  navy: [27, 36, 65] as [number, number, number],
  blue: [37, 99, 235] as [number, number, number],
  emerald: [16, 185, 129] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  light: [243, 244, 246] as [number, number, number],
};

const fmt = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// ============================================================
// PARTNER PROPOSAL
// ============================================================

export interface PartnerProposalPdfInput {
  partnerName: string;
  partnerTierLabel: string;
  clientName: string;
  city?: string;
  pax: number;
  retailPerPax: number;
  wholesalePerPax: number;
  retailTotal: number;
  wholesaleTotal: number;
  partnerGross: number;
  partnerGrossPct: number;
  productLabel?: string;
}

export function generatePartnerProposalPDF(input: PartnerProposalPdfInput) {
  const doc = new jsPDF({ format: 'letter', unit: 'pt' });
  const W = doc.internal.pageSize.getWidth();
  let y = 50;

  // Header
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, W, 85, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Propuesta Full EQ Week', 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`${input.partnerName} · Six Seconds Latam`, 40, 62);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' }), W - 40, 62, { align: 'right' });
  y = 120;

  // Client block
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Cliente', 40, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(input.clientName || '—', 40, y + 18);
  if (input.city) doc.text(input.city, 40, y + 34);
  y += 60;

  // Product summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(input.productLabel ?? 'Full EQ Week — 5 días presencial', 40, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gray);
  doc.text('UEQ + BPC + EQAC + EQPC + EQPM + 900 créditos + LVS Project', 40, y + 16);
  y += 50;

  // Pricing table
  const rows: Array<[string, string]> = [
    ['Participantes (PAX)', String(input.pax)],
    ['Precio por participante', fmt(input.retailPerPax)],
    ['Inversión total del cliente', fmt(input.retailTotal)],
    ['Tu costo wholesale (6S Latam)', fmt(input.wholesaleTotal)],
    [`Tu margen bruto (${(input.partnerGrossPct * 100).toFixed(1)}%)`, fmt(input.partnerGross)],
  ];

  doc.setFillColor(...COLORS.light);
  doc.rect(40, y, W - 80, 24, 'F');
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Detalle financiero', 50, y + 16);
  y += 30;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  rows.forEach((r, i) => {
    if (i === rows.length - 1) {
      doc.setFillColor(...COLORS.emerald);
      doc.rect(40, y - 12, W - 80, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(...COLORS.navy);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(r[0], 50, y + 4);
    doc.text(r[1], W - 50, y + 4, { align: 'right' });
    if (i < rows.length - 1) {
      doc.setDrawColor(...COLORS.light);
      doc.line(40, y + 12, W - 40, y + 12);
    }
    y += 22;
  });
  y += 30;

  // Tier badge
  doc.setTextColor(...COLORS.gray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Tarifa aplicada · Tier ${input.partnerTierLabel}`, 40, y);
  y += 30;

  // Footer
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.text(
    'Esta propuesta es referencial. Precios y disponibilidad sujetos a confirmación por 6S Latam.',
    40,
    doc.internal.pageSize.getHeight() - 50,
  );
  doc.text('Six Seconds Latam · Plataforma operativa', 40, doc.internal.pageSize.getHeight() - 35);

  const filename = `propuesta-${(input.clientName || 'cliente').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
  doc.save(filename);
}

// ============================================================
// GRADUATE PROPOSAL
// ============================================================

export interface GraduateProposalPdfInput {
  graduateName: string;
  clientName: string;
  email: string;
  lines: Array<{ name: string; qty: number; credits: number }>;
  totalCredits: number;
  costUsd: number;
  retailUsd: number;
  margin: number;
  marginPct: number;
  markup: number;
}

export function generateGraduateProposalPDF(input: GraduateProposalPdfInput) {
  const doc = new jsPDF({ format: 'letter', unit: 'pt' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let y = 50;

  // Header
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, W, 85, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Propuesta de Engagement EQ', 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Practitioner: ${input.graduateName || '—'}`, 40, 62);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' }), W - 40, 62, { align: 'right' });
  y = 120;

  // Client block
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Cliente', 40, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(input.clientName || '—', 40, y + 18);
  y += 50;

  // Lines table header
  doc.setFillColor(...COLORS.light);
  doc.rect(40, y, W - 80, 24, 'F');
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Assessment', 50, y + 16);
  doc.text('Cantidad', W - 220, y + 16, { align: 'right' });
  doc.text('Créditos', W - 50, y + 16, { align: 'right' });
  y += 28;

  // Lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  input.lines.forEach(l => {
    if (y > H - 120) {
      doc.addPage();
      y = 50;
    }
    doc.setTextColor(...COLORS.navy);
    doc.text(l.name, 50, y);
    doc.text(String(l.qty), W - 220, y, { align: 'right' });
    doc.text(String(l.credits), W - 50, y, { align: 'right' });
    doc.setDrawColor(...COLORS.light);
    doc.line(40, y + 6, W - 40, y + 6);
    y += 18;
  });
  y += 14;

  // Totals
  const totals: Array<[string, string, boolean]> = [
    ['Total créditos', String(input.totalCredits), false],
    ['Costo a Six Seconds Latam', fmt(input.costUsd), false],
    [`Markup aplicado`, `${input.markup}×`, false],
    ['Precio sugerido al cliente', fmt(input.retailUsd), true],
  ];

  totals.forEach(([label, value, highlight]) => {
    if (highlight) {
      doc.setFillColor(...COLORS.emerald);
      doc.rect(40, y - 12, W - 80, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(...COLORS.navy);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(label, 50, y + 4);
    doc.text(value, W - 50, y + 4, { align: 'right' });
    y += 22;
  });

  y += 8;
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  doc.text(
    `Tu margen como practitioner: ${fmt(input.margin)} (${(input.marginPct * 100).toFixed(0)}%)`,
    40,
    y,
  );

  // Footer
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.text('1 crédito = $1 USD. Precio retail sugerido — ajusta el markup según tu mercado.', 40, H - 50);
  doc.text('Six Seconds Latam · Calculadora para Practitioners', 40, H - 35);

  const filename = `propuesta-${(input.clientName || 'cliente').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
  doc.save(filename);
}
