/* =========================================================
   HDGF Agent — shared state for app.html and settings.html
   All data is fictional. State lives in this browser only.
   ========================================================= */

export const store = {
  get(k, s = localStorage) { try { return s.getItem(k); } catch { return null; } },
  set(k, v, s = localStorage) { try { s.setItem(k, v); } catch {} },
  del(k, s = localStorage) { try { s.removeItem(k); } catch {} },
};

/* ---------- Language ---------- */
export const LANGS = { en: 'English', ko: '한국어' };
export function getLang() { const l = store.get('hdgf.lang'); return LANGS[l] ? l : 'en'; }
export function setLang(l) { store.set('hdgf.lang', LANGS[l] ? l : 'en'); }
// pick({en, ko}) → string for the current language
export const pick = (o, lang = getLang()) => (o && typeof o === 'object' && !Array.isArray(o) ? (o[lang] ?? o.en) : o);

/* ---------- Engine ---------- */
export const MODELS = [
  { id: 'claude-opus-5', label: 'Claude Opus 5', note: { en: 'Most capable (default)', ko: '가장 높은 성능 (기본값)' } },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', note: { en: 'Faster, lower cost', ko: '더 빠르고 저렴함' } },
];
export function getEngine() {
  const key = store.get('hdgf.key') || store.get('hdgf.key', sessionStorage) || '';
  let kind = store.get('hdgf.engine') === 'api' ? 'api' : 'demo';
  if (kind === 'api' && !key) kind = 'demo';
  const m = store.get('hdgf.model');
  return { kind, key, model: MODELS.some((x) => x.id === m) ? m : MODELS[0].id, remembered: !!store.get('hdgf.key') };
}
export function saveEngine({ kind, key, model, remember }) {
  store.set('hdgf.engine', kind === 'api' && key ? 'api' : 'demo');
  store.set('hdgf.model', model);
  store.del('hdgf.key'); store.del('hdgf.key', sessionStorage);
  if (key) store.set('hdgf.key', key, remember ? localStorage : sessionStorage);
}
export function clearKey() { store.del('hdgf.key'); store.del('hdgf.key', sessionStorage); store.set('hdgf.engine', 'demo'); }

let AnthropicCtor = null;
export async function makeClient(key) {
  if (!AnthropicCtor) AnthropicCtor = (await import('../vendor/anthropic-sdk-0.128.0.mjs')).default;
  return new AnthropicCtor({ apiKey: key, dangerouslyAllowBrowser: true });
}

/* ---------- Sharing levels ---------- */
export const LEVELS = ['full', 'summary', 'private'];
export const LEVEL_LABEL = {
  full: { en: 'Share', ko: '공개' },
  summary: { en: 'AI summary only', ko: 'AI 정리본만 공개' },
  private: { en: 'Private', ko: '비공개' },
};
export const LEVEL_DESC = {
  full: { en: 'Your GP sees the original data.', ko: '주치의가 원본 데이터를 봅니다.' },
  summary: { en: 'Your GP sees only a short AI-written summary, not the original entries.', ko: '주치의는 원본이 아닌 AI가 작성한 요약만 봅니다.' },
  private: { en: 'Only you. Your GP and the GP’s agent cannot see it.', ko: '본인만 볼 수 있습니다. 주치의와 주치의용 에이전트는 볼 수 없습니다.' },
};

export const SECTIONS = {
  conditions: { label: { en: 'Conditions', ko: '진단명' }, desc: { en: 'Diagnoses and problem list', ko: '진단 및 문제 목록' } },
  medications: { label: { en: 'Medications', ko: '복용 약' }, desc: { en: 'Current prescriptions', ko: '현재 처방' } },
  labs: { label: { en: 'Lab results', ko: '검사 결과' }, desc: { en: 'HbA1c, kidney function, lipids', ko: '당화혈색소, 신장 기능, 지질' } },
  vitals: { label: { en: 'Home blood pressure', ko: '가정 혈압' }, desc: { en: 'Home monitor readings', ko: '가정용 혈압계 측정값' } },
  wearable: { label: { en: 'Wearable data', ko: '웨어러블 데이터' }, desc: { en: 'Steps, sleep, resting heart rate', ko: '걸음 수, 수면, 안정 시 심박수' } },
  visits: { label: { en: 'Visit history', ko: '진료 이력' }, desc: { en: 'Encounters across providers', ko: '여러 기관의 진료 기록' } },
  journal: { label: { en: 'Personal journal', ko: '개인 메모' }, desc: { en: 'Your own notes', ko: '본인이 작성한 메모' } },
};
export const SECTION_KEYS = Object.keys(SECTIONS);

