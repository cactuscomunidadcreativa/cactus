// ═══════════════════════════════════════════════════════════════════════════
// Cifrado de secretos (contraseñas / tokens / API keys de los agentes).
// AES-256-GCM (cifrado autenticado). La llave SOLO vive en el servidor
// (env CACTUS_SECRETS_KEY). NUNCA se guarda en texto plano; si no hay llave,
// NO se cifra y NO se guarda (se rechaza). Solo Node runtime.
// ═══════════════════════════════════════════════════════════════════════════
import crypto from 'crypto';

function getKey(): Buffer | null {
  const raw = process.env.CACTUS_SECRETS_KEY || process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < 8) return null;
  // Deriva 32 bytes deterministas de la frase secreta del servidor
  return crypto.createHash('sha256').update(raw).digest();
}

/** ¿El servidor tiene configurada la llave de cifrado? */
export function secretsConfigured(): boolean {
  return getKey() !== null;
}

/** Cifra texto → base64(iv|tag|ciphertext). null si no hay llave. */
export function encryptSecret(plain: string): string | null {
  const key = getKey();
  if (!key || !plain) return null;
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ct]).toString('base64');
  } catch {
    return null;
  }
}

/** Descifra (solo servidor). null si no hay llave o el dato es inválido/manipulado. */
export function decryptSecret(enc: string): string | null {
  const key = getKey();
  if (!key || !enc) return null;
  try {
    const buf = Buffer.from(enc, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

/** Pista no sensible para mostrar en la UI (últimos 4). */
export function lastFour(s: string): string {
  if (!s) return '';
  return s.length <= 4 ? '••••' : `••••${s.slice(-4)}`;
}
