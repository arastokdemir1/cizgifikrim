(() => {
 'use strict';
 const $ = (s, root=document) => root.querySelector(s);
 const $$ = (s, root=document) => [...root.querySelectorAll(s)];
 const menu=$('#mobile-menu'), toggle=$('[data-menu-open]');
 if(menu&&toggle){
  const close=()=>menu.close();
  toggle.addEventListener('click',()=>{menu.showModal();toggle.setAttribute('aria-expanded','true');document.body.classList.add('menu-is-open');});
  $('[data-menu-close]',menu).addEventListener('click',close);
  menu.addEventListener('close',()=>{toggle.setAttribute('aria-expanded','false');document.body.classList.remove('menu-is-open');toggle.focus();});
  matchMedia('(min-width:901px)').addEventListener('change',e=>{if(e.matches&&menu.open)close();});
 }
 const groups=$$('.desktop-nav details');
 const hoverMenu=matchMedia('(min-width:901px) and (hover:hover) and (pointer:fine)');
 const closeTimers=new Map();
 const cancelClose=group=>{clearTimeout(closeTimers.get(group));closeTimers.delete(group);};
 groups.forEach(group=>{
  group.addEventListener('toggle',()=>{if(group.open)groups.filter(g=>g!==group).forEach(g=>{cancelClose(g);g.open=false;});});
  group.addEventListener('pointerenter',e=>{
   if(!hoverMenu.matches||e.pointerType==='touch')return;
   cancelClose(group);
   groups.filter(g=>g!==group).forEach(g=>{cancelClose(g);g.open=false;});
   group.open=true;
  });
  group.addEventListener('pointerleave',e=>{
   if(!hoverMenu.matches||e.pointerType==='touch')return;
   cancelClose(group);
   closeTimers.set(group,setTimeout(()=>{group.open=false;closeTimers.delete(group);},220));
  });
  group.addEventListener('focusin',()=>cancelClose(group));
 });
 hoverMenu.addEventListener('change',()=>groups.forEach(g=>{cancelClose(g);g.open=false;}));
 document.addEventListener('click',e=>groups.forEach(g=>{if(!g.contains(e.target))g.open=false;}));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){const g=groups.find(g=>g.open);if(g){g.open=false;$('summary',g).focus();}}});
 document.addEventListener('focusin',e=>{if(!e.target.closest('.desktop-nav'))groups.forEach(g=>g.open=false);});
 $$('[data-compare]').forEach(el=>{$('input',el).addEventListener('input',e=>el.style.setProperty('--position',e.target.value+'%'));});
 $$('[data-product-switcher]').forEach(root=>{
  const tabs=$$('[data-product-tab]',root), panels=$$('[data-product-panel]',root), nav=$('.product-switcher-nav',root);
  if(!nav||!tabs.length||tabs.length!==panels.length)return;
  const vertical=matchMedia('(min-width:901px)');
  const setOrientation=()=>nav.setAttribute('aria-orientation',vertical.matches?'vertical':'horizontal');
  const activate=(index,focus=false)=>{
   tabs.forEach((tab,i)=>{const active=i===index;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;panels[i].hidden=!active;if(!active)$$('video',panels[i]).forEach(video=>video.pause());});
   if(focus)tabs[index].focus({preventScroll:true});
  };
  nav.setAttribute('role','tablist');setOrientation();vertical.addEventListener('change',setOrientation);
  tabs.forEach((tab,i)=>{
   tab.setAttribute('role','tab');tab.setAttribute('aria-controls',panels[i].id);
   panels[i].setAttribute('role','tabpanel');panels[i].tabIndex=0;
   tab.addEventListener('click',e=>{e.preventDefault();activate(i);});
   tab.addEventListener('keydown',e=>{
    let next;
    if(e.key==='ArrowRight'||(vertical.matches&&e.key==='ArrowDown'))next=(i+1)%tabs.length;
    else if(e.key==='ArrowLeft'||(vertical.matches&&e.key==='ArrowUp'))next=(i-1+tabs.length)%tabs.length;
    else if(e.key==='Home')next=0;
    else if(e.key==='End')next=tabs.length-1;
    else if(e.key===' ')next=i;
    else return;
    e.preventDefault();activate(next,true);
   });
  });
  root.classList.add('has-product-tabs');
  const initial=panels.findIndex(panel=>'#'+panel.id===location.hash);
  activate(initial<0?0:initial);
 });
 $$('[data-language]').forEach(a=>{
  const target=new URL(a.href); target.search=location.search; target.hash=location.hash; a.href=target.href;
  a.addEventListener('click',()=>{try{localStorage.setItem('cf_language',a.dataset.language);}catch{}});
 });
 if($('[data-preview-copy]')&&new URLSearchParams(location.search).get('preview')==='1'){
  const source=$('[data-preview-copy]');$('[data-thanks-title]').textContent=source.dataset.title;$('[data-thanks-copy]').textContent=source.textContent;
 }
})();
