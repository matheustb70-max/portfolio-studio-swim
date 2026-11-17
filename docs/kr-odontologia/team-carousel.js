/* Uma pessoa por clique, com continuidade visual nos dois sentidos. */
(() => {
  'use strict';
  const track = document.querySelector('.team-track');
  if (!track) return;
  const previous = document.querySelector('.team-prev');
  const next = document.querySelector('.team-next');
  const items = [...track.querySelectorAll('.team-card')];
  const count = items.length;
  if (!count) return;
  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  const modulo = value => ((value % count) + count) % count;
  let stride = 0;
  let frame = 0;
  let settling = 0;
  let moving = false;
  let interacting = false;
  const queue = [];

  // Os cartões de apoio permitem cruzar as pontas sem exibir um espaço vazio.
  // Somente os cartões originais são expostos à tecnologia assistiva.
  const copies = () => {
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      const copy = item.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.setAttribute('inert', '');
      fragment.append(copy);
    });
    return fragment;
  };
  track.prepend(copies());
  track.append(copies());

  const visibleCount = () => Math.min(count, Math.max(1,
    Math.floor((track.clientWidth + parseFloat(getComputedStyle(track).gap) + 2) / stride)
  ));
  const firstIndex = () => modulo(Math.round(track.scrollLeft / stride) - count);
  const updateControls = () => {
    if (!stride) return;
    previous.disabled = next.disabled = count <= visibleCount();
  };
  const recenter = () => {
    if (!stride || moving || interacting) return;
    const period = count * stride;
    const lap = Math.floor((track.scrollLeft + .5) / period);
    if (lap !== 1) {
      track.classList.add('is-moving');
      track.scrollTo({left:track.scrollLeft + (1 - lap) * period, behavior:'instant'});
      track.classList.remove('is-moving');
    }
    updateControls();
  };
  const runNext = () => {
    if (moving || !queue.length || !stride) return;
    recenter();
    const direction = queue.shift();
    const start = track.scrollLeft;
    const destination = (Math.round(start / stride) + direction) * stride;
    moving = true;
    track.classList.add('is-moving');
    const finish = () => {
      track.scrollLeft = destination;
      moving = false;
      recenter();
      track.classList.remove('is-moving');
      updateControls();
      runNext();
    };
    if (motion.matches) { finish(); return; }
    const started = performance.now();
    const animate = now => {
      const progress = Math.min(1, (now - started) / 360);
      const eased = 1 - Math.pow(1 - progress, 3);
      track.scrollLeft = start + (destination - start) * eased;
      if (progress < 1) frame = requestAnimationFrame(animate);
      else finish();
    };
    frame = requestAnimationFrame(animate);
  };
  const move = direction => { queue.push(direction); runNext(); };
  const interrupt = () => {
    cancelAnimationFrame(frame);
    queue.length = 0;
    moving = false;
    track.classList.remove('is-moving');
  };
  const measure = () => {
    const first = stride ? firstIndex() : 0;
    const measured = items[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
    if (!measured || Math.abs(measured - stride) < .01) { updateControls(); return; }
    interrupt();
    stride = measured;
    track.classList.add('is-moving');
    track.scrollTo({left:(count + first) * stride, behavior:'instant'});
    track.classList.remove('is-moving');
    updateControls();
  };
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  track.addEventListener('pointerdown', () => { interrupt(); interacting = true; }, {passive:true});
  addEventListener('pointerup', () => { if (interacting) { interacting = false; recenter(); } }, {passive:true});
  track.addEventListener('pointercancel', () => { interacting = false; recenter(); }, {passive:true});
  track.addEventListener('wheel', interrupt, {passive:true});
  track.addEventListener('scroll', () => {
    updateControls();
    clearTimeout(settling);
    if (!moving) settling = setTimeout(recenter, 160);
  }, {passive:true});
  new ResizeObserver(measure).observe(track);
  measure();
})();
