
(()=>{
 const popup=document.getElementById('swim-return-dialog');
 const close=popup.querySelector('.swim-return-close');
 let shown=false,scheduled=false,lastFocus=null,previousOverflow='';
 function check(){
  scheduled=false;
  const root=document.documentElement;
  if(shown||window.scrollY<100||root.scrollHeight-window.innerHeight-window.scrollY>48||document.querySelector('dialog[open]'))return;
  shown=true;lastFocus=document.activeElement;
  previousOverflow=root.style.overflow;
  popup.showModal();root.style.overflow='hidden';close.focus({preventScroll:true});
  window.removeEventListener('scroll',onScroll);
 }
 function onScroll(){if(!scheduled){scheduled=true;requestAnimationFrame(check);}}
 close.addEventListener('click',()=>popup.close());
 popup.addEventListener('click',event=>{if(event.target===popup){const r=popup.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)popup.close();}});
 popup.addEventListener('close',()=>{document.documentElement.style.overflow=previousOverflow;if(lastFocus instanceof HTMLElement)lastFocus.focus({preventScroll:true});});
 window.addEventListener('scroll',onScroll,{passive:true});
})();
