// Blueprint Social Studio V20 — Publishing Desk Organizer
// Presentation-only controls. No data writes or permission changes.
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const panels=[
 ['.bp-flow','Publishing workflow',false],
 ['.bp-approval','Approval queue',true],
 ['.bp-clientvis','Client calendar visibility',true],
 ['.bp-attention','Publishing attention',false],
 ['.bp-export','Publishing reports',true]
];
const css=document.createElement('style');
css.textContent=`
.bp-organizer{margin:14px 0;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:13px 15px;background:#edf4ff;border:1px solid #d4e4fa;border-radius:13px}
.bp-organizer-title{font-weight:850;font-size:13px;color:#193b64}.bp-organizer-desc{font-size:11px;color:#5f7692;margin-top:3px}
.bp-organizer-actions{display:flex;gap:7px;flex-wrap:wrap}
.bp-organizer button,.bp-fold-toggle{background:white;border:1px solid #c5d7ef;border-radius:9px;padding:8px 11px;color:#22579b;font-size:12px;font-weight:800;cursor:pointer}
.bp-organizer button:hover,.bp-fold-toggle:hover{border-color:#4c83d8}
.bp-fold-toggle{width:100%;display:flex;justify-content:space-between;align-items:center;text-align:left;margin-bottom:10px;padding:11px 13px}
.bp-fold-toggle span:last-child{font-size:11px;color:#56718f}
.bp-folded > :not(.bp-fold-toggle){display:none!important}
.bp-folded{padding:12px!important;min-height:0!important}
`;
document.head.append(css);
const bar=document.createElement('div');bar.className='bp-organizer';
bar.innerHTML=`<div><div class="bp-organizer-title">Publishing desk workspace</div><div class="bp-organizer-desc">Expand only the tools you need. Your layout is remembered on this device.</div></div><div class="bp-organizer-actions"><button type="button" data-mode="expand">Expand all</button><button type="button" data-mode="collapse">Collapse all</button><button type="button" data-mode="reset">Reset layout</button></div>`;
function key(name){return 'bp-social-v20-fold-'+name;}
function setFold(section,name,fold){
 section.classList.toggle('bp-folded',fold);
 const toggle=section.querySelector(':scope > .bp-fold-toggle');
 if(toggle){toggle.setAttribute('aria-expanded',String(!fold));toggle.querySelector('span:last-child').textContent=fold?'Show ▾':'Hide ▴';}
 try{localStorage.setItem(key(name),fold?'1':'0');}catch(_){}
}
function mount(){
 const desk=$('desk');if(!desk)return;
 if(!bar.isConnected){const anchor=desk.querySelector('.section-top');anchor?anchor.before(bar):desk.prepend(bar);}
 for(const [selector,name,defaultFold] of panels){
  const section=desk.querySelector(selector);
  if(!section||section.dataset.bpOrganized==='1')continue;
  section.dataset.bpOrganized='1';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='bp-fold-toggle';
  const label=document.createElement('span');label.textContent=name;
  const state=document.createElement('span');toggle.append(label,state);
  section.prepend(toggle);
  let saved=null;try{saved=localStorage.getItem(key(name));}catch(_){}
  setFold(section,name,saved===null?defaultFold:saved==='1');
  toggle.addEventListener('click',()=>setFold(section,name,!section.classList.contains('bp-folded')));
 }
}
bar.addEventListener('click',event=>{
 const mode=event.target.closest('[data-mode]')?.dataset.mode;if(!mode)return;
 for(const [selector,name,defaultFold] of panels){
  const section=$('desk')?.querySelector(selector);if(!section)continue;
  setFold(section,name,mode==='reset'?defaultFold:mode==='collapse');
 }
});
function init(){
 const desk=$('desk');if(!desk)return;
 let pending=false;
 new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;mount();});}).observe(desk,{childList:true,subtree:false});
 mount();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
