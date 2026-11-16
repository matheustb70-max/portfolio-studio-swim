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
    #swim-consent{position:fixed;inset:auto 20px 20px 20px;z-index:2147483000;box-sizing:border-box;max-width:620px;margin:0 auto 0 0;padding:12px 18px;background:var(--swim-consent-bg,#fcfaf5);color:var(--swim-consent-ink,#192b42);border:1px solid currentColor;border-radius:8px;font:13px/1.5 var(--swim-consent-font,system-ui,sans-serif);text-align:left;letter-spacing:normal}
    #swim-consent[hidden]{display:none}
    #swim-consent p{margin:0;color:inherit;font:inherit}
    #swim-consent a{color:inherit;text-decoration:underline;text-underline-offset:3px}
    #swim-consent .swim-consent-actions{display:flex;gap:20px;flex-wrap:wrap}
    #swim-consent button,#swim-privacy-settings{font:inherit;cursor:pointer;min-height:44px;padding:8px 0;border:0;border-radius:0;background:transparent;color:inherit;text-decoration:underline;text-underline-offset:4px}
    #swim-consent button:hover,#swim-privacy-settings:hover{ text-decoration-thickness:2px }
    #swim-consent button:focus-visible,#swim-consent summary:focus-visible,#swim-privacy-settings:focus-visible{outline:2px solid currentColor;outline-offset:3px}
    #swim-consent details{font:inherit}
    #swim-consent details[open]{flex-basis:100%}
    #swim-consent summary{display:list-item;width:fit-content;cursor:pointer;min-height:30px;padding-top:4px;text-decoration:underline;text-underline-offset:3px}
    #swim-consent details p{margin:8px 0 12px;max-width:65ch}
    #swim-privacy-settings{display:block;font-family:inherit;font-size:12px;line-height:1.5;margin:8px 0;text-align:left}
    .swim-privacy-footer{padding:0 24px}
    @media(max-width:680px){#swim-consent{inset:auto 12px 84px;padding:12px 16px;max-width:440px;max-height:60vh;overflow:auto}}
  `;
  document.head.appendChild(style);
  const panel = document.createElement('section');
  panel.id = 'swim-consent';
  panel.setAttribute('aria-label', 'Preferências de privacidade');
  panel.innerHTML = '<p>Podemos analisar sua navegação para melhorar este site?</p><div class="swim-consent-actions"><button type="button" data-choice="accepted">Permitir</button><button type="button" data-choice="rejected">Recusar</button><details><summary>Saiba mais</summary><p>Com sua permissão, o Microsoft Clarity usa cookies para analisar cliques, rolagem e reproduções de navegação. Não autorizamos uso para publicidade. Você pode mudar sua escolha em “Preferências de privacidade”, no rodapé. <a href="https://privacy.microsoft.com/pt-br/privacystatement" target="_blank" rel="noopener noreferrer">Privacidade da Microsoft</a>.</p></details></div>';
  const bodyStyle = getComputedStyle(document.body);
  const background = bodyStyle.backgroundColor;
  if (background && background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent') panel.style.setProperty('--swim-consent-bg', background);
  panel.style.setProperty('--swim-consent-ink', bodyStyle.color);
  panel.style.setProperty('--swim-consent-font', bodyStyle.fontFamily);
  panel.hidden = choice === 'accepted' || choice === 'rejected';
  document.body.appendChild(panel);
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.id = 'swim-privacy-settings';
  settings.textContent = 'Preferências de privacidade';
  settings.setAttribute('aria-controls', 'swim-consent');
  settings.addEventListener('click', () => { panel.hidden = false; panel.querySelector('button').focus(); });
  const footer = document.querySelector('footer') || document.body.appendChild(document.createElement('footer'));
  const privacyFooter = document.createElement('div');
  privacyFooter.className = 'swim-privacy-footer';
  privacyFooter.appendChild(settings);
  footer.appendChild(privacyFooter);
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
    settings.focus({ preventScroll: true });
  });
  if (choice === 'accepted') load();
})();
