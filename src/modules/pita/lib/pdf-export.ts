import type { PresentationSection, SectionFeedback, PitaThread, PitaAttachment } from '../types';

interface ExportOptions {
  title: string;
  slug: string;
  sections: PresentationSection[];
  feedbackData: SectionFeedback[];
  reviewers: { id: string; name: string }[];
  threads: PitaThread[];
  attachments: PitaAttachment[];
  lang?: 'es' | 'en';
}

// ═══════════════════════════════════════
// MAIN EXPORT FUNCTION
// ═══════════════════════════════════════

export async function exportPresentationPDF(opts: ExportOptions) {
  const { default: jsPDF } = await import('jspdf');
  const { default: html2canvas } = await import('html2canvas');

  const {
    title,
    slug,
    sections,
    feedbackData,
    reviewers,
    threads,
    attachments,
    lang = 'es',
  } = opts;

  // Landscape A4 — good for presentation slides
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth(); // ~297mm
  const pageH = doc.internal.pageSize.getHeight(); // ~210mm

  const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index);

  // ── PHASE 1: Capture slides as images ──

  // Create offscreen container for rendering
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; top: -9999px; left: -9999px;
    width: 1280px; height: 720px;
    overflow: hidden; background: #0E1B2C;
    font-family: Inter, system-ui, sans-serif;
  `;
  document.body.appendChild(container);

  // Set language class on root for bilingual rendering
  const root = document.documentElement;
  const hadLangClass = root.classList.contains('pita-lang-en');
  if (lang === 'en') {
    root.classList.add('pita-lang-en');
  } else {
    root.classList.remove('pita-lang-en');
  }

  let isFirstPage = true;

  for (const section of sortedSections) {
    // Inject the slide HTML
    container.innerHTML = `
      <div style="width:1280px;height:720px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#0E1B2C;color:#F5F7F9;">
        <div style="width:100%;padding:40px;">
          ${section.content}
        </div>
      </div>
    `;

    // Wait for any images/fonts to settle
    await new Promise(r => setTimeout(r, 100));

    try {
      const canvas = await html2canvas(container, {
        width: 1280,
        height: 720,
        scale: 2,
        useCORS: true,
        backgroundColor: '#0E1B2C',
        logging: false,
      });

      if (!isFirstPage) doc.addPage();
      isFirstPage = false;

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      doc.addImage(imgData, 'JPEG', 0, 0, pageW, pageH);
    } catch {
      // If capture fails, add a text-only placeholder
      if (!isFirstPage) doc.addPage();
      isFirstPage = false;
      doc.setFillColor(14, 27, 44); // pita-deep
      doc.rect(0, 0, pageW, pageH, 'F');
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(24);
      doc.text(section.title || `Slide ${section.order_index + 1}`, pageW / 2, pageH / 2, { align: 'center' });
    }
  }

  // Cleanup offscreen container
  document.body.removeChild(container);

  // Restore language class
  if (!hadLangClass) {
    root.classList.remove('pita-lang-en');
  } else {
    root.classList.add('pita-lang-en');
  }

  // ── PHASE 2: Feedback Report Pages ──

  // Group feedback by section
  const feedbackBySection = buildFeedbackMap(sortedSections, feedbackData, threads, attachments);

  const totalReactions = feedbackData.filter(f => f.reaction).length;
  const totalComments = feedbackData.filter(f => f.comment).length;
  const totalThreads = threads.length;
  const totalFiles = attachments.length;

  // Stats / Summary page
  doc.addPage();
  drawReportHeader(doc, title, pageW, pageH);
  let y = 50;

  // Stats row
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  const stats = [
    `${reviewers.length} Reviewers`,
    `${totalReactions} Reactions`,
    `${totalComments + totalThreads} Comments`,
    `${totalFiles} Files`,
    `${sortedSections.length} Slides`,
  ];
  doc.text(stats.join('   |   '), pageW / 2, y, { align: 'center' });
  y += 12;

  // Reviewers list
  if (reviewers.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(79, 175, 143); // pita-green
    doc.text('REVIEWERS', 20, y);
    y += 6;
    doc.setTextColor(60, 60, 60);
    const names = reviewers.map(r => r.name).join(', ');
    const wrappedNames = doc.splitTextToSize(names, pageW - 40);
    doc.text(wrappedNames, 20, y);
    y += wrappedNames.length * 5 + 8;
  }

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, pageW - 20, y);
  y += 10;

  // Feedback per section
  for (const section of sortedSections) {
    const fb = feedbackBySection[section.id];
    if (!fb) continue;

    const hasContent = fb.reactions.like + fb.reactions.dislike + fb.reactions.love > 0
      || fb.comments.length > 0
      || fb.threads.length > 0
      || fb.attachments.length > 0;

    if (!hasContent) continue;

    // Check if we need a new page
    if (y > pageH - 40) {
      doc.addPage();
      drawReportHeader(doc, title, pageW, pageH);
      y = 50;
    }

    // Section header
    doc.setFontSize(12);
    doc.setTextColor(14, 27, 44);
    const sectionLabel = `${String(section.order_index + 1).padStart(2, '0')} — ${section.title}`;
    doc.text(sectionLabel, 20, y);
    y += 7;

    // Reactions row
    if (fb.reactions.like + fb.reactions.dislike + fb.reactions.love > 0) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const reactionParts: string[] = [];
      if (fb.reactions.like > 0) reactionParts.push(`Like: ${fb.reactions.like}`);
      if (fb.reactions.love > 0) reactionParts.push(`Love: ${fb.reactions.love}`);
      if (fb.reactions.dislike > 0) reactionParts.push(`Dislike: ${fb.reactions.dislike}`);
      doc.text(reactionParts.join('   '), 25, y);
      y += 6;
    }

    // Comments
    for (const c of fb.comments) {
      if (y > pageH - 25) {
        doc.addPage();
        drawReportHeader(doc, title, pageW, pageH);
        y = 50;
      }
      doc.setFontSize(9);
      doc.setTextColor(79, 175, 143);
      doc.text(c.name, 25, y);
      doc.setTextColor(60, 60, 60);
      const commentText = doc.splitTextToSize(`"${c.comment}"`, pageW - 80);
      doc.text(commentText, 55, y);
      y += commentText.length * 4.5 + 3;
    }

    // Threads
    for (const thread of fb.threads) {
      if (y > pageH - 25) {
        doc.addPage();
        drawReportHeader(doc, title, pageW, pageH);
        y = 50;
      }
      doc.setFontSize(9);
      doc.setTextColor(45, 108, 223); // pita-blue
      doc.text(thread.reviewer_name, 25, y);
      doc.setTextColor(60, 60, 60);
      const threadText = doc.splitTextToSize(thread.content, pageW - 80);
      doc.text(threadText, 55, y);
      y += threadText.length * 4.5 + 2;

      // Replies
      if (thread.replies && thread.replies.length > 0) {
        for (const reply of thread.replies) {
          if (y > pageH - 20) {
            doc.addPage();
            drawReportHeader(doc, title, pageW, pageH);
            y = 50;
          }
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`  > ${reply.reviewer_name}: ${reply.content}`, 30, y);
          y += 5;
        }
      }
    }

    // Attachments
    if (fb.attachments.length > 0) {
      if (y > pageH - 20) {
        doc.addPage();
        drawReportHeader(doc, title, pageW, pageH);
        y = 50;
      }
      doc.setFontSize(9);
      doc.setTextColor(199, 165, 74); // pita-gold
      doc.text('FILES:', 25, y);
      doc.setTextColor(60, 60, 60);
      const fileNames = fb.attachments.map(a => a.file_name).join(', ');
      const fileText = doc.splitTextToSize(fileNames, pageW - 70);
      doc.text(fileText, 50, y);
      y += fileText.length * 4.5 + 3;
    }

    // Section separator
    y += 4;
    doc.setDrawColor(230, 230, 230);
    doc.line(20, y, pageW - 20, y);
    y += 8;
  }

  // ── PHASE 3: Save ──
  doc.save(`${slug}-report.pdf`);
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

function drawReportHeader(doc: any, title: string, pageW: number, _pageH: number) {
  // Top bar
  doc.setFillColor(14, 27, 44);
  doc.rect(0, 0, pageW, 35, 'F');

  doc.setFontSize(16);
  doc.setTextColor(245, 247, 249);
  doc.text(title, 20, 18);

  doc.setFontSize(10);
  doc.setTextColor(79, 175, 143);
  doc.text('PITA — Feedback Report', 20, 27);

  const dateStr = new Date().toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(dateStr, pageW - 20, 27, { align: 'right' });
}

function buildFeedbackMap(
  sections: PresentationSection[],
  feedbackData: SectionFeedback[],
  threads: PitaThread[],
  allAttachments: PitaAttachment[],
) {
  const map: Record<string, {
    reactions: { like: number; dislike: number; love: number };
    comments: { name: string; comment: string }[];
    threads: PitaThread[];
    attachments: PitaAttachment[];
  }> = {};

  for (const section of sections) {
    const sectionFb = feedbackData.filter(f => f.section_id === section.id);
    const sectionThreads = threads.filter(t => t.section_id === section.id);
    const sectionAttachments = allAttachments.filter(a => a.section_id === section.id);

    map[section.id] = {
      reactions: {
        like: sectionFb.filter(f => f.reaction === 'like').length,
        dislike: sectionFb.filter(f => f.reaction === 'dislike').length,
        love: sectionFb.filter(f => f.reaction === 'love').length,
      },
      comments: sectionFb.filter(f => f.comment).map(f => ({
        name: f.reviewer_name,
        comment: f.comment!,
      })),
      threads: sectionThreads,
      attachments: sectionAttachments,
    };
  }

  return map;
}
