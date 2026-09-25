/* =========================================================
   HDGF Agent — shared state and fictional data for all pages.
   Every person, clinic, record and demo trial here is fictional.
   State lives in this browser only.
   ========================================================= */

export const store = {
  get(k, s = localStorage) { try { return s.getItem(k); } catch { return null; } },
  set(k, v, s = localStorage) { try { s.setItem(k, v); } catch {} },
  del(k, s = localStorage) { try { s.removeItem(k); } catch {} },
};
const readJSON = (k, fallback) => { try { const v = JSON.parse(store.get(k)); return v ?? fallback; } catch { return fallback; } };

/* ---------- Language ---------- */
export const LANGS = { en: 'English', ko: '한국어' };
export function getLang() { const l = store.get('hdgf.lang'); return LANGS[l] ? l : 'en'; }
export function setLang(l) { store.set('hdgf.lang', LANGS[l] ? l : 'en'); }
export const pick = (o, lang = getLang()) => (o && typeof o === 'object' && !Array.isArray(o) ? (o[lang] ?? o.en) : o);
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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

/* ---------- People (fictional) ---------- */
export const GP = {
  id: 'dr-park',
  name: { en: 'Dr. Hana Park', ko: '박하나 선생님' },
  plain: { en: 'Hana Park, MD', ko: '박하나' },
  role: { en: 'Family physician (GP)', ko: '가정의학과 주치의' },
  clinic: { en: 'Lakeside Family Clinic', ko: '레이크사이드 가정의원' },
  city: 'Minneapolis, MN',
};

export const PATIENTS = [
  { id: 'mira', name: 'Mira Kim', short: 'Mira', initials: 'MK', age: 68, sex: 'F', city: 'Minneapolis, MN' },
  { id: 'daniel', name: 'Daniel Lee', short: 'Daniel', initials: 'DL', age: 45, sex: 'M', city: 'Saint Paul, MN' },
  { id: 'priya', name: 'Priya Shah', short: 'Priya', initials: 'PS', age: 34, sex: 'F', city: 'Minneapolis, MN' },
  { id: 'tom', name: 'Tom Becker', short: 'Tom', initials: 'TB', age: 74, sex: 'M', city: 'Bloomington, MN' },
];
export const SEX = { F: { en: 'Female', ko: '여성' }, M: { en: 'Male', ko: '남성' } };
export const patientById = (id) => PATIENTS.find((p) => p.id === id);

/* ---------- Session (demo sign-in, no real authentication) ---------- */
export function getSession() {
  const s = readJSON('hdgf.session', null);
  if (!s) return null;
  if (s.role === 'patient' && patientById(s.patientId)) return s;
  if (s.role === 'physician') return s;
  return null;
}
export function signIn(session) { store.set('hdgf.session', JSON.stringify(session)); }
export function signOut() { store.del('hdgf.session'); }

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
  labs: { label: { en: 'Test results', ko: '검사 결과' }, desc: { en: 'Blood, urine and lung tests', ko: '혈액·소변·폐 기능 검사' } },
  vitals: { label: { en: 'Home blood pressure', ko: '가정 혈압' }, desc: { en: 'Home monitor readings', ko: '가정용 혈압계 측정값' } },
  wearable: { label: { en: 'Wearable data', ko: '웨어러블 데이터' }, desc: { en: 'Steps, sleep, resting heart rate', ko: '걸음 수, 수면, 안정 시 심박수' } },
  visits: { label: { en: 'Visit history', ko: '진료 이력' }, desc: { en: 'Encounters across providers', ko: '여러 기관의 진료 기록' } },
  journal: { label: { en: 'Personal journal', ko: '개인 메모' }, desc: { en: 'Your own notes', ko: '본인이 작성한 메모' } },
};
export const SECTION_KEYS = Object.keys(SECTIONS);

const DEFAULT_SHARING = {
  mira: { conditions: 'full', medications: 'full', labs: 'full', vitals: 'full', wearable: 'summary', visits: 'full', journal: 'private' },
  daniel: { conditions: 'full', medications: 'full', labs: 'full', vitals: 'full', wearable: 'private', visits: 'full', journal: 'summary' },
  priya: { conditions: 'full', medications: 'full', labs: 'full', vitals: 'full', wearable: 'full', visits: 'full', journal: 'private' },
  tom: { conditions: 'full', medications: 'full', labs: 'summary', vitals: 'full', wearable: 'full', visits: 'full', journal: 'private' },
};
export function getSharing(pid) {
  let raw = readJSON(`hdgf.consent.${pid}`, null);
  if (!raw && pid === 'mira') raw = readJSON('hdgf.consent', null);   // earlier single-patient versions
  const out = { ...DEFAULT_SHARING[pid] };
  for (const k of SECTION_KEYS) {
    const v = raw && raw[k];
    if (v === true) out[k] = 'full';
    else if (v === false) out[k] = 'private';
    else if (LEVELS.includes(v)) out[k] = v;
  }
  return out;
}
export function saveSharing(pid, s) { store.set(`hdgf.consent.${pid}`, JSON.stringify(s)); }

