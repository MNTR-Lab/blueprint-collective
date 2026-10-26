// Blueprint Social Studio V40 — Five-tab employee workspace. UI only.
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const tabs=[
 ['month','Monthly Calendar',['.bp-month']],
 ['week','Weekly Planner',['.bp-week']],
 ['day','Daily Publishing',['.bp-runsheet']],
 ['approvals','Approvals',['.bp-approval','.bp-ready']],
 ['reports','Reports',['.bp-coverage','.bp-brief','.bp-health','.bp-export']]
];
const retired=['.bp-clientvis'];
const extra=['.bp-flow','.bp-attention','.bp-finder','.bp-handoff'];
let active='month';
try{const x=localStorage.getItem('bp-social-v38-tab');if(tabs.some(t=>t[0]===x))active=x;}catch(_){}
const css=document.createElement('style');css.textContent=`
.bp-workspace-tabs{display:flex;gap:7px;flex-wrap:wrap;margin:14px 0 18px;padding:6px;background:#f3f7fc;border:1px solid #dbe6f3;border-radius:12px}
.bp-workspace-tabs button{border:0;background:transparent;border-radius:9px;padding:11px 15px;font-size:12px;font-weight:800;color:#56718f;cursor:pointer}
.bp-workspace-tabs button.active{background:white;color:#17477e;box-shadow:0 2px 9px #173b6019}
#desk .bp-v38-hidden{display:none!important}
.bp-v38-extra{margin:16px 0;padding:12px 14px;border:1px solid #dce6f2;background:white;border-radius:12px}
.bp-v38-extra summary{font-size:12px;font-weight:800;color:#365b82;cursor:pointer}
.bp-v38-extra[hidden]{display:none!important}
.bp-v38-help{font-size:12px;color:#607895;margin:0 0 14px}
@media(max-width:650px){.bp-workspace-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.bp-workspace-tabs button{padding:10px 6px}}
`;document.head.append(css);
const nav=document.createElement('nav');nav.className='bp-workspace-tabs';nav.setAttribute('aria-label','Publishing desk navigation');
const hint=document.createElement('p');hint.className='bp-v38-help';
const extras=document.createElement('details');extras.className='bp-v38-extra';extras.innerHTML='<summary>Additional publishing tools</summary>';
function draw(){
 const desk=$('desk');if(!desk)return;
 // Remove obsolete V36 toolbar and tabs.
 desk.querySelectorAll('.bp-organizer,.bp-workspace-tabs:not(.bp-v38-tabs)').forEach(el=>el.remove());
 if(!nav.isConnected){const anchor=desk.querySelector('.section-top');anchor?anchor.before(nav):desk.prepend(nav);nav.after(hint);}
 nav.classList.add('bp-v38-tabs');
 nav.replaceChildren();
 for(const [key,label] of tabs){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.tab=key;b.classList.toggle('active',active===key);if(active===key)b.setAttribute('aria-current','page');nav.append(b);}
 const captions={month:'Plan content across the month. Select a day to review scheduled posts.',week:'See the week at a glance and plan upcoming content.',day:'See what is scheduled today and open posts for editing.',approvals:'Review pending posts and control approval and client visibility.',reports:'Review scheduling coverage, weekly summaries and exports.'};
 hint.textContent=captions[active];
 for(const [key,,selectors] of tabs)for(const selector of selectors){
  const el=desk.querySelector(selector);if(!el)continue;
  el.classList.toggle('bp-v38-hidden',key!==active);
  // Remove legacy V20/V36 accordion toggles so the actual tool is immediately visible.
  el.querySelectorAll(':scope > .bp-fold-toggle').forEach(b=>b.remove());
  el.classList.remove('bp-folded','bp-tool-hidden');
 }
 if(!extras.isConnected)desk.append(extras);
 extras.hidden=active!=='reports';
 for(const selector of extra){
  const el=desk.querySelector(selector);if(!el)continue;
  if(el.parentElement!==extras)extras.append(el);
  el.classList.remove('bp-folded','bp-tool-hidden','bp-v38-hidden');
  el.querySelectorAll(':scope > .bp-fold-toggle').forEach(b=>b.remove());
 }
 for(const selector of retired){const el=desk.querySelector(selector);if(el)el.classList.add('bp-v38-hidden');}
 // Avoid repeating the separate workspace tools in other tabs.
}
nav.addEventListener('click',e=>{const key=e.target.closest('[data-tab]')?.dataset.tab;if(!tabs.some(t=>t[0]===key))return;active=key;try{localStorage.setItem('bp-social-v38-tab',key);}catch(_){}draw();});
function init(){
 const desk=$('desk');if(!desk)return;
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;draw();});}).observe(desk,{childList:true,subtree:false});
 draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
