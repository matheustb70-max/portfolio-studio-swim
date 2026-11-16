(() => {
  'use strict';
  if (window.swimAnalyticsInstalled) return;
  window.swimAnalyticsInstalled = true;
  const key = 'swim-analytics-consent-v1';
  let loaded = false;
  let choice = '';
  try { choice = localStorage.getItem(key) || ''; } catch {}
  function load() {
    if (loaded) return;
    loaded = true;
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    window.clarity('consentv2', { analytics_Storage: 'granted', ad_Storage: 'denied' });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.clarity.ms/tag/zerdf637k3';
    document.head.appendChild(script);
  }
  const style = document.createElement('style');
  style.textContent = `
    #swim-consent{position:fixed;inset:auto 16px 80px 16px;z-index:2147483000;max-width:580px;margin:0 auto 0 0;padding:20px;background:#fcfaf5;color:#192b42;border:1px solid #c9c4bb;border-radius:12px;font:15px/1.5 system-ui,sans-serif;text-align:left}
    #swim-consent[hidden]{display:none}
    #swim-consent p{margin:0 0 14px;color:#192b42;font:inherit}
    #swim-consent a{color:#192b42;text-decoration:underline}
    #swim-consent .swim-consent-actions{display:flex;gap:12px;flex-wrap:wrap}
    #swim-consent button,#swim-privacy-settings{font:14px/1.4 system-ui,sans-serif;cursor:pointer;min-height:44px;padding:10px 16px;border:1px solid #192b42;border-radius:6px;background:#fcfaf5;color:#192b42}
    #swim-consent button:hover,#swim-privacy-settings:hover{background:#e9e4da}
    #swim-consent button:focus-visible,#swim-privacy-settings:focus-visible{outline:3px solid #26547a;outline-offset:3px}
    #swim-privacy-settings{position:fixed;bottom:12px;left:12px;z-index:2147482999;font-size:12px;padding:7px 11px}
    @media(max-width:480px){#swim-consent{inset:auto 12px 88px;padding:16px;max-height:65vh;overflow:auto}}
  `;
  document.head.appendChild(style);
  const panel = document.createElement('section');
  panel.id = 'swim-consent';
  panel.setAttribute('aria-label', 'Preferências de privacidade');
  panel.innerHTML = '<p>Com sua permissão, usamos o Microsoft Clarity para analisar cliques, rolagem e reproduções de navegação e melhorar os sites da SWIM. Não usamos essa permissão para publicidade. <a href="https://privacy.microsoft.com/pt-br/privacystatement" target="_blank" rel="noopener noreferrer">Privacidade da Microsoft</a>.</p><div class="swim-consent-actions"><button type="button" data-choice="accepted">Permitir análise</button><button type="button" data-choice="rejected">Recusar análise</button></div>';
  panel.hidden = choice === 'accepted' || choice === 'rejected';
  document.body.appendChild(panel);
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.id = 'swim-privacy-settings';
  settings.textContent = 'Privacidade';
  settings.setAttribute('aria-controls', 'swim-consent');
  settings.addEventListener('click', () => { panel.hidden = false; panel.querySelector('button').focus(); });
  document.body.appendChild(settings);
  panel.addEventListener('click', event => {
    const button = event.target.closest('button[data-choice]');
    if (!button) return;
    choice = button.dataset.choice;
    try { localStorage.setItem(key, choice); } catch {}
    panel.hidden = true;
    if (choice === 'accepted') load();
    else if (loaded) {
      window.clarity('consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' });
      location.reload();
    }
    settings.focus();
  });
  if (choice === 'accepted') load();
})();