export function getRequests() {
  return readJSON('hdgf.requests', []).map((r) => ({ patientId: 'mira', ...r }));
}
export function saveRequests(r) { store.set('hdgf.requests', JSON.stringify(r)); }

// Trial interest (patient) and suggestions (GP), per patient: { [trialId]: { interested, suggested } }
export function getTrialFlags(pid) { return readJSON(`hdgf.trials.${pid}`, {}); }
export function saveTrialFlags(pid, f) { store.set(`hdgf.trials.${pid}`, JSON.stringify(f)); }

export function resetDemo(pid) {
  const ids = pid ? [pid] : PATIENTS.map((p) => p.id);
  ids.forEach((id) => { store.del(`hdgf.consent.${id}`); store.del(`hdgf.trials.${id}`); });
  if (!pid || pid === 'mira') store.del('hdgf.consent');
  saveRequests(pid ? getRequests().filter((r) => r.patientId !== pid) : []);
}
export function wipeAll() {
  resetDemo();
  ['hdgf.requests', 'hdgf.engine', 'hdgf.model', 'hdgf.key', 'hdgf.lang', 'hdgf.session'].forEach((k) => store.del(k));
  store.del('hdgf.key', sessionStorage);
}

/* ---------- Test catalogue ---------- */
// target: a commonly used reference value, shown as general information only.
export const LAB_INFO = {
  hba1c: { name: { en: 'HbA1c', ko: '당화혈색소(HbA1c)' }, unit: '%', worse: 'up', target: { op: '<', value: 7 },
    what: { en: 'average blood sugar over about 3 months', ko: '약 3개월간의 평균 혈당' } },
  egfr: { name: { en: 'eGFR', ko: '사구체여과율(eGFR)' }, unit: 'mL/min/1.73m²', worse: 'down', target: { op: '>=', value: 60 },
    what: { en: 'how well the kidneys filter the blood', ko: '신장이 혈액을 걸러 내는 능력' } },
  ldl: { name: { en: 'LDL cholesterol', ko: 'LDL 콜레스테롤' }, unit: 'mg/dL', worse: 'up',
    what: { en: '“bad” cholesterol linked to heart and vessel disease', ko: '심혈관 질환과 관련된 “나쁜” 콜레스테롤' } },
  uacr: { name: { en: 'Urine albumin/creatinine', ko: '요 알부민/크레아티닌 비' }, unit: 'mg/g', worse: 'up', target: { op: '<', value: 30 },
    what: { en: 'protein leaking into the urine, an early sign of kidney strain', ko: '소변으로 새는 단백질, 신장 부담의 초기 신호' } },
  eos: { name: { en: 'Blood eosinophils', ko: '혈중 호산구' }, unit: 'cells/µL', worse: 'up',
    what: { en: 'white blood cells linked to allergic and asthma inflammation', ko: '알레르기·천식 염증과 관련된 백혈구' } },
  fev1: { name: { en: 'FEV1 (% predicted)', ko: 'FEV1(예측치 대비 %)' }, unit: '%', worse: 'down', target: { op: '>=', value: 80 },
    what: { en: 'how much air can be blown out in one second; lower means narrower airways', ko: '1초 동안 내쉴 수 있는 공기량, 낮을수록 기도가 좁음을 뜻함' } },
  ntprobnp: { name: { en: 'NT-proBNP', ko: 'NT-proBNP' }, unit: 'pg/mL', worse: 'up',
    what: { en: 'a blood marker of strain on the heart', ko: '심장 부담을 나타내는 혈액 지표' } },
};
export const latest = (lab) => lab.series[lab.series.length - 1];
export const previous = (lab) => lab.series[lab.series.length - 2];
export function labStatus(lab) {
  const info = LAB_INFO[lab.key], l = latest(lab), p = previous(lab);
  const delta = p ? l.value - p.value : 0;
  const worsening = !!p && delta !== 0 && ((info.worse === 'up' && delta > 0) || (info.worse === 'down' && delta < 0));
  const t = info.target;
  const offTarget = !!t && (t.op === '<' ? !(l.value < t.value) : !(l.value >= t.value));
  return { latest: l, previous: p, delta, worsening, offTarget };
}
export function targetText(key, lang) {
  const t = LAB_INFO[key].target, u = LAB_INFO[key].unit;
  if (!t) return '';
  return lang === 'ko' ? `흔히 쓰는 기준: ${t.value}${u === '%' ? '%' : ` ${u}`} ${t.op === '<' ? '미만' : '이상'}` : `common reference: ${t.op === '<' ? 'below' : 'at least'} ${t.value}${u === '%' ? '%' : ` ${u}`}`;
}
export const BP_GOAL = { sys: 130, dia: 80 };

