const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const menu=document.querySelector('#navigation');const menuToggle=document.querySelector('.menu-toggle');
function closeMenu(){menu.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Abrir navegação');}
menuToggle.addEventListener('click',()=>{const open=menu.classList.toggle('open');menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Fechar navegação':'Abrir navegação');});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
const progress=document.querySelector('#reading-progress');let pending=false;
function updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?Math.min(scrollY/max,1):0})`;pending=false;}
addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(updateProgress);}},{passive:true});addEventListener('resize',updateProgress);updateProgress();
const navObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){menu.querySelectorAll('a').forEach(a=>{const active=a.hash==='#'+entry.target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}},{rootMargin:'-15% 0px -70% 0px'});
document.querySelectorAll('#diagnostico,#prioridades,#nova-possibilidade').forEach(s=>navObserver.observe(s));
function count(el){if(el.dataset.counted)return;el.dataset.counted='true';const end=Number(el.dataset.count);if(reduced.matches)return;const start=performance.now();function frame(now){const t=Math.min((now-start)/1100,1);el.textContent=Math.round(end*(1-Math.pow(1-t,3))).toLocaleString('pt-BR');if(t<1)requestAnimationFrame(frame);}requestAnimationFrame(frame);}
if(!reduced.matches){document.documentElement.classList.add('motion-ready');const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');entry.target.querySelectorAll('[data-count]').forEach(count);observer.unobserve(entry.target);}},{threshold:0,rootMargin:'0px 0px -45px 0px'});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));}
const dialog=document.querySelector('#image-dialog');const expanded=document.querySelector('#expanded-image');
document.querySelectorAll('.zoomable').forEach(button=>button.addEventListener('click',()=>{expanded.src=button.dataset.image;expanded.alt=button.querySelector('img').alt;document.querySelector('#expanded-caption').textContent=button.closest('figure').querySelector('figcaption').textContent;dialog.showModal();}));
dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
const video=document.querySelector('#project-video');const videoToggle=document.querySelector('#video-toggle');let visible=false,userPaused=false;
function videoControl(){const playing=!video.paused;videoToggle.setAttribute('aria-pressed',String(playing));videoToggle.querySelector('.video-label').textContent=playing?'Pausar prévia':'Reproduzir prévia';videoToggle.querySelector('.play-symbol').textContent=playing?'Ⅱ':'▶';}
video.addEventListener('play',videoControl);video.addEventListener('pause',videoControl);
function playVideo(){if(video.readyState===0)video.load();video.muted=true;video.play().catch(videoControl);}
videoToggle.addEventListener('click',()=>{userPaused=!video.paused;if(video.paused)playVideo();else video.pause();});
const videoObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!reduced.matches&&!userPaused&&!document.hidden)playVideo();else if(!visible)video.pause();},{threshold:.25});videoObserver.observe(video);
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(visible&&!userPaused&&!reduced.matches)playVideo();});
video.addEventListener('loadeddata',()=>{if(!visible)video.pause();});
reduced.addEventListener('change',()=>{if(reduced.matches){document.documentElement.classList.remove('motion-ready');video.pause();}});
