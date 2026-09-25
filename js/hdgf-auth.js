/* =========================================================
   Sign-in with Google, Apple and Meta.

   With IDs set in hdgf-auth-config.js, each provider's own JavaScript SDK
   runs its real sign-in and returns the user's identity. Without them, the
   provider runs in demo mode.

   Important: this site has no server. Identity tokens are decoded in the
   browser but NOT cryptographically verified, and accounts are kept in this
   browser's storage. That is acceptable for a prototype with fictional data
   only. A production service must verify tokens on a server and store
   accounts and health data there.
   ========================================================= */
import { AUTH_CONFIG } from './hdgf-auth-config.js';

export const PROVIDERS = ['google', 'apple', 'meta'];
export const PROVIDER_NAME = { google: 'Google', apple: 'Apple', meta: 'Meta (Facebook)' };
export const isConfigured = (p) => (p === 'google' ? !!AUTH_CONFIG.google.clientId : p === 'apple' ? !!(AUTH_CONFIG.apple.clientId && AUTH_CONFIG.apple.redirectURI) : !!AUTH_CONFIG.meta.appId);

const loaded = {};
function loadScript(src) {
  return (loaded[src] ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = res; s.onerror = () => rej(new Error(`Could not load ${src}`));
    document.head.appendChild(s);
  }));
}
function decodeJwt(jwt) {
  const part = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent([...atob(part)].map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
  return JSON.parse(json);
}

/* ---------- Google (Google Identity Services) ----------
   Google requires its own rendered button, so this renders into `el`
   and calls onIdentity when the user completes sign-in. */
export async function mountGoogleButton(el, onIdentity, { locale } = {}) {
  await loadScript('https://accounts.google.com/gsi/client');
  window.google.accounts.id.initialize({
    client_id: AUTH_CONFIG.google.clientId,
    callback: (resp) => {
      const c = decodeJwt(resp.credential);
      onIdentity({ provider: 'google', sub: c.sub, name: c.name || c.email, email: c.email || '', verified: false });
    },
  });
  window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width: Math.min(el.clientWidth || 360, 400), locale });
}

/* ---------- Apple (Sign in with Apple JS, popup) ---------- */
export async function signInWithApple() {
  await loadScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js');
  window.AppleID.auth.init({ clientId: AUTH_CONFIG.apple.clientId, scope: 'name email', redirectURI: AUTH_CONFIG.apple.redirectURI, usePopup: true });
  const data = await window.AppleID.auth.signIn();
  const c = decodeJwt(data.authorization.id_token);
  const n = data.user && data.user.name;  // Apple sends the name only on the first sign-in
  return { provider: 'apple', sub: c.sub, name: n ? `${n.firstName || ''} ${n.lastName || ''}`.trim() : '', email: c.email || '', verified: false };
}

/* ---------- Meta (Facebook Login for the web) ---------- */
export async function signInWithMeta() {
  await new Promise((res, rej) => {
    if (window.FB) return res();
    window.fbAsyncInit = () => { window.FB.init({ appId: AUTH_CONFIG.meta.appId, cookie: false, xfbml: false, version: AUTH_CONFIG.meta.version }); res(); };
    loadScript('https://connect.facebook.net/en_US/sdk.js').catch(rej);
  });
  const auth = await new Promise((res, rej) => window.FB.login((r) => (r.authResponse ? res(r.authResponse) : rej(new Error('cancelled'))), { scope: 'public_profile,email' }));
  const me = await new Promise((res) => window.FB.api('/me', { fields: 'id,name,email' }, res));
  return { provider: 'meta', sub: me.id || auth.userID, name: me.name || '', email: me.email || '', verified: false };
}