/* ---------- Conditions catalogue (used for matching) ---------- */
export const CONDITIONS = {
  t2dm: { en: 'Type 2 diabetes', ko: '제2형 당뇨병', search: 'Type 2 Diabetes', specialties: ['endo'] },
  htn: { en: 'Hypertension', ko: '고혈압', search: 'Hypertension', specialties: [] },
  lipid: { en: 'Hyperlipidaemia', ko: '이상지질혈증', search: 'Hyperlipidemia', specialties: [] },
  oa_knee: { en: 'Osteoarthritis, right knee', ko: '오른쪽 무릎 골관절염', search: 'Knee Osteoarthritis', specialties: ['ortho', 'pt'] },
  fabry: { en: 'Fabry disease', ko: '파브리병', search: 'Fabry Disease', specialties: ['genetics', 'nephro'] },
  ckd: { en: 'Chronic kidney disease, stage 3a', ko: '만성 신장병 3a기', search: 'Chronic Kidney Disease', specialties: ['nephro'] },
  asthma: { en: 'Severe asthma', ko: '중증 천식', search: 'Severe Asthma', specialties: ['pulm', 'allergy'] },
  rhinitis: { en: 'Allergic rhinitis', ko: '알레르기 비염', search: 'Allergic Rhinitis', specialties: ['allergy'] },
  hf: { en: 'Heart failure with reduced ejection fraction', ko: '박출률 감소 심부전', search: 'Heart Failure', specialties: ['cardio_hf'] },
  af: { en: 'Atrial fibrillation', ko: '심방세동', search: 'Atrial Fibrillation', specialties: ['cardio_ep'] },
};

/* ---------- Fictional records ---------- */
const hm = (h, m) => ({ en: `${h} h ${m} min`, ko: `${h}시간 ${m}분` });
const GPV = { en: 'GP — Dr. Hana Park', ko: '의원 — 박하나 선생님' };

