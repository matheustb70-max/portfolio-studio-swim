(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const config = window.KR_CONFIG || {};
  const phone = /^\d{12,13}$/.test(config.phone || '') ? config.phone : '554830522237';
  const whatsappReady = config.whatsappConfirmed === true && /^55\d{10,11}$/.test(config.whatsapp || '');
  // The reception number must be confirmed before WhatsApp is used as a real appointment channel.
  document.querySelectorAll('[data-contact]').forEach((link) => {
    if (whatsappReady) {
      const message = link.dataset.subject
        ? `Olá! Vim pelo site da KR Odontologia e gostaria de conversar sobre ${link.dataset.subject}.`
        : config.message;
      link.href = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      if (link.dataset.labelWhatsapp) link.querySelector('span').textContent = link.dataset.labelWhatsapp;
    } else {
      link.href = `tel:+${phone}`;
      link.setAttribute('aria-label', `${link.textContent.trim() || 'Falar com a equipe'} — ligar para (48) 3052-2237`);
    }
  });

  const menuButton = $('.menu-toggle');
  const menu = $('.navigation');
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if(window.KR_SCROLL) open ? window.KR_SCROLL.stop() : window.KR_SCROLL.start();
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); menuButton.focus(); }
    if (event.key === 'Tab' && menu.classList.contains('is-open')) {
      const links = [...menu.querySelectorAll('a')];
      if (!event.shiftKey && document.activeElement === menuButton) { event.preventDefault(); links[0].focus(); }
      if (event.shiftKey && document.activeElement === links[0]) { event.preventDefault(); menuButton.focus(); }
      if (!event.shiftKey && document.activeElement === links.at(-1)) { event.preventDefault(); menuButton.focus(); }
    }
  });
  document.addEventListener('click', (e) => { if (menu.classList.contains('is-open') && !e.target.closest('.header')) setMenu(false); });
  matchMedia('(min-width:1200px)').addEventListener('change', e => { if(e.matches) setMenu(false); });

  const reducedMotion = matchMedia('(prefers-reduced-motion:reduce)');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const revealElements = [...document.querySelectorAll('[data-reveal]')];
    document.querySelectorAll('[data-stagger]').forEach(group => {
      [...group.children].forEach((el,i) => el.style.setProperty('--reveal-delay', `${i * 75}ms`));
    });
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('is-pending'); revealObserver.unobserve(entry.target); }
    }), { threshold: .07, rootMargin: '0px 0px -30px 0px' });
    revealElements.forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight - 20) { el.classList.add('is-pending'); revealObserver.observe(el); }
    });
    document.documentElement.classList.add('motion-ready');
    // If motion preferences change while browsing, content remains visible.
    reducedMotion.addEventListener('change', e => {if(e.matches) revealElements.forEach(el => el.classList.remove('is-pending'));});
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('is-visible', e.isIntersecting)), {threshold:.15}).observe($('.steps'));
    const sections = [...document.querySelectorAll('main section[id]')];
    // Observe all navigable sections, without duplicating expensive scroll handlers.
    const navObserver = new IntersectionObserver(entries => entries.forEach(e => {
      if(e.isIntersecting) menu.querySelectorAll('a[href^="#"]').forEach(a => {
        const active = a.hash === `#${e.target.id}`;
        a.classList.toggle('active',active);
        if(active) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current');
      });
    }), {rootMargin:'-15% 0px -60% 0px'});
    sections.forEach(s => navObserver.observe(s));
  }
  let ticking = false;
  const progress = $('.reading-progress');
  const updateScroll = () => {
    const total = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${total > 0 ? Math.min(1,Math.max(0,scrollY/total)) : 0})`;
    ticking = false;
  };
  addEventListener('scroll', () => { if(!ticking){ticking=true;requestAnimationFrame(updateScroll);} }, {passive:true});
  updateScroll();

  const images = [
    {src:'assets/recepcao.webp',alt:'Recepção real da KR Odontologia em Tubarão',caption:'Recepção da clínica'},
    {src:'assets/consultorio.webp',alt:'Consultório real da KR Odontologia, com cadeira odontológica e equipamentos',caption:'Consultório de atendimento'}
  ];
  let imageIndex = 0;
  const changeClinicImage = direction => {
    imageIndex=(imageIndex+direction+images.length)%images.length;
    const selected=images[imageIndex];
    $('#clinic-image').src=selected.src;
    $('#clinic-image').alt=selected.alt;
    $('#clinic-caption').textContent=selected.caption;
    $('#clinic-count').textContent=`0${imageIndex+1} / 02`;
  };
  $('.gallery-prev').addEventListener('click',()=>changeClinicImage(-1));
  $('.gallery-next').addEventListener('click',()=>changeClinicImage(1));

  const privacy = $('.privacy-dialog');
  $('#privacy-open').addEventListener('click',()=>{privacy.showModal();window.KR_SCROLL?.stop();});
  privacy.addEventListener('close',()=>window.KR_SCROLL?.start());
  $('.dialog-close').addEventListener('click',()=>privacy.close());
  $('.privacy-ok').addEventListener('click',()=>privacy.close());
  privacy.addEventListener('click',e=>{if(e.target===privacy)privacy.close();});
  $('#year').textContent=new Date().getFullYear();
})();
