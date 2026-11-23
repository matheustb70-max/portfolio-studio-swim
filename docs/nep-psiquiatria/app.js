(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.header');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const setMenu = (open, returnFocus = false) => {
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (returnFocus) menu.focus();
  };
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('click', e => {
    if (!header.contains(e.target) && menu.getAttribute('aria-expanded') === 'true') setMenu(false);
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  const setAccordion = (item, open) => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');
    if (!open && panel.contains(document.activeElement)) trigger.focus();
    trigger.setAttribute('aria-expanded', String(open));
    panel.inert = !open;
    item.classList.toggle('open', open);
  };
  document.querySelectorAll('.accordion[data-group]').forEach(group => {
    const items = [...group.querySelectorAll(':scope > .accordion-item')];
    items.forEach(item => {
      item.querySelector('.accordion-trigger').addEventListener('click', () => {
        const open = !item.classList.contains('open');
        items.forEach(other => { if (other !== item) setAccordion(other, false); });
        setAccordion(item, open);
      });
    });
  });

  const treatmentList = document.querySelector('.treatment-list');
  if (treatmentList) {
    const cards = [...treatmentList.querySelectorAll(':scope > .treatment-card')];
    cards.forEach((card, index) => card.style.setProperty('--stack-index', index));
    treatmentList.style.setProperty('--stack-count', cards.length);
    let stackFrame = 0;
    const updateTreatmentStack = () => {
      stackFrame = 0;
      const headerHeight = Math.ceil(header.getBoundingClientRect().height);
      const step = window.matchMedia('(max-width: 600px)').matches ? 8 : 10;
      const top = headerHeight + 18;
      const availableHeight = window.innerHeight - top - step * (cards.length - 1) - 24;
      const wasEnabled = treatmentList.classList.contains('is-stacking');
      const focusedCard = cards.find(card => card.contains(document.activeElement));
      const previousTop = focusedCard?.getBoundingClientRect().top;
      treatmentList.style.removeProperty('--stack-height');
      const heights = cards.map(card => card.getBoundingClientRect().height);
      const fits = heights.every(height => height <= availableHeight);
      const enabled = !reducedMotion.matches && cards.length > 1 && fits;
      treatmentList.style.setProperty('--stack-top', `${top}px`);
      treatmentList.style.setProperty('--stack-step', `${step}px`);
      treatmentList.style.setProperty('--stack-height', `${Math.max(...heights)}px`);
      treatmentList.style.setProperty('--stack-tail', `${Math.min(120, Math.max(72, innerHeight * .12))}px`);
      treatmentList.classList.toggle('is-stacking', enabled);
      // Keep an expanded card in view if it needs normal flow to fit its content.
      if (wasEnabled !== enabled && focusedCard && previousTop >= headerHeight && previousTop < innerHeight) {
        const difference = focusedCard.getBoundingClientRect().top - previousTop;
        if (Math.abs(difference) > 1) window.scrollBy({top:difference, behavior:'instant'});
      }
    };
    const scheduleTreatmentStack = () => {
      if (!stackFrame) stackFrame = requestAnimationFrame(updateTreatmentStack);
    };
    const stackResize = new ResizeObserver(scheduleTreatmentStack);
    cards.forEach(card => {
      stackResize.observe(card);
      stackResize.observe(card.querySelector('.accordion-panel'));
    });
    stackResize.observe(header);
    window.addEventListener('resize', scheduleTreatmentStack, {passive:true});
    reducedMotion.addEventListener('change', scheduleTreatmentStack);
    updateTreatmentStack();
  }

  document.querySelectorAll('.carousel').forEach(track => {
    const controls = document.querySelector(`[data-controls="${track.id}"]`);
    const dots = document.querySelector(`[data-dots="${track.id}"]`);
    const cards = [...track.children];
    if (!controls || !cards.length) return;
    const prev = controls.querySelector('[data-prev]');
    const next = controls.querySelector('[data-next]');
    const count = controls.querySelector('[data-count]');
    let index = 0;
    let pending = false;
    const cardStep = () => cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth;
    const update = () => {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      index = Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / cardStep())));
      prev.disabled = track.scrollLeft < 3;
      next.disabled = track.scrollLeft >= max - 3;
      const visible = Math.max(1, Math.round((track.clientWidth + 10) / cardStep()));
      const end = Math.min(index + visible, cards.length);
      count.textContent = `${String(index + 1).padStart(2, '0')}${visible > 1 ? '–' + String(end).padStart(2, '0') : ''} / ${String(cards.length).padStart(2, '0')}`;
      if (dots) {
        dots.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-current', String(i === index)));
        const captions = ['Recepção e acolhimento', 'Um espaço para você', 'Fachada da clínica'];
        document.querySelector('[data-gallery-caption]').textContent = captions[index];
      }
      pending = false;
    };
    const go = amount => track.scrollBy({left: cardStep() * amount, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    track.addEventListener('keydown', e => {
      if (e.target !== track) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {e.preventDefault(); go(e.key === 'ArrowRight' ? 1 : -1);}
      if (e.key === 'Home' || e.key === 'End') {e.preventDefault(); track.scrollTo({left:e.key === 'Home' ? 0 : track.scrollWidth,behavior:reducedMotion.matches ? 'instant' : 'smooth'});}
    });
    if (dots) dots.querySelectorAll('button').forEach((button, i) => button.addEventListener('click', () => track.scrollTo({left: i * cardStep(), behavior:reducedMotion.matches ? 'instant' : 'smooth'})));
    track.addEventListener('scroll', () => { if (!pending) {pending = true; requestAnimationFrame(update);} }, {passive:true});
    new ResizeObserver(update).observe(track);
    update();
  });

  if ('IntersectionObserver' in window) {
    root.classList.add('js');
    const reveal = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => { if (entry.isIntersecting) {entry.target.classList.add('is-visible'); observer.unobserve(entry.target);} });
    }, {threshold:.08, rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));
  }

  const visual = document.querySelector('.hero-visual');
  const progress = document.querySelector('.scroll-progress');
  let scrollPending = false;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 12);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (!reducedMotion.matches) {
      const ratio = Math.max(0, Math.min(1, y / 570));
      visual.style.transform = `rotateX(${(1 - ratio) * 9}deg) scale(${.965 + ratio * .035})`;
    } else visual.style.transform = '';
    scrollPending = false;
  };
  window.addEventListener('scroll', () => { if (!scrollPending) {scrollPending = true; requestAnimationFrame(onScroll);} }, {passive:true});
  reducedMotion.addEventListener('change', onScroll);
  onScroll();
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => {
          const active = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
        });
      });
    }, {rootMargin:'-15% 0px -60% 0px',threshold:0});
    links.forEach(link => {const section = document.querySelector(link.getAttribute('href')); if(section)sectionObserver.observe(section);});
  }
  document.querySelector('#year').textContent = String(new Date().getFullYear());
  if (window.lucide) window.lucide.createIcons({attrs:{'aria-hidden':'true','focusable':'false'}});
})();