export const RECORDS = {
  mira: {
    conditions: [{ code: 't2dm', since: '2014' }, { code: 'htn', since: '2011' }, { code: 'lipid', since: '2016' }, { code: 'oa_knee', since: '2021' }],
    medications: [
      { name: 'Metformin', dose: { en: '1000 mg twice daily', ko: '1000 mg 하루 2회' }, purpose: { en: 'blood glucose', ko: '혈당' } },
      { name: 'Amlodipine', dose: { en: '5 mg once daily', ko: '5 mg 하루 1회' }, purpose: { en: 'blood pressure', ko: '혈압' } },
      { name: 'Atorvastatin', dose: { en: '20 mg once daily', ko: '20 mg 하루 1회' }, purpose: { en: 'cholesterol', ko: '콜레스테롤' } },
      { name: 'Acetaminophen', dose: { en: '500 mg as needed', ko: '500 mg 필요 시' }, purpose: { en: 'knee pain', ko: '무릎 통증' } },
    ],
    labs: [
      { key: 'hba1c', series: [{ date: '2025-10', value: 7.8 }, { date: '2026-01', value: 7.5 }, { date: '2026-04', value: 7.2 }, { date: '2026-08', value: 7.4 }] },
      { key: 'egfr', series: [{ date: '2025-10', value: 74 }, { date: '2026-08', value: 68 }] },
      { key: 'ldl', series: [{ date: '2025-10', value: 118 }, { date: '2026-08', value: 96 }] },
      { key: 'uacr', series: [{ date: '2026-08', value: 22 }] },
    ],
    vitals: { sys: 138, dia: 84, readings: 41, clinic: { date: '2026-08-12', value: '142/86' } },
    wearable: { steps: { now: 4200, before: 6100 }, sleep: { now: hm(5, 40), before: hm(6, 50), nowMin: 340, beforeMin: 410 }, rhr: { now: 72, before: 66 } },
    visits: [
      { date: '2026-08-12', where: GPV, what: { en: 'Diabetes and blood pressure review', ko: '당뇨·혈압 정기 진료' } },
      { date: '2026-05-03', where: { en: 'Orthopaedics — City Hospital', ko: '정형외과 — 시립병원' }, what: { en: 'Right knee pain; X-ray, physiotherapy referral', ko: '오른쪽 무릎 통증, X선 촬영, 물리치료 의뢰' } },
      { date: '2026-01-20', where: GPV, what: { en: 'Routine review; HbA1c improving', ko: '정기 진료, 당화혈색소 개선' } },
    ],
    journal: [
      { date: '2026-09-02', text: { en: 'Caring for my husband since his dementia diagnosis in the spring. Hard to find time for walks.', ko: '봄에 남편이 치매 진단을 받은 뒤로 돌보고 있다. 산책할 시간을 내기 어렵다.' } },
      { date: '2026-09-14', text: { en: 'Skipping lunch some days. Sleeping badly. Knee worse on the stairs.', ko: '점심을 거르는 날이 있다. 잠을 잘 못 잔다. 계단에서 무릎이 더 아프다.' } },
    ],
  },
  daniel: {
    conditions: [{ code: 'fabry', since: '2019' }, { code: 'ckd', since: '2023' }, { code: 'htn', since: '2022' }],
    medications: [
      { name: 'Agalsidase beta', dose: { en: 'IV infusion every 2 weeks', ko: '2주마다 정맥 주입' }, purpose: { en: 'enzyme replacement for Fabry disease', ko: '파브리병 효소 대체 요법' } },
      { name: 'Losartan', dose: { en: '50 mg once daily', ko: '50 mg 하루 1회' }, purpose: { en: 'blood pressure and kidney protection', ko: '혈압 조절 및 신장 보호' } },
    ],
    labs: [
      { key: 'egfr', series: [{ date: '2025-09', value: 58 }, { date: '2026-03', value: 55 }, { date: '2026-09', value: 52 }] },
      { key: 'uacr', series: [{ date: '2025-09', value: 180 }, { date: '2026-09', value: 240 }] },
    ],
    vitals: { sys: 132, dia: 82, readings: 28, clinic: { date: '2026-09-05', value: '134/84' } },
    wearable: { steps: { now: 7400, before: 7800 }, sleep: { now: hm(6, 50), before: hm(7, 0), nowMin: 410, beforeMin: 420 }, rhr: { now: 66, before: 64 } },
    visits: [
      { date: '2026-09-05', where: { en: 'Nephrology — University Kidney Clinic', ko: '신장내과 — 대학병원 신장클리닉' }, what: { en: 'Kidney function follow-up', ko: '신장 기능 추적 관찰' } },
      { date: '2026-06-18', where: GPV, what: { en: 'Blood pressure review', ko: '혈압 정기 진료' } },
      { date: '2026-02-10', where: { en: 'Medical genetics — University Hospital', ko: '의학유전학과 — 대학병원' }, what: { en: 'Annual Fabry disease review', ko: '파브리병 연례 점검' } },
    ],
    journal: [
      { date: '2026-08-30', text: { en: 'Worried my kidney numbers keep dropping. My brother has the same condition.', ko: '신장 수치가 계속 떨어져 걱정이다. 형도 같은 병을 앓고 있다.' } },
      { date: '2026-09-12', text: { en: 'Read about new treatments online. Would like to know if I could join a study.', ko: '인터넷에서 새 치료법에 대해 읽었다. 연구에 참여할 수 있는지 알고 싶다.' } },
    ],
  },
  priya: {
    conditions: [{ code: 'asthma', since: '2010' }, { code: 'rhinitis', since: '2008' }],
    medications: [
      { name: 'Budesonide/formoterol inhaler', dose: { en: '2 puffs twice daily and as needed', ko: '하루 2회 2번 흡입, 필요 시 추가' }, purpose: { en: 'asthma control and relief', ko: '천식 조절 및 증상 완화' } },
      { name: 'Montelukast', dose: { en: '10 mg once daily', ko: '10 mg 하루 1회' }, purpose: { en: 'asthma and allergies', ko: '천식·알레르기' } },
    ],
    labs: [
      { key: 'eos', series: [{ date: '2025-11', value: 380 }, { date: '2026-06', value: 450 }] },
      { key: 'fev1', series: [{ date: '2025-11', value: 78 }, { date: '2026-06', value: 71 }] },
    ],
    vitals: { sys: 118, dia: 76, readings: 12, clinic: { date: '2026-08-20', value: '120/78' } },
    wearable: { steps: { now: 8800, before: 9100 }, sleep: { now: hm(6, 20), before: hm(7, 10), nowMin: 380, beforeMin: 430 }, rhr: { now: 68, before: 62 } },
    visits: [
      { date: '2026-08-20', where: GPV, what: { en: 'Follow-up after asthma flare abroad', ko: '해외 천식 악화 후 추적 진료' } },
      { date: '2026-07-14', where: { en: 'Emergency department — abroad', ko: '응급실 — 해외' }, what: { en: 'Asthma flare while travelling; nebuliser, oral steroids', ko: '여행 중 천식 악화, 네뷸라이저·경구 스테로이드 치료' } },
      { date: '2026-03-02', where: { en: 'Pulmonology — Lung Center', ko: '호흡기내과 — 폐센터' }, what: { en: 'Lung function test', ko: '폐 기능 검사' } },
    ],
    journal: [
      { date: '2026-09-08', text: { en: 'Coughing at night more since the summer. New job has been stressful.', ko: '여름 이후 밤에 기침이 늘었다. 새 직장 때문에 스트레스가 많다.' } },
    ],
  },
  tom: {
    conditions: [{ code: 'hf', since: '2022' }, { code: 'af', since: '2020' }, { code: 'htn', since: '2005' }],
    medications: [
      { name: 'Sacubitril/valsartan', dose: { en: '49/51 mg twice daily', ko: '49/51 mg 하루 2회' }, purpose: { en: 'heart failure', ko: '심부전' } },
      { name: 'Metoprolol succinate', dose: { en: '50 mg once daily', ko: '50 mg 하루 1회' }, purpose: { en: 'heart rate and heart failure', ko: '심박수 조절·심부전' } },
      { name: 'Apixaban', dose: { en: '5 mg twice daily', ko: '5 mg 하루 2회' }, purpose: { en: 'stroke prevention in atrial fibrillation', ko: '심방세동 뇌졸중 예방' } },
      { name: 'Dapagliflozin', dose: { en: '10 mg once daily', ko: '10 mg 하루 1회' }, purpose: { en: 'heart failure', ko: '심부전' } },
      { name: 'Furosemide', dose: { en: '20 mg once daily', ko: '20 mg 하루 1회' }, purpose: { en: 'fluid control', ko: '체액 조절' } },
    ],
    labs: [
      { key: 'ntprobnp', series: [{ date: '2026-02', value: 900 }, { date: '2026-05', value: 1150 }, { date: '2026-08', value: 1600 }] },
      { key: 'egfr', series: [{ date: '2026-02', value: 58 }, { date: '2026-08', value: 54 }] },
    ],
    vitals: { sys: 124, dia: 72, readings: 52, clinic: { date: '2026-08-28', value: '126/74' } },
    wearable: { steps: { now: 2600, before: 3500 }, sleep: { now: hm(6, 10), before: hm(6, 30), nowMin: 370, beforeMin: 390 }, rhr: { now: 78, before: 70 } },
    visits: [
      { date: '2026-08-28', where: { en: 'Cardiology — Heart Clinic', ko: '순환기내과 — 심장클리닉' }, what: { en: 'Heart failure review', ko: '심부전 정기 진료' } },
      { date: '2026-06-10', where: GPV, what: { en: 'Annual review', ko: '연례 점검' } },
    ],
    journal: [
      { date: '2026-09-10', text: { en: 'Out of breath climbing the stairs to the bedroom. Living alone since my wife passed away last year.', ko: '침실로 가는 계단을 오를 때 숨이 찬다. 작년에 아내가 세상을 떠난 뒤 혼자 산다.' } },
    ],
  },
};