export const DEFAULT_SHARING = { conditions: 'full', medications: 'full', labs: 'full', vitals: 'full', wearable: 'summary', visits: 'full', journal: 'private' };
export function getSharing() {
  let raw = {};
  try { raw = JSON.parse(store.get('hdgf.consent') || '{}') || {}; } catch {}
  const out = { ...DEFAULT_SHARING };
  for (const k of SECTION_KEYS) {
    const v = raw[k];
    if (v === true) out[k] = 'full';          // migrate earlier on/off values
    else if (v === false) out[k] = 'private';
    else if (LEVELS.includes(v)) out[k] = v;
  }
  return out;
}
export function saveSharing(s) { store.set('hdgf.consent', JSON.stringify(s)); }

export function getRequests() { try { return JSON.parse(store.get('hdgf.requests') || '[]'); } catch { return []; } }
export function saveRequests(r) { store.set('hdgf.requests', JSON.stringify(r)); }

export function resetDemo() { store.del('hdgf.consent'); store.del('hdgf.requests'); }

/* ---------- Fictional record ---------- */
export const PATIENT = { name: 'Mira Kim', short: 'Mira', age: 68, sex: { en: 'Female', ko: '여성' }, id: 'HDGF-0417' };
export const GP = { name: { en: 'Dr. Hana Park', ko: '박하나 선생님' }, role: { en: 'Primary care physician (GP)', ko: '1차의료 주치의' } };

export const RECORD = {
  conditions: [
    { name: { en: 'Type 2 diabetes', ko: '제2형 당뇨병' }, since: '2014' },
    { name: { en: 'Hypertension', ko: '고혈압' }, since: '2011' },
    { name: { en: 'Hyperlipidaemia', ko: '이상지질혈증' }, since: '2016' },
    { name: { en: 'Osteoarthritis, right knee', ko: '오른쪽 무릎 골관절염' }, since: '2021' },
  ],
  medications: [
    { name: 'Metformin', dose: { en: '1000 mg twice daily', ko: '1000 mg 하루 2회' }, purpose: { en: 'blood glucose', ko: '혈당' } },
    { name: 'Amlodipine', dose: { en: '5 mg once daily', ko: '5 mg 하루 1회' }, purpose: { en: 'blood pressure', ko: '혈압' } },
    { name: 'Atorvastatin', dose: { en: '20 mg once daily', ko: '20 mg 하루 1회' }, purpose: { en: 'cholesterol', ko: '콜레스테롤' } },
    { name: 'Acetaminophen', dose: { en: '500 mg as needed', ko: '500 mg 필요 시' }, purpose: { en: 'knee pain', ko: '무릎 통증' } },
  ],
  labs: {
    hba1c: [{ date: '2025-10', value: 7.8 }, { date: '2026-01', value: 7.5 }, { date: '2026-04', value: 7.2 }, { date: '2026-08', value: 7.4 }],
    egfr: [{ date: '2025-10', value: 74 }, { date: '2026-08', value: 68 }],
    ldl: [{ date: '2025-10', value: 118 }, { date: '2026-08', value: 96 }],
    uacr: [{ date: '2026-08', value: 22 }],
  },
  vitals: { period: { en: 'last 30 days', ko: '최근 30일' }, homeAvg: '138/84', readings: 41, clinic: { date: '2026-08-12', value: '142/86' } },
  wearable: {
    steps: { now: 4200, before: 6100 },
    sleep: { now: { en: '5 h 40 min', ko: '5시간 40분' }, before: { en: '6 h 50 min', ko: '6시간 50분' } },
    rhr: { now: 72, before: 66 },
    window: { en: 'last 30 days vs. 3 months ago', ko: '최근 30일과 3개월 전 비교' },
  },
  visits: [
    { date: '2026-08-12', where: { en: 'GP — Dr. Hana Park', ko: '의원 — 박하나 선생님' }, what: { en: 'Diabetes and blood pressure review', ko: '당뇨·혈압 정기 진료' } },
    { date: '2026-05-03', where: { en: 'Orthopaedics — City Hospital', ko: '정형외과 — 시립병원' }, what: { en: 'Right knee pain; X-ray, physiotherapy referral', ko: '오른쪽 무릎 통증, X선 촬영, 물리치료 의뢰' } },
    { date: '2026-01-20', where: { en: 'GP — Dr. Hana Park', ko: '의원 — 박하나 선생님' }, what: { en: 'Routine review; HbA1c improving', ko: '정기 진료, 당화혈색소 개선' } },
  ],
  journal: [
    { date: '2026-09-02', text: { en: 'Caring for my husband since his dementia diagnosis in the spring. Hard to find time for walks.', ko: '봄에 남편이 치매 진단을 받은 뒤로 돌보고 있다. 산책할 시간을 내기 어렵다.' } },
    { date: '2026-09-14', text: { en: 'Skipping lunch some days. Sleeping badly. Knee worse on the stairs.', ko: '점심을 거르는 날이 있다. 잠을 잘 못 잔다. 계단에서 무릎이 더 아프다.' } },
  ],
};

