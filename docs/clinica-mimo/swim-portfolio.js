(() => {
  'use strict';
  const popup = document.getElementById('swim-return-dialog');
  if (!popup) return;
  const close = popup.querySelector('.swim-return-close');
  const root = document.documentElement;
  let shown = false, scheduled = false, lastFocus = null, previousOverflow = '';
  function check() {
    scheduled = false;
    if (shown || scrollY < 100 || root.scrollHeight - innerHeight - scrollY > 48 || document.querySelector('dialog[open]')) return;
    shown = true;
    lastFocus = document.activeElement;
    previousOverflow = root.style.overflow;
    popup.showModal();
    root.style.overflow = 'hidden';
    close.focus({ preventScroll: true });
    removeEventListener('scroll', onScroll);
  }
  function onScroll() { if (!scheduled) { scheduled = true; requestAnimationFrame(check); } }
  close.addEventListener('click', () => popup.close());
  popup.addEventListener('click', event => {
    if (event.target !== popup) return;
    const rect = popup.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) popup.close();
  });
  popup.addEventListener('close', () => {
    root.style.overflow = previousOverflow;
    if (lastFocus instanceof HTMLElement) lastFocus.focus({ preventScroll: true });
  });
  addEventListener('scroll', onScroll, { passive: true });
})();