// Record with every {en, ko} value resolved and condition codes named — used for export and API tools.
export function localizedRecord(pid, lang = getLang()) {
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      if ('en' in v && 'ko' in v && Object.keys(v).length === 2) return v[lang];
      return Object.fromEntries(Object.entries(v).filter(([k]) => !['nowMin', 'beforeMin'].includes(k)).map(([k, x]) => [k, walk(x)]));
    }
    return v;
  };
  const r = walk(RECORDS[pid]);
  r.conditions = RECORDS[pid].conditions.map((c) => ({ name: pick(CONDITIONS[c.code], lang), since: c.since }));
  r.labs = RECORDS[pid].labs.map((l) => ({ test: pick(LAB_INFO[l.key].name, lang), unit: LAB_INFO[l.key].unit, results: l.series }));
  r.vitals = { home_average_last_30_days: `${RECORDS[pid].vitals.sys}/${RECORDS[pid].vitals.dia} mmHg`, readings: RECORDS[pid].vitals.readings, clinic: RECORDS[pid].vitals.clinic };
  r.wearable.comparison = 'last 30 days (now) vs 3 months ago (before)';
  return r;
}

// Pre-written summaries used in demo mode for sections shared as "AI summary only".
export const DEMO_SUMMARIES = {
  mira: {
    conditions: { en: 'Long-standing type 2 diabetes, hypertension and raised cholesterol, plus knee osteoarthritis.', ko: '오래된 제2형 당뇨병, 고혈압, 고콜레스테롤이 있고 무릎 골관절염이 있습니다.' },
    medications: { en: 'Takes regular medication for blood sugar, blood pressure and cholesterol, and a pain reliever as needed.', ko: '혈당·혈압·콜레스테롤 약을 정기 복용하고, 필요할 때 진통제를 복용합니다.' },
    labs: { en: 'Blood sugar control improved over the past year but slipped slightly at the last test. Kidney function slightly lower than last year; cholesterol improved.', ko: '지난 1년간 혈당 조절이 개선되었으나 최근 검사에서 약간 나빠졌습니다. 신장 기능은 작년보다 조금 낮고, 콜레스테롤은 개선되었습니다.' },
    vitals: { en: 'Home blood pressure has been somewhat above the usual target over the last month.', ko: '최근 한 달간 가정 혈압이 일반적인 목표보다 다소 높았습니다.' },
    wearable: { en: 'Over the last month, activity and sleep have both decreased compared with three months ago, and resting heart rate is slightly higher.', ko: '최근 한 달 동안 3개월 전보다 활동량과 수면 시간이 모두 줄었고, 안정 시 심박수가 약간 높아졌습니다.' },
    visits: { en: 'Regular GP follow-up for diabetes and blood pressure; one orthopaedic visit for knee pain this year.', ko: '당뇨·혈압으로 주치의에게 정기 진료를 받고 있으며, 올해 무릎 통증으로 정형외과를 한 번 방문했습니다.' },
    journal: { en: 'Notes describe new responsibilities at home that are affecting time for exercise, regular meals and sleep. The patient may want to talk about this.', ko: '집안에서 새로 생긴 부담 때문에 운동·규칙적인 식사·수면에 영향이 있다고 적혀 있습니다. 환자가 이야기하고 싶어 할 수 있습니다.' },
  },
  daniel: {
    conditions: { en: 'A rare inherited metabolic condition with reduced kidney function, and high blood pressure.', ko: '신장 기능 저하를 동반한 희귀 유전성 대사 질환과 고혈압이 있습니다.' },
    medications: { en: 'Receives regular infusion therapy for the inherited condition and a daily blood pressure tablet that also protects the kidneys.', ko: '유전 질환에 대해 정기 주입 치료를 받고, 신장 보호 효과가 있는 혈압약을 매일 복용합니다.' },
    labs: { en: 'Kidney function has declined gradually over the past year and protein in the urine has increased.', ko: '지난 1년간 신장 기능이 서서히 감소했고 소변 단백이 늘었습니다.' },
    vitals: { en: 'Home blood pressure is slightly above the usual target.', ko: '가정 혈압이 일반적인 목표보다 약간 높습니다.' },
    wearable: { en: 'Activity and sleep are broadly stable.', ko: '활동량과 수면은 대체로 안정적입니다.' },
    visits: { en: 'Seen regularly by kidney and genetics specialists and by the GP.', ko: '신장내과, 유전학과, 주치의에게 정기적으로 진료를 받고 있습니다.' },
    journal: { en: 'Notes express worry about declining kidney function and a wish to learn about research studies he could join.', ko: '신장 기능 저하에 대한 걱정과, 참여할 수 있는 연구에 대해 알고 싶다는 바람이 적혀 있습니다.' },
  },
  priya: {
    conditions: { en: 'Long-standing asthma, currently severe, and allergies.', ko: '오래된 천식(현재 중증)과 알레르기가 있습니다.' },
    medications: { en: 'Uses a combination inhaler daily and as needed, plus a daily allergy and asthma tablet.', ko: '복합 흡입기를 매일 및 필요 시 사용하고, 알레르기·천식 알약을 매일 복용합니다.' },
    labs: { en: 'Lung function has fallen since last year and allergy-related blood cells are raised.', ko: '작년보다 폐 기능이 떨어졌고, 알레르기 관련 혈액 세포가 증가했습니다.' },
    vitals: { en: 'Home blood pressure is within the usual range.', ko: '가정 혈압은 일반적인 범위 안에 있습니다.' },
    wearable: { en: 'Sleep has shortened and resting heart rate has risen over the past three months.', ko: '최근 3개월 동안 수면 시간이 줄고 안정 시 심박수가 올랐습니다.' },
    visits: { en: 'An emergency visit abroad for an asthma flare this summer, with GP and lung specialist follow-up.', ko: '올여름 해외에서 천식 악화로 응급실을 방문했고, 주치의와 호흡기 전문의에게 추적 진료를 받았습니다.' },
    journal: { en: 'Notes mention more night-time symptoms and a stressful period at work.', ko: '야간 증상이 늘었고 직장에서 스트레스가 많은 시기라고 적혀 있습니다.' },
  },
  tom: {
    conditions: { en: 'Heart failure, an irregular heart rhythm, and high blood pressure.', ko: '심부전, 불규칙한 심장 리듬, 고혈압이 있습니다.' },
    medications: { en: 'Takes several heart medications, a blood thinner and a water tablet.', ko: '여러 심장약, 항응고제, 이뇨제를 복용합니다.' },
    labs: { en: 'A blood marker of heart strain has risen at each of the last three tests, and kidney function is slightly lower.', ko: '최근 세 번의 검사에서 심장 부담 지표가 계속 올랐고, 신장 기능이 약간 낮아졌습니다.' },
    vitals: { en: 'Home blood pressure is within the usual target.', ko: '가정 혈압은 일반적인 목표 범위 안에 있습니다.' },
    wearable: { en: 'Daily activity has fallen noticeably and resting heart rate has risen over the past three months.', ko: '최근 3개월 동안 하루 활동량이 눈에 띄게 줄고 안정 시 심박수가 올랐습니다.' },
    visits: { en: 'Regular heart specialist and GP follow-up.', ko: '심장 전문의와 주치의에게 정기 진료를 받고 있습니다.' },
    journal: { en: 'Notes mention breathlessness on stairs and living alone after a recent bereavement.', ko: '계단에서 숨이 차고, 최근 사별 후 혼자 지낸다고 적혀 있습니다.' },
  },
};