// Record with every {en, ko} value resolved to one language — used for export and API tools.
export function localizedRecord(lang = getLang()) {
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      if ('en' in v && 'ko' in v && Object.keys(v).length === 2) return v[lang];
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    }
    return v;
  };
  return walk(RECORD);
}

// Pre-written summaries used in demo mode for sections shared as "AI summary only".
export const DEMO_SUMMARIES = {
  conditions: { en: 'Long-standing type 2 diabetes, hypertension and raised cholesterol, plus knee osteoarthritis.', ko: '오래된 제2형 당뇨병, 고혈압, 고콜레스테롤이 있고 무릎 골관절염이 있습니다.' },
  medications: { en: 'Takes regular medication for blood sugar, blood pressure and cholesterol, and a pain reliever as needed.', ko: '혈당·혈압·콜레스테롤 약을 정기 복용하고, 필요할 때 진통제를 복용합니다.' },
  labs: { en: 'Blood sugar control improved over the past year but slipped slightly at the last test. Kidney function slightly lower than last year; cholesterol improved.', ko: '지난 1년간 혈당 조절이 개선되었으나 최근 검사에서 약간 나빠졌습니다. 신장 기능은 작년보다 조금 낮고, 콜레스테롤은 개선되었습니다.' },
  vitals: { en: 'Home blood pressure has been somewhat above the usual target over the last month.', ko: '최근 한 달간 가정 혈압이 일반적인 목표보다 다소 높았습니다.' },
  wearable: { en: 'Over the last month, activity and sleep have both decreased compared with three months ago, and resting heart rate is slightly higher.', ko: '최근 한 달 동안 3개월 전보다 활동량과 수면 시간이 모두 줄었고, 안정 시 심박수가 약간 높아졌습니다.' },
  visits: { en: 'Regular GP follow-up for diabetes and blood pressure; one orthopaedic visit for knee pain this year.', ko: '당뇨·혈압으로 주치의에게 정기 진료를 받고 있으며, 올해 무릎 통증으로 정형외과를 한 번 방문했습니다.' },
  journal: { en: 'Notes describe new responsibilities at home that are affecting time for exercise, regular meals and sleep. The patient may want to talk about this.', ko: '집안에서 새로 생긴 부담 때문에 운동·규칙적인 식사·수면에 영향이 있다고 적혀 있습니다. 환자가 이야기하고 싶어 할 수 있습니다.' },
};
