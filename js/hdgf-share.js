/* =========================================================
   Patient share codes — shown as a QR code and as a typed code.

   The code carries everything the clinician's app needs, so it works
   across devices without a server:
     version · patient · sharing level of each section · expiry · nonce · check
   11 characters of Crockford base32, shown as XXXX-XXXX-XXX.

   Prototype limits: the code is not signed, so it can be forged, and
   anyone holding it can import the record at the levels it carries.
   A production system would issue signed, single-use grants from a server.
   ========================================================= */
import { PATIENTS, SECTION_KEYS, LEVELS } from './hdgf-core.js';
import qrcode from '../vendor/qrcode-generator-2.0.4.mjs';

const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const EPOCH = Date.UTC(2026, 0, 1);
const HOUR = 3600e3;
export const CODE_TTL_HOURS = 24;

const enc = (n, len) => { let s = ''; for (let i = 0; i < len; i++) { s = ALPHA[n % 32] + s; n = Math.floor(n / 32); } return s; };
const dec = (s) => [...s].reduce((n, c) => n * 32 + ALPHA.indexOf(c), 0);
const check = (body) => ALPHA[[...body].reduce((a, c, i) => a + ALPHA.indexOf(c) * (i + 1), 0) % 32];

export function makeShareCode(pid, levels, now = Date.now()) {
  const pidx = PATIENTS.findIndex((p) => p.id === pid);
  if (pidx < 0) throw new Error('unknown patient');
  const lv = SECTION_KEYS.reduce((n, k, i) => n + LEVELS.indexOf(levels[k]) * 3 ** i, 0);
  const exp = Math.ceil((now - EPOCH) / HOUR) + CODE_TTL_HOURS;
  const nonce = Math.floor(Math.random() * 1024);
  const body = enc(1, 1) + enc(pidx, 1) + enc(lv, 3) + enc(exp, 3) + enc(nonce, 2);
  return body + check(body);
}
export const formatCode = (c) => `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`;
export const expiresAt = (code) => new Date(EPOCH + dec(normalize(code).slice(5, 8)) * HOUR);

function normalize(input) {
  let s = String(input || '').trim();
  try { const u = new URL(s); s = u.searchParams.get('import') || s; } catch {}
  return s.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/[^0-9A-Z]/g, '');
}

// → { ok: true, pid, levels, expires } | { ok: false, reason: 'format'|'check'|'version'|'patient'|'expired' }
export function readShareCode(input, now = Date.now()) {
  const c = normalize(input);
  if (c.length !== 11 || [...c].some((ch) => !ALPHA.includes(ch))) return { ok: false, reason: 'format' };
  if (check(c.slice(0, 10)) !== c[10]) return { ok: false, reason: 'check' };
  if (dec(c[0]) !== 1) return { ok: false, reason: 'version' };
  const p = PATIENTS[dec(c[1])];
  if (!p) return { ok: false, reason: 'patient' };
  let lv = dec(c.slice(2, 5));
  const levels = {};
  for (const k of SECTION_KEYS) { levels[k] = LEVELS[lv % 3]; lv = Math.floor(lv / 3); }
  const expires = new Date(EPOCH + dec(c.slice(5, 8)) * HOUR);
  if (expires.getTime() < now) return { ok: false, reason: 'expired', pid: p.id, expires };
  return { ok: true, code: c, pid: p.id, levels, expires };
}

// URL encoded in the QR: opening it with a phone camera leads to the import screen.
export function shareUrl(code) {
  const base = location.href.replace(/[^/]*([?#].*)?$/, '');
  return `${base}agent.html?import=${code}`;
}

export function qrSvg(text, { size = 200 } = {}) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount(), q = 4, cell = size / (n + q * 2);
  let path = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) path += `M${((c + q) * cell).toFixed(2)} ${((r + q) * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#1C2B36"/></svg>`;
}

// Decode a QR code from ImageData (camera frame or uploaded image).
let jsQR = null;
export async function decodeQR(imageData) {
  if (!jsQR) jsQR = (await import('../vendor/jsqr-1.4.0.mjs')).default;
  const r = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
  return r ? r.data : null;
}
