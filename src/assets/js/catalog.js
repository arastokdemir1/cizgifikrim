(() => {
 'use strict';
 const root=document.querySelector('[data-work-catalog]');if(!root)return;
 const buttons=[...root.querySelectorAll('[data-work-filter]')],rows=[...root.querySelectorAll('[data-work-project]')],groups=[...root.querySelectorAll('[data-work-group]')],count=root.querySelector('[data-work-count]'),tr=root.dataset.lang==='tr';
 const update=stage=>{let total=0;rows.forEach(row=>{row.hidden=stage!=='all'&&row.dataset.stage!==stage;if(!row.hidden)total++;});groups.forEach(group=>{group.hidden=stage!=='all'&&group.dataset.workGroup!==stage;});buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.workFilter===stage)));count.textContent=total+(tr?' proje gösteriliyor':total===1?' project shown':' projects shown');};
 buttons.forEach(button=>button.addEventListener('click',()=>update(button.dataset.workFilter)));
 root.classList.add('is-ready');root.querySelector('.work-controls').hidden=false;update('all');
})();
