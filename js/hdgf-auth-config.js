/* =========================================================
   Social sign-in configuration.

   Leave a value empty to run that provider in demo mode (a simulated
   sign-in, clearly labelled). Fill it in to use the provider's real
   sign-in. Each ID comes from the site owner's developer account:

   google.clientId   Google Cloud Console → APIs & Services → Credentials →
                     OAuth client ID (type: Web application). Add this site's
                     origin to "Authorized JavaScript origins".
   apple.clientId    Apple Developer → Identifiers → Services ID with
                     "Sign in with Apple" enabled; register this domain and
                     the redirect URI below.
   apple.redirectURI The page URL registered for the Services ID
                     (for popup sign-in, this site's app.html URL).
   meta.appId        Meta for Developers → create an app with Facebook Login;
                     add this site's domain and URL in the app settings.
   meta.version      Graph API version string used by the JavaScript SDK
                     (check the current version in the Meta developer docs).
   ========================================================= */
export const AUTH_CONFIG = {
  google: { clientId: '' },
  apple: { clientId: '', redirectURI: '' },
  meta: { appId: '', version: 'v19.0' },
};
