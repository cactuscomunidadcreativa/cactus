// Extracción de texto de documentos EN EL NAVEGADOR — sin consumir IA.
// PDF con texto → pdf.js (instantáneo). Imagen / PDF escaneado → OCR tesseract.js (WASM local).
// Las libs se cargan con import() dinámico, así solo se descargan cuando se usan.

export async function extractText(file: File): Promise<string> {
  const name = (file.name || '').toLowerCase();
  const type = file.type || '';
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    // Si el PDF no traía capa de texto (escaneado) devolvemos lo que haya.
    return extractPdf(file);
  }
  if (type.startsWith('image/')) return extractImage(file);
  if (/sheet|excel|spreadsheet/.test(type) || /\.(xlsx|xlsm|xls|ods)$/.test(name)) return extractExcel(file);
  // csv / txt / otros planos
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

// Excel / hoja de cálculo: recorre TODAS las pestañas y las vuelca a texto (CSV por hoja).
async function extractExcel(file: File): Promise<string> {
  const XLSX: any = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const names: string[] = wb.SheetNames || [];
  let out = '';
  for (const name of names) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false });
    if (csv.trim()) out += `### Hoja: ${name}\n${csv}\n\n`;
  }
  return out.trim();
}
