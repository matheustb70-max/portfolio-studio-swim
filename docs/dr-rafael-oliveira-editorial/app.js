(() => {
  'use strict';
  if (window.lucide) window.lucide.createIcons({attrs:{'aria-hidden':'true'}});
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const closeMenu = (restoreFocus = false) => {
    document.body.classList.remove('menu-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir menu');
    if (restoreFocus) menu.focus();
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    document.body.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (open) nav.querySelector('a').focus();
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', e => {
    if (!document.body.classList.contains('menu-open')) return;
    if (e.key === 'Escape') { closeMenu(true); return; }
    if (e.key === 'Tab') {
      const items = [...nav.querySelectorAll('a'), menu];
      const index = items.indexOf(document.activeElement);
      if (e.shiftKey && index === 0) { e.preventDefault(); menu.focus(); }
      if (!e.shiftKey && index === items.length - 1) { e.preventDefault(); items[0].focus(); }
    }
  });
  const desktopQuery = matchMedia('(min-width:901px)');
  desktopQuery.addEventListener('change', () => { if (desktopQuery.matches) closeMenu(); });
  const header = document.querySelector('.header');
  const updateHeader = () => {
    header.classList.toggle('scrolled', scrollY > 12);
    if (scrollY < 250) nav.querySelectorAll('.is-active').forEach(link => link.classList.remove('is-active'));
  };
  addEventListener('scroll', updateHeader, { passive:true });
  updateHeader();

  document.querySelectorAll('[data-accordion]').forEach(group => {
    const items = [...group.querySelectorAll('.accordion-item')];
    const setOpen = (item, open) => {
      const button = item.querySelector('button');
      const panel = item.querySelector('.accordion-panel');
      // Keep the current rendered height so rapid direction changes stay smooth.
      const height = panel.getBoundingClientRect().height;
      panel.style.height = `${height}px`;
      panel.style.visibility = 'visible';
      panel.getBoundingClientRect();
      item.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
      panel.inert = !open;
      panel.style.height = open ? `${panel.scrollHeight}px` : '0px';
      if (open) panel.style.visibility = 'visible';
      else {
        // Delay hiding until the height and opacity transitions finish.
        const hide = () => { if (!item.classList.contains('open')) panel.style.visibility = 'hidden'; };
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) hide();
        else panel.addEventListener('transitionend', event => { if (event.propertyName === 'height') hide(); }, { once:true });
      }
    };
    items.forEach((item, index) => {
      const button = item.querySelector('button');
      const panel = item.querySelector('.accordion-panel');
      panel.inert = true;
      button.addEventListener('click', () => {
        const open = !item.classList.contains('open');
        items.forEach(other => { if (other !== item && other.classList.contains('open')) setOpen(other, false); });
        setOpen(item, open);
      });
      button.addEventListener('keydown', e => {
        let target;
        if (e.key === 'ArrowDown') target = (index + 1) % items.length;
        if (e.key === 'ArrowUp') target = (index - 1 + items.length) % items.length;
        if (e.key === 'Home') target = 0;
        if (e.key === 'End') target = items.length - 1;
        if (target !== undefined) { e.preventDefault(); items[target].querySelector('button').focus(); }
      });
      new ResizeObserver(() => {
        if (item.classList.contains('open')) panel.style.height = `${panel.firstElementChild.scrollHeight}px`;
      }).observe(panel.firstElementChild);
    });
  });

  document.querySelectorAll('.carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    const slides = [...carousel.querySelectorAll('.slide')];
    const dots = [...carousel.querySelectorAll('.carousel-dots button')];
    const prev = carousel.querySelector('.carousel-prev');
    const next = carousel.querySelector('.carousel-next');
    let index = 0;
    const go = value => {
      index = Math.max(0, Math.min(slides.length - 1, value));
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((slide, i) => { slide.setAttribute('aria-hidden', String(i !== index)); slide.inert = i !== index; });
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
      prev.disabled = index === 0;
      next.disabled = index === slides.length - 1;
      carousel.querySelector('.carousel-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    };
    prev.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => go(i)));
    carousel.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      if (e.key === 'Home') { e.preventDefault(); go(0); }
      if (e.key === 'End') { e.preventDefault(); go(slides.length - 1); }
    });
    let touch;
    track.addEventListener('pointerdown', e => { touch = {x:e.clientX,y:e.clientY}; }, {passive:true});
    track.addEventListener('pointerup', e => {
      if (!touch) return;
      const dx=e.clientX-touch.x,dy=e.clientY-touch.y;
      if (Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)) go(index+(dx<0?1:-1));
      touch=null;
    }, {passive:true});
    // Touch events handle browsers that cancel pointer streams for native panning.
    track.addEventListener('touchstart', e => { touch={x:e.touches[0].clientX,y:e.touches[0].clientY}; }, {passive:true});
    track.addEventListener('touchend', e => {
      if (!touch) return;
      const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;
      if (Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)) go(index+(dx<0?1:-1));
      touch=null;
    }, {passive:true});
    go(0);
  });

  const sectionLinks = [...nav.querySelectorAll('a[href^="#"]')];
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting && scrollY >= 250) {
      sectionLinks.forEach(link => link.classList.toggle('is-active', link.hash === `#${entry.target.id}`));
    }
  }, {rootMargin:'-15% 0px -65% 0px',threshold:0});
  sectionLinks.forEach(link => { const section = document.querySelector(link.hash); if (section) observer.observe(section); });
  document.querySelector('#year').textContent = String(new Date().getFullYear());
})();
