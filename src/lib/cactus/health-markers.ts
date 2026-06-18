// Lector de marcadores de análisis clínicos — interpretación por RANGOS DE REFERENCIA.
// 100% determinístico, SIN consumir IA. Rangos generales de adulto (orientativos, no diagnóstico).

export type MarkerStatus = 'bajo' | 'normal' | 'limite' | 'alto';
export interface MarkerResult { label: string; raw: string; value: number; unit: string; ref: string; status: MarkerStatus; note: string }

interface MarkerDef {
  key: string; label: string; unit: string; ref: string;
  pat: string; // alternativas de nombre (regex, sin flags)
  classify: (v: number) => [MarkerStatus, string];
}

const DEFS: MarkerDef[] = [
  { key: 'glucosa', label: 'Glucosa', unit: 'mg/dL', ref: '70–100 (ayunas)', pat: 'glucosa|glicemia|glucemia',
    classify: (v) => v < 70 ? ['bajo', 'Por debajo de lo normal'] : v <= 100 ? ['normal', 'En rango (ayunas)'] : v <= 125 ? ['limite', 'Ligeramente elevada (rango prediabetes)'] : ['alto', 'Elevada'] },
  { key: 'hba1c', label: 'Hemoglobina glicosilada (HbA1c)', unit: '%', ref: '< 5.7%', pat: 'hba1c|hemoglobina glicosilada|glicada',
    classify: (v) => v < 5.7 ? ['normal', 'En rango'] : v < 6.5 ? ['limite', 'Rango prediabetes'] : ['alto', 'Rango diabetes'] },
  { key: 'colesterol', label: 'Colesterol total', unit: 'mg/dL', ref: '< 200', pat: 'colesterol total|colesterol(?! hdl)(?! ldl)',
    classify: (v) => v < 200 ? ['normal', 'Deseable'] : v <= 239 ? ['limite', 'Limítrofe alto'] : ['alto', 'Alto'] },
  { key: 'hdl', label: 'Colesterol HDL', unit: 'mg/dL', ref: '≥ 40 (mejor más alto)', pat: 'hdl',
    classify: (v) => v < 40 ? ['bajo', 'Bajo (conviene subirlo)'] : ['normal', 'Bien'] },
  { key: 'ldl', label: 'Colesterol LDL', unit: 'mg/dL', ref: '< 100', pat: 'ldl',
    classify: (v) => v < 100 ? ['normal', 'Óptimo'] : v <= 129 ? ['normal', 'Casi óptimo'] : v <= 159 ? ['limite', 'Limítrofe alto'] : ['alto', 'Alto'] },
  { key: 'trigliceridos', label: 'Triglicéridos', unit: 'mg/dL', ref: '< 150', pat: 'triglic[eé]ridos',
    classify: (v) => v < 150 ? ['normal', 'Normal'] : v <= 199 ? ['limite', 'Limítrofe alto'] : ['alto', 'Alto'] },
  { key: 'hemoglobina', label: 'Hemoglobina', unit: 'g/dL', ref: '12–17', pat: 'hemoglobina(?! glic)(?! gluc)|hgb|\\bhb\\b',
    classify: (v) => v < 12 ? ['bajo', 'Baja (posible anemia)'] : v <= 17 ? ['normal', 'En rango'] : ['alto', 'Alta'] },
  { key: 'creatinina', label: 'Creatinina', unit: 'mg/dL', ref: '0.6–1.3', pat: 'creatinina',
    classify: (v) => v < 0.6 ? ['bajo', 'Baja'] : v <= 1.3 ? ['normal', 'En rango'] : ['alto', 'Elevada'] },
  { key: 'urico', label: 'Ácido úrico', unit: 'mg/dL', ref: '3.5–7.2', pat: '[aá]cido [uú]rico|\\b[aá]\\.?\\s?[uú]rico',
    classify: (v) => v < 3.5 ? ['bajo', 'Bajo'] : v <= 7.2 ? ['normal', 'En rango'] : ['alto', 'Elevado'] },
  { key: 'tsh', label: 'TSH', unit: 'µUI/mL', ref: '0.4–4.0', pat: 'tsh',
    classify: (v) => v < 0.4 ? ['bajo', 'Baja'] : v <= 4 ? ['normal', 'En rango'] : ['alto', 'Elevada'] },
  { key: 'vitd', label: 'Vitamina D', unit: 'ng/mL', ref: '≥ 30', pat: 'vitamina d|25[\\s-]?oh|hidroxivitamina',
    classify: (v) => v < 20 ? ['bajo', 'Deficiencia'] : v < 30 ? ['limite', 'Insuficiente'] : ['normal', 'Suficiente'] },
];

function findValue(text: string, pat: string): { value: number; raw: string } | null {
  const re = new RegExp(`(?:${pat})[^0-9\\n]{0,25}([0-9]{1,4}(?:[.,][0-9]{1,2})?)`, 'i');
  const m = text.match(re);
  if (!m) return null;
  const raw = m[1];
  const value = parseFloat(raw.replace(',', '.'));
  if (!isFinite(value)) return null;
  return { value, raw };
}

export function parseMarkers(rawText: string): MarkerResult[] {
  const text = (rawText || '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ');
  const out: MarkerResult[] = [];

  // Presión arterial (dos números)
  const bp = text.match(/(?:presi[oó]n(?:\s*arterial)?|t\.?\s?a\.?)[^0-9]{0,15}([0-9]{2,3})\s*\/\s*([0-9]{2,3})/i);
  if (bp) {
    const sys = +bp[1], dia = +bp[2];
    let status: MarkerStatus = 'normal', note = 'Óptima';
    if (sys >= 140 || dia >= 90) { status = 'alto'; note = 'Alta (hipertensión)'; }
    else if (sys >= 130 || dia >= 80) { status = 'limite'; note = 'Ligeramente elevada'; }
    else if (sys >= 120) { status = 'limite'; note = 'Elevada'; }
    out.push({ label: 'Presión arterial', raw: `${sys}/${dia}`, value: sys, unit: 'mmHg', ref: '< 120/80', status, note });
  }

  for (const d of DEFS) {
    const f = findValue(text, d.pat);
    if (!f) continue;
    const [status, note] = d.classify(f.value);
    out.push({ label: d.label, raw: f.raw, value: f.value, unit: d.unit, ref: d.ref, status, note });
  }
  return out;
}
