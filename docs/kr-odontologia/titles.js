/* Revelação progressiva do título, vinculada à rolagem. Sem dependências. */
(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion:reduce)');
  const titles = [];
  const clamp = value => Math.min(1, Math.max(0, value));
  let scheduled = false;

  const update = () => {
    scheduled = false;
    for (const title of titles) {
      const rect = title.element.getBoundingClientRect();
      const progress = preference.matches ? 1 : clamp((innerHeight * .85 - rect.top) / (rect.height + innerHeight * .30));
      if (Math.abs(progress - title.last) < .002) continue;
      title.last = progress;
      const total = title.characters.length;
      title.characters.forEach((character, index) => {
        const phase = clamp((progress * (total + 8) - index) / 8);
        character.style.opacity = String(.14 + .86 * phase);
      });
    }
  };
  const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } };
  const initialize = () => {
    if (preference.matches) return;
    document.querySelectorAll('main h2').forEach(element => {
      const original = element.innerText.replace(/\s+/g,' ').trim();
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      const characters = [];
      nodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { fragment.append(document.createTextNode(part)); return; }
          const word = document.createElement('span');
          word.className = 'reveal-word';
          word.setAttribute('aria-hidden','true');
          Array.from(part).forEach(letter => {
            const character = document.createElement('span');
            character.className = 'reveal-char';
            character.textContent = letter;
            word.append(character);
            characters.push(character);
          });
          fragment.append(word);
        });
        node.replaceWith(fragment);
      });
      element.setAttribute('aria-label', original);
      titles.push({ element, characters, last:-1 });
    });
    update();
    addEventListener('scroll', schedule, {passive:true});
    addEventListener('resize', schedule, {passive:true});
    preference.addEventListener('change', update);
    // Gallery, accordion and image loading can change positions without scrolling.
    new ResizeObserver(schedule).observe(document.querySelector('main'));
  };
  if (document.fonts) document.fonts.ready.then(initialize); else initialize();
})();