/* ---------- Fictional specialist directory ---------- */
export const SPECIALTIES = {
  endo: { en: 'Endocrinology (diabetes)', ko: '내분비내과(당뇨)' },
  ortho: { en: 'Orthopaedics (knee)', ko: '정형외과(무릎)' },
  pt: { en: 'Physical therapy', ko: '물리치료' },
  genetics: { en: 'Medical genetics (lysosomal disorders)', ko: '의학유전학(리소좀 질환)' },
  nephro: { en: 'Nephrology', ko: '신장내과' },
  pulm: { en: 'Pulmonology (severe asthma)', ko: '호흡기내과(중증 천식)' },
  allergy: { en: 'Allergy & immunology', ko: '알레르기내과' },
  cardio_hf: { en: 'Cardiology (heart failure)', ko: '순환기내과(심부전)' },
  cardio_ep: { en: 'Cardiology (heart rhythm)', ko: '순환기내과(부정맥)' },
};
export const CITY_COORDS = {
  'Minneapolis, MN': [44.9778, -93.265], 'Saint Paul, MN': [44.9537, -93.09], 'Bloomington, MN': [44.8408, -93.2983],
  'Edina, MN': [44.8897, -93.3499], 'Roseville, MN': [45.0061, -93.1566], 'Maple Grove, MN': [45.0725, -93.4558],
};
export function distanceKm(a, b) {
  const A = CITY_COORDS[a], B = CITY_COORDS[b];
  if (!A || !B) return null;
  const r = (d) => (d * Math.PI) / 180, R = 6371;
  const dLat = r(B[0] - A[0]), dLon = r(B[1] - A[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(A[0])) * Math.cos(r(B[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const SPECIALISTS = [
  { id: 's1', name: 'Dr. Aaron Lindqvist', sp: 'endo', clinic: 'Northside Diabetes Center', city: 'Maple Grove, MN', langs: ['EN'], wait: 14 },
  { id: 's2', name: 'Dr. Sun-hee Cho', sp: 'endo', clinic: 'Riverside Medical Group', city: 'Minneapolis, MN', langs: ['EN', 'KO'], wait: 21 },
  { id: 's3', name: 'Dr. Maria Ortega', sp: 'ortho', clinic: 'Lakes Orthopedic & Sports', city: 'Edina, MN', langs: ['EN', 'ES'], wait: 10 },
  { id: 's4', name: 'Jordan Ellis, DPT', sp: 'pt', clinic: 'Move Well Physical Therapy', city: 'Minneapolis, MN', langs: ['EN'], wait: 4 },
  { id: 's5', name: 'Dr. Kwame Mensah', sp: 'nephro', clinic: 'Capitol Kidney Care', city: 'Saint Paul, MN', langs: ['EN', 'FR'], wait: 18 },
  { id: 's6', name: 'Dr. Ingrid Solberg', sp: 'genetics', clinic: 'Riverside Medical Group', city: 'Minneapolis, MN', langs: ['EN', 'NO'], wait: 35 },
  { id: 's7', name: 'Dr. Rahul Menon', sp: 'pulm', clinic: 'Northstar Lung & Sleep', city: 'Roseville, MN', langs: ['EN', 'HI'], wait: 12 },
  { id: 's8', name: 'Dr. Emily Tran', sp: 'allergy', clinic: 'Uptown Allergy & Asthma', city: 'Minneapolis, MN', langs: ['EN', 'VI'], wait: 9 },
  { id: 's9', name: 'Dr. Patrick O’Neill', sp: 'cardio_hf', clinic: 'Southview Heart Institute', city: 'Bloomington, MN', langs: ['EN'], wait: 7 },
  { id: 's10', name: 'Dr. Leila Haddad', sp: 'cardio_ep', clinic: 'Capitol Heart Rhythm Clinic', city: 'Saint Paul, MN', langs: ['EN', 'AR'], wait: 16 },
  { id: 's11', name: 'Dr. Grace Yoon', sp: 'nephro', clinic: 'Southview Kidney Associates', city: 'Bloomington, MN', langs: ['EN', 'KO'], wait: 25 },
];

/* ---------- Fictional demo trials ----------
   Each criterion names the record section it needs; if that section is not
   visible to the viewer, the criterion is shown as "cannot check". */
const labVal = (rec, key) => { const l = rec.labs.find((x) => x.key === key); return l ? latest(l).value : undefined; };
export const DEMO_TRIALS = [
  { id: 'DEMO-T01', conditions: ['t2dm'], phase: '3', site: 'Riverside Medical Group', city: 'Minneapolis, MN',
    title: { en: 'Once-weekly oral glucose-lowering tablet vs usual care in type 2 diabetes', ko: '제2형 당뇨병에서 주 1회 경구 혈당강하제와 기존 치료 비교' },
    criteria: [
      { label: { en: 'Age 40–75', ko: '나이 40–75세' }, needs: null, test: (p) => p.age >= 40 && p.age <= 75 },
      { label: { en: 'Type 2 diabetes', ko: '제2형 당뇨병' }, needs: 'conditions', test: (p, r) => r.conditions.some((c) => c.code === 't2dm') },
      { label: { en: 'HbA1c 7.0–10.0%', ko: '당화혈색소 7.0–10.0%' }, needs: 'labs', test: (p, r) => { const v = labVal(r, 'hba1c'); return v !== undefined && v >= 7 && v <= 10; } },
      { label: { en: 'eGFR 30 or above', ko: 'eGFR 30 이상' }, needs: 'labs', test: (p, r) => { const v = labVal(r, 'egfr'); return v !== undefined && v >= 30; } },
    ] },
  { id: 'DEMO-T02', conditions: ['oa_knee'], phase: 'N/A', site: 'Move Well Physical Therapy', city: 'Minneapolis, MN',
    title: { en: 'Home-based strength programme with app coaching for knee osteoarthritis in adults 60+', ko: '60세 이상 무릎 골관절염 환자 대상 앱 코칭 가정 근력 운동 프로그램' },
    criteria: [
      { label: { en: 'Age 60 or older', ko: '60세 이상' }, needs: null, test: (p) => p.age >= 60 },
      { label: { en: 'Knee osteoarthritis', ko: '무릎 골관절염' }, needs: 'conditions', test: (p, r) => r.conditions.some((c) => c.code === 'oa_knee') },
      { label: { en: 'Able to walk without assistance', ko: '보조 없이 보행 가능' }, needs: 'wearable', test: (p, r) => r.wearable.steps.now >= 2000 },
    ] },
  { id: 'DEMO-T03', conditions: ['fabry'], phase: '2', site: 'Riverside Medical Group', city: 'Minneapolis, MN',
    title: { en: 'Adding an oral substrate-reduction medicine to enzyme replacement in adults with Fabry disease', ko: '파브리병 성인에서 효소 대체 요법에 경구 기질 감소 약물 추가' },
    criteria: [
      { label: { en: 'Age 18–65', ko: '나이 18–65세' }, needs: null, test: (p) => p.age >= 18 && p.age <= 65 },
      { label: { en: 'Fabry disease', ko: '파브리병' }, needs: 'conditions', test: (p, r) => r.conditions.some((c) => c.code === 'fabry') },
      { label: { en: 'Currently on enzyme replacement', ko: '현재 효소 대체 요법 중' }, needs: 'medications', test: (p, r) => r.medications.some((m) => /agalsidase/i.test(m.name)) },
      { label: { en: 'eGFR 45 or above', ko: 'eGFR 45 이상' }, needs: 'labs', test: (p, r) => { const v = labVal(r, 'egfr'); return v !== undefined && v >= 45; } },
    ] },
  { id: 'DEMO-T04', conditions: ['ckd', 'fabry'], phase: '3', site: 'Capitol Kidney Care', city: 'Saint Paul, MN',
    title: { en: 'Kidney-protective therapy in chronic kidney disease with raised urine protein', ko: '소변 단백이 증가한 만성 신장병에서 신장 보호 치료' },
    criteria: [
      { label: { en: 'Age 18 or older', ko: '18세 이상' }, needs: null, test: (p) => p.age >= 18 },
      { label: { en: 'Chronic kidney disease', ko: '만성 신장병' }, needs: 'conditions', test: (p, r) => r.conditions.some((c) => c.code === 'ckd') },
      { label: { en: 'eGFR 25–75', ko: 'eGFR 25–75' }, needs: 'labs', test: (p, r) => { const v = labVal(r, 'egfr'); return v !== undefined && v >= 25 && v <= 75; } },
      { label: { en: 'Urine albumin/creatinine 200 mg/g or above', ko: '요 알부민/크레아티닌 비 200 mg/g 이상' }, needs: 'labs', test: (p, r) => { const v = labVal(r, 'uacr'); return v !== undefined && v >= 200; } },
    ] },
  { id: 'DEMO-T05', conditions: ['asthma'], phase: '3', site: 'Northstar Lung & Sleep', city: 'Roseville, MN',
    title: { en: 'Twice-yearly biologic injection for severe eosinophilic asthma', ko: '중증 호산구성 천식에서 연 2회 생물학적 주사 치료' },
    criteria: [
      { label: { en: 'Age 18–70', ko: '나이 18–70세' }, needs: null, test: (p) => p.age >= 18 && p.age <= 70 },
      { label: { en: 'Severe asthma', ko: '중증 천식' }, needs: 'conditions', test: (p, r) => r.conditions.some((c) => c.code === 'asthma') },
      { label: { en: 'Blood eosinophils 300 cells/µL or above', ko: '혈중 호산구 300 cells/µL 이상' }, needs: 'labs', test: (p, r) => { const v = labVal(r, 'eos'); return v !== undefined && v >= 300; } },
      { label: { en: 'At least one flare needing oral steroids in the past year', ko: '지난 1년간 경구 스테로이드가 필요한 악화 1회 이상' }, needs: 'visits', test: (p, r) => r.visits.some((v) => /steroid/i.test(v.what.en)) },
    ] },
  { id: 'DEMO-T06', conditions: ['hf'], phase: 'N/A', site: 'Southview Heart Institute', city: 'Bloomington, MN',
    title: { en: 'Wearable-based remote monitoring to prevent heart failure hospital admissions', ko: '웨어러블 원격 모니터링을 통한 심부전 입원 예방' },
    criteria: [
      { label: { en: 'Age 50 or older', ko: '50세 이상' }, needs: null, test: (p) => p.age >= 50 },
      { label: { en: 'Heart failure', ko: '심부전' }, needs: 'conditions', test: (p, r) => r.conditions.some((c) => c.code === 'hf') },
      { label: { en: 'Uses a wearable device', ko: '웨어러블 기기 사용' }, needs: 'wearable', test: (p, r) => !!r.wearable },
      { label: { en: 'Raised NT-proBNP', ko: 'NT-proBNP 상승' }, needs: 'labs', test: (p, r) => { const v = labVal(r, 'ntprobnp'); return v !== undefined && v >= 400; } },
    ] },
];

// Evaluate a demo trial for a patient given which sections the viewer can see in full.
export function evaluateTrial(trial, patient, visible) {
  const rec = RECORDS[patient.id];
  const rows = trial.criteria.map((c) => {
    if (c.needs && !visible[c.needs]) return { c, result: null };
    return { c, result: !!c.test(patient, rec) };
  });
  const status = rows.some((r) => r.result === false) ? 'unlikely' : rows.some((r) => r.result === null) ? 'check' : 'possible';
  return { rows, status };
}
