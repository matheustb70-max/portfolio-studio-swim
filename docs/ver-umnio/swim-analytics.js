(() => {
  'use strict';
  if (window.swimAnalyticsInstalled) return;
  window.swimAnalyticsInstalled = true;
  let previousChoice = '';
  try {
    previousChoice = localStorage.getItem('swim-analytics-consent-v1') || '';
    localStorage.removeItem('swim-analytics-consent-v1');
    // Retain a previous explicit refusal, never a grant.
    if (previousChoice === 'rejected') localStorage.setItem('swim-analytics-opt-out', 'true');
  } catch {}
  // Remove legacy first-party cookies, including parent-domain cookies.
  const domains = ['', location.hostname, '.estudioswim.com.br'];
  const paths = new Set(['/']);
  let currentPath = '';
  for (const segment of location.pathname.split('/').filter(Boolean)) {
    currentPath += '/' + segment;
    paths.add(currentPath);
    paths.add(currentPath + '/');
  }
  for (const name of ['_clck', '_clsk']) {
    for (const domain of domains) for (const path of paths) {
      document.cookie = name + '=; Max-Age=0; Path=' + path + (domain ? '; Domain=' + domain : '') + '; SameSite=Lax; Secure';
    }
  }
  let optedOut = previousChoice === 'rejected';
  try { optedOut = optedOut || localStorage.getItem('swim-analytics-opt-out') === 'true'; } catch {}
  if (optedOut || navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };
  // Limited no-consent mode: deny BOTH storage types before tag initialization.
  window.clarity('consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.clarity.ms/tag/zerdf637k3';
  document.head.appendChild(script);
})();
