const slides=[...document.querySelectorAll('.slide')];
const overview=document.querySelector('#overview');
const imageDialog=document.querySelector('#image-dialog');
const progress=document.querySelector('#progress');
const pageList=document.querySelector('#page-list');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const projectVideo=document.querySelector('#project-video');
const videoToggle=document.querySelector('#video-toggle');
let current=0,transitioning=false,animationFrame=0;
document.querySelector('#total').textContent=slides.length;
slides.forEach((slide,i)=>{
  slide.querySelectorAll('.reveal').forEach((el,j)=>el.style.setProperty('--order',Math.min(j,5)));
  const button=document.createElement('button');
  button.setAttribute('aria-label',`Página ${i+1}: ${slide.dataset.title}`);
  button.title=slide.dataset.title;
  button.addEventListener('click',()=>goTo(i));
  progress.append(button);
  const entry=document.createElement('button');
  const number=document.createElement('span');number.textContent=String(i+1).padStart(2,'0');
  entry.append(number,document.createTextNode(slide.dataset.title));
  entry.addEventListener('click',()=>{overview.close();goTo(i);});
  pageList.append(entry);
});
function count(slide){
  cancelAnimationFrame(animationFrame);
  const elements=[...slide.querySelectorAll('[data-count]')];
  if(!elements.length)return;
  const start=performance.now();
  function frame(now){
    const t=reduced.matches?1:Math.min((now-start)/1200,1),ease=1-Math.pow(1-t,3);
    for(const el of elements){const n=Number(el.dataset.count)*ease;el.textContent=n.toLocaleString('pt-BR',{minimumFractionDigits:Number(el.dataset.decimals||0),maximumFractionDigits:Number(el.dataset.decimals||0)});}
    if(t<1)animationFrame=requestAnimationFrame(frame);
  }
  animationFrame=requestAnimationFrame(frame);
}
function sync(){
  const slide=slides[current];
  document.body.dataset.theme='light';
  document.querySelector('meta[name=theme-color]').content='#fdfcfe';
  document.querySelector('#current').textContent=String(current+1).padStart(2,'0');
  document.querySelectorAll('[data-prev]').forEach(b=>b.disabled=current===0);
  document.querySelectorAll('[data-next]').forEach(b=>b.disabled=current===slides.length-1);
  [...progress.children].forEach((b,i)=>{b.setAttribute('aria-current',i===current?'page':'false');b.classList.toggle('is-past',i<current);});
  [...pageList.children].forEach((b,i)=>b.setAttribute('aria-current',i===current?'page':'false'));
  document.title=`${String(current+1).padStart(2,'0')} · ${slide.dataset.title} · SWIM`;
  document.querySelector('#announcement').textContent=`Página ${current+1} de ${slides.length}. ${slide.dataset.title}.`;
  count(slide);
  if(slide.classList.contains('solution')){
    if(projectVideo.readyState===0)projectVideo.load();
    projectVideo.muted=true;
    if(!reduced.matches)projectVideo.play().catch(()=>updateVideoControl());
  }else projectVideo.pause();
}
function updateVideoControl(){
  const playing=!projectVideo.paused;
  videoToggle.setAttribute('aria-pressed',String(playing));
  videoToggle.querySelector('.video-label').textContent=playing?'Pausar prévia':'Reproduzir prévia';
  videoToggle.querySelector('.play-symbol').textContent=playing?'Ⅱ':'▶';
}
videoToggle.addEventListener('click',()=>{if(projectVideo.paused){projectVideo.muted=true;projectVideo.play().catch(()=>updateVideoControl());}else projectVideo.pause();});
projectVideo.addEventListener('play',updateVideoControl);
projectVideo.addEventListener('pause',updateVideoControl);
projectVideo.addEventListener('loadeddata',()=>{if(!slides[current].classList.contains('solution'))projectVideo.pause();});
function goTo(index,{instant=false,fromHash=false}={}){
  if(transitioning||index<0||index>=slides.length||index===current)return;
  const previous=slides[current],next=slides[index];
  document.body.classList.toggle('backward',index<current);
  const focusedInside=previous.contains(document.activeElement);
  previous.inert=true;previous.setAttribute('aria-hidden','true');
  previous.classList.remove('is-active');
  current=index;next.hidden=false;next.inert=false;next.removeAttribute('aria-hidden');
  next.classList.add('is-active','is-entering');
  if(focusedInside){const heading=next.querySelector('h1,h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}
  if(!instant&&!reduced.matches){transitioning=true;previous.classList.add('is-leaving');setTimeout(()=>{previous.hidden=true;previous.classList.remove('is-leaving');next.classList.remove('is-entering');transitioning=false;},650);}else{previous.hidden=true;next.classList.remove('is-entering');}
  if(!fromHash)history.pushState(null,'',`#${current+1}`);
  window.scrollTo({top:0,behavior:'instant'});sync();
}
function hashIndex(){const n=Number(location.hash.slice(1));return Number.isInteger(n)&&n>=1&&n<=slides.length?n-1:0;}
document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>goTo(current+1)));
document.querySelectorAll('[data-prev]').forEach(b=>b.addEventListener('click',()=>goTo(current-1)));
document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();goTo(0);});
document.querySelector('#overview-button').addEventListener('click',()=>overview.showModal());
document.querySelector('[data-swim-finish]').addEventListener('click',()=>{
  if(document.querySelector('#swim-return-dialog'))window.dispatchEvent(new Event('swim:presentation-finish'));
  else location.assign('https://estudioswim.com.br/');
});
document.querySelectorAll('dialog .close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
document.querySelectorAll('.zoomable').forEach(button=>button.addEventListener('click',()=>{
  const img=document.querySelector('#expanded-image');img.src=button.dataset.image;img.alt=button.querySelector('img').alt;
  document.querySelector('#expanded-caption').textContent=button.dataset.caption;
  imageDialog.showModal();
}));
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.querySelector('#announcement').textContent='Tela cheia não está disponível neste navegador.';}}
document.querySelector('#fullscreen').addEventListener('click',fullscreen);
document.addEventListener('fullscreenchange',()=>document.querySelector('#fullscreen').setAttribute('aria-label',document.fullscreenElement?'Sair da tela cheia':'Ativar tela cheia'));
document.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.target.matches('input,textarea,select'))return;
  if(document.querySelector('dialog[open]'))return;
  if(['ArrowRight','ArrowDown','PageDown'].includes(e.key)||(e.key===' '&&!e.target.closest('button,a'))){e.preventDefault();goTo(current+1);}
  else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();goTo(current-1);}
  else if(e.key==='Home'){e.preventDefault();goTo(0);}
  else if(e.key==='End'){e.preventDefault();goTo(slides.length-1);}
  else if(e.key.toLowerCase()==='o'){e.preventDefault();overview.showModal();}
  else if(e.key.toLowerCase()==='f'){e.preventDefault();fullscreen();}
});
let wheelTotal=0,wheelTimer;
document.addEventListener('wheel',e=>{
  if(innerWidth<1200||document.querySelector('dialog[open]')||e.ctrlKey||document.documentElement.scrollHeight>innerHeight+2)return;
  e.preventDefault();if(transitioning)return;
  wheelTotal+=e.deltaY;clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>wheelTotal=0,150);
  if(Math.abs(wheelTotal)>80){goTo(current+(wheelTotal>0?1:-1));wheelTotal=0;}
},{passive:false});
let touchStart;
document.querySelector('#deck').addEventListener('touchstart',e=>{touchStart={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};},{passive:true});
document.querySelector('#deck').addEventListener('touchend',e=>{if(!touchStart||overview.open||imageDialog.open)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.7)goTo(current+(dx<0?1:-1));touchStart=null;},{passive:true});
window.addEventListener('hashchange',()=>{const target=hashIndex();if(transitioning)setTimeout(()=>goTo(hashIndex(),{fromHash:true}),660);else goTo(target,{fromHash:true});});
slides.forEach((s,i)=>{s.inert=i!==0;if(i!==0)s.setAttribute('aria-hidden','true');});
const initial=hashIndex();if(initial)goTo(initial,{instant:true,fromHash:true});else sync();
