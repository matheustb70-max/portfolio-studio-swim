const menuButton=document.querySelector('.menu-toggle');
const menu=document.querySelector('#menu');
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menu.classList.toggle('open',open)});
menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menuButton.setAttribute('aria-expanded','false');menu.classList.remove('open')}));
document.addEventListener('keydown',event=>{if(event.key==='Escape'){menuButton.setAttribute('aria-expanded','false');menu.classList.remove('open')}});
const service=document.querySelector('#service');
const whatsapp=document.querySelector('#whatsapp');
function updateWhatsApp(){const message=`Olá! Gostaria de informações sobre ${service.value.toLowerCase()} na Mimo e de consultar os horários disponíveis.`;whatsapp.href=`https://wa.me/5548991942324?text=${encodeURIComponent(message)}`;}
service.addEventListener('change',updateWhatsApp);
document.querySelectorAll('[data-service]').forEach(link=>link.addEventListener('click',()=>{const mapping={'Pediatria':'Consulta pediátrica','Desenvolvimento e bem-estar':'Desenvolvimento e bem-estar','Odontopediatria':'Odontopediatria'};service.value=mapping[link.dataset.service]||'Especialidade infantil';updateWhatsApp()}));
document.querySelectorAll('a[href="#especialidades"]').forEach(link=>link.addEventListener('click',()=>{document.querySelector('#especialidades').open=true}));
document.querySelector('#year').textContent=new Date().getFullYear();
updateWhatsApp();
const heroTitle=document.querySelector('h1');
heroTitle.innerHTML='Cuidar da infância.<br><strong>Acolher a <em>família.</em></strong>';
const sectionTitles=document.querySelectorAll('h2');
sectionTitles.forEach(title=>{const parts=title.innerHTML.split('<br>');if(parts.length===2&&!parts[1].includes('<em>'))title.innerHTML=parts[0]+'<br><strong>'+parts[1]+'</strong>'});
if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}})},{threshold:.08});
document.querySelectorAll('.section-head,.service,.space-copy,.space-image,.team article,.faq-grid>div,.contact-panel').forEach((element,i)=>{element.classList.add('reveal-ready');element.style.setProperty('--reveal-delay',element.matches('.service,.team article')?`${i%4*65}ms`:'0ms');observer.observe(element)});
}
