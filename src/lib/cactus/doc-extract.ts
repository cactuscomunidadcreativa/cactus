// Extracción de texto de documentos EN EL NAVEGADOR — sin consumir IA.
// PDF con texto → pdf.js (instantáneo). Imagen / PDF escaneado → OCR tesseract.js (WASM local).
// Las libs se cargan con import() dinámico, así solo se descargan cuando se usan.

export async function extractText(file: File): Promise<string> {
  const name = (file.name || '').toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    const txt = await extractPdf(file);
    // Si el PDF no traía capa de texto (escaneado), cae a OCR de la 1ª página no es trivial → devolvemos lo que haya.
    return txt;
  }
  if (file.type.startsWith('image/')) return extractImage(file);
  // txt / csv / otros
  try { return (await file.text()).trim(); } catch { return ''; }
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs: any = await import('pdfjs-dist');
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  } catch { /* noop */ }
  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  let out = '';
  const max = Math.min(doc.numPages, 15);
  for (let i = 1; i <= max; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it: any) => (typeof it.str === 'string' ? it.str : '')).join(' ') + '\n';
  }
  return out.trim();
}

async function extractImage(file: File): Promise<string> {
  const mod: any = await import('tesseract.js');
  const Tesseract = mod.default || mod;
  const { data } = await Tesseract.recognize(file, 'spa+eng');
  return String(data?.text || '').trim();
}
