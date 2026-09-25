/* Shared top bar for HDGF Agent pages. */
import { pick, esc, GP, signOut, clinicianName } from './hdgf-core.js';

const TXT = {
  proto: { en: 'Prototype', ko: '프로토타입' },
  patients: { en: '← Patients', ko: '← 환자 목록' },
  agent: { en: 'Agent', ko: '에이전트' },
  care: { en: 'Specialists & trials', ko: '전문의·임상시험' },
  settings: { en: 'Settings', ko: '설정' },
  demo: { en: 'Demo mode', ko: '데모 모드' },
  signOut: { en: 'Sign out', ko: '로그아웃' },
  patient: { en: 'Patient', ko: '환자' },
  sample: { en: 'sample record', ko: '샘플 기록' },
};
const GEAR = '<svg class="gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

// opts: { lang, engine, session, patient, careHref, agentHref, showPatients }
const initials = (n) => String(n || '').replace(/^Dr\.?\s+/i, '').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

export function topbar({ lang, engine, session, patient, careHref, agentHref, showPatients }) {
  const t = (k) => pick(TXT[k], lang);
  const isPhys = session && session.role === 'physician';
  const who = !session ? '' : isPhys
    ? `<span class="who"><span class="av">${esc(initials(clinicianName(session, lang)))}</span><span class="who-text">${esc(clinicianName(session, lang))}<small>${esc((session.account && (session.account.clinic || session.account.specialty)) || pick(GP.clinic, lang))}</small></span></span>`
    : `<span class="who"><span class="av">${esc(patient ? patient.initials : '')}</span><span class="who-text">${esc(session.account ? session.account.displayName : patient ? patient.name : '')}<small>${t('patient')}${session.account && patient ? ` · ${t('sample')}: ${esc(patient.name)}` : ''}</small></span></span>`;
  const live = engine && engine.kind === 'api';
  return `
    <a class="brand" href="agent.html"><strong>HDGF Agent</strong><span>${t('proto')}</span></a>
    ${isPhys && showPatients ? `<span class="crumb"><button type="button" data-act="patients">${t('patients')}</button>${patient ? `<strong>${esc(patient.name)}</strong>` : ''}</span>` : ''}
    <div class="top-right">
      ${agentHref ? `<a class="top-link" href="${agentHref}">${t('agent')}</a>` : ''}
      ${careHref ? `<a class="top-link" href="${careHref}">${t('care')}</a>` : ''}
      ${engine ? `<a class="top-link" href="settings.html#agent" title="${esc(live ? engine.model : t('demo'))}"><span class="engine-dot ${live ? 'live' : ''}"></span><span class="lbl">${live ? `Claude API · ${esc(engine.model.replace('claude-', ''))}` : t('demo')}</span></a>` : ''}
      <a class="top-link" href="settings.html" aria-label="${t('settings')}">${GEAR}<span class="lbl">${t('settings')}</span></a>
      ${who}
      ${session ? `<button type="button" class="top-link" data-act="signout">${t('signOut')}</button>` : ''}
    </div>`;
}

export function wireTopbar(root, { onPatients } = {}) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'signout') { signOut(); location.href = 'app.html'; }
    if (b.dataset.act === 'patients') { if (onPatients) onPatients(); else location.href = 'agent.html'; }
  });
}
