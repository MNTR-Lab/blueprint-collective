// Blueprint Social Studio V34 — compact accordion publishing workspace
// UI only: does not modify records, roles, approvals or publishing status.
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const groups=[
 ['.bp-month','Monthly calendar','Calendar',false],
 ['.bp-week','Weekly planner','Calendar',true],
 ['.bp-runsheet','Daily publishing run sheet','Daily work',false],
 ['.bp-handoff','Publishing handoff','Daily work',true],
 ['.bp-finder','Find & edit content','Content tools',true],
 ['.bp-flow','Publishing workflow','Content tools',true],
 ['.bp-approval','Approval queue','Approvals',true],
 ['.bp-clientvis','Client calendar visibility','Approvals',true],
 ['.bp-attention','Publishing attention','Approvals',true],
 ['.bp-readiness','Readiness checklist','Approvals',true],
 ['.bp-health','Schedule health','Reports',true],
 ['.bp-coverage','Content coverage','Reports',true],
 ['.bp-briefing','Weekly briefing','Reports',true],
 ['.bp-export','CSV export','Reports',true]
];
const css=document.createElement('style');css.textContent=`
.bp-organizer{background:linear-gradient(115deg,#102e53,#204b7b)!important;border:1px solid #274f7d!important;border-radius:17px!important;padding:18px 20px!important;color:white!important;box-shadow:0 12px 30px #102a4a17}
.bp-organizer-title{color:white!important;font-size:16px!important;font-weight:850!important}.bp-organizer-desc{color:#c6d9ee!important;font-size:12px!important}
.bp-organizer-actions button{background:#ffffff14!important;border:1px solid #ffffff45!important;color:white!important;border-radius:9px!important}
.bp-organizer-actions button:hover{background:#ffffff2c!important}
.bp-workspace-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 16px;padding:7px;border:1px solid #dce5f0;border-radius:14px;background:#f6f9fe}
.bp-workspace-tabs button{border:0;background:transparent;padding:10px 13px;border-radius:9px;color:#516987;font-weight:800;font-size:12px;cursor:pointer}
.bp-workspace-tabs button.active{background:#fff;color:#1b4d8c;box-shadow:0 2px 9px #132d4b14}
#desk .bp-fold-toggle{width:100%;border:0!important;border-radius:11px!important;background:#f1f6fc!important;color:#1d4169!important;padding:13px 15px!important;margin:0!important;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;cursor:pointer;font-weight:850;font-size:13px}
#desk .bp-fold-toggle:hover{background:#e6f0fd!important}
#desk .bp-fold-toggle span:last-child{font-size:11px;color:#56789e}
#desk .bp-folded > :not(.bp-fold-toggle){display:none!important}
#desk .bp-folded{padding:10px!important;min-height:0!important}
#desk .bp-tool-hidden{display:none!important}
#desk .bp-tool-section{margin:10px 0!important;box-shadow:0 4px 16px #13294b0a!important;border:1px solid #dce6f2!important;border-radius:14px!important}
#desk .bp-tool-section:not(.bp-folded)>.bp-fold-toggle{margin-bottom:13px!important}
@media(max-width:640px){.bp-workspace-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.bp-workspace-tabs button{padding:9px 5px}.bp-organizer{padding:14px!important}}
`;document.head.append(css);
const bar=document.createElement('div');bar.className='bp-organizer';
bar.innerHTML=`<div><div class="bp-organizer-title">Your publishing workspace</div><div class="bp-organizer-desc">Choose a workspace below, then open only the tools you need.</div></div><div class="bp-organizer-actions"><button type="button" data-mode="expand">Expand visible</button><button type="button" data-mode="collapse">Collapse visible</button><button type="button" data-mode="reset">Reset</button></div>`;
const tabs=document.createElement('nav');tabs.className='bp-workspace-tabs';tabs.setAttribute('aria-label','Publishing workspace sections');
const categories=['Calendar','Daily work','Content tools','Approvals','Reports'];
let category='Calendar';try{const saved=localStorage.getItem('bp-v34-category');if(categories.includes(saved))category=saved;}catch(_){}
tabs.innerHTML=categories.map(c=>`<button type="button" data-category="${c}" ${c===category?'class="active" aria-current="page"':''}>${c}</button>`).join('');
function foldKey(name){return 'bp-v34-fold-'+name;}
function setFold(section,name,fold){
 section.classList.toggle('bp-folded',fold);
 const btn=section.querySelector(':scope > .bp-fold-toggle');
 if(btn){btn.setAttribute('aria-expanded',String(!fold));btn.querySelector('.bp-fold-state').textContent=fold?'Open ▾':'Close ▴';}
 try{localStorage.setItem(foldKey(name),fold?'1':'0');}catch(_){}
}
function mount(){
 const desk=$('desk');if(!desk)return;
 if(!bar.isConnected){const anchor=desk.querySelector('.section-top');anchor?anchor.before(bar):desk.prepend(bar);}
 if(!tabs.isConnected)bar.after(tabs);
 for(const [selector,name,group,defaultFold] of groups){
  const section=desk.querySelector(selector);if(!section)continue;
  section.classList.add('bp-tool-section');
  // V20 inserted its own toggle for five original tools. Reuse it.
  let btn=section.querySelector(':scope > .bp-fold-toggle');
  if(!btn){
   btn=document.createElement('button');btn.type='button';btn.className='bp-fold-toggle';section.prepend(btn);
  }
  if(section.dataset.bpV34!=='1'){
   section.dataset.bpV34='1';
   // Replace the V20 button to avoid multiple toggle listeners.
   const clean=btn.cloneNode(false);btn.replaceWith(clean);btn=clean;
   btn.addEventListener('click',()=>setFold(section,name,!section.classList.contains('bp-folded')));
   let stored=null;try{stored=localStorage.getItem(foldKey(name));}catch(_){}
   setFold(section,name,stored===null?defaultFold:stored==='1');
  }
  btn.innerHTML=`<span>${name}</span><span class="bp-fold-state">${section.classList.contains('bp-folded')?'Open ▾':'Close ▴'}</span>`;
  section.classList.toggle('bp-tool-hidden',group!==category);
 }
 for(const btn of tabs.querySelectorAll('[data-category]')){
  const active=btn.dataset.category===category;btn.classList.toggle('active',active);
  if(active)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
 }
}
tabs.addEventListener('click',e=>{const c=e.target.closest('[data-category]')?.dataset.category;if(!categories.includes(c))return;category=c;try{localStorage.setItem('bp-v34-category',c);}catch(_){}mount();});
bar.addEventListener('click',e=>{
 const mode=e.target.closest('[data-mode]')?.dataset.mode;if(!mode)return;
 for(const [selector,name,group,defaultFold] of groups){
  const section=$('desk')?.querySelector(selector);if(!section||group!==category)continue;
  setFold(section,name,mode==='reset'?defaultFold:mode==='collapse');
 }
});
function init(){
 const desk=$('desk');if(!desk)return;
 let pending=false;new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;mount();});}).observe(desk,{childList:true,subtree:false});
 mount();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
