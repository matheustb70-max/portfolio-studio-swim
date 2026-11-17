/* Lenis local e versionado; movimento semelhante ao da referência de Cíntia. */
(() => {
  'use strict';
  if (!window.Lenis) return;
  const preference = matchMedia('(prefers-reduced-motion:reduce)');
  const sync = () => {
    window.KR_SCROLL?.destroy();
    window.KR_SCROLL = null;
    if (preference.matches) return;
    window.KR_SCROLL = new window.Lenis({
      duration: 1.2,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: true,
      anchors: { offset: -104 },
      prevent: node => Boolean(node.closest?.('dialog, [data-native-scroll]'))
    });
  };
  sync();
  preference.addEventListener('change', sync);
  // O publicador acrescenta o convite da SWIM; ele também pausa a rolagem da página.
  const syncDialogs = () => {
    if (!window.KR_SCROLL) return;
    if (document.querySelector('dialog[open]') || document.body.classList.contains('menu-open')) window.KR_SCROLL.stop();
    else window.KR_SCROLL.start();
  };
  const dialogs = new MutationObserver(syncDialogs);
  document.querySelectorAll('dialog').forEach(dialog => dialogs.observe(dialog, {attributes:true,attributeFilter:['open']}));
})();
