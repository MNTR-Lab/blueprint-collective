// Blueprint Social Studio V14 — staff workflow dashboard (read-only UI enhancement).
// No new permissions, API mutations, or status changes. Loaded after editor scripts.
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const css=document.createElement('style');css.textContent=`
.bp-flow{margin:16px 0 20px;padding:18px;border:1px solid #dce6f3;border-radius:17px;background:linear-gradient(125deg,#fff,#f4f8ff);box-shadow:0 7px 24px #162c4809}
.bp-flow-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}.bp-flow-head strong{font-size:15px;color:#173458}.bp-flow-head small{display:block;color:#667b97;margin-top:4px}.bp-flow-refresh{border:1px solid #c9d8ed;border-radius:9px;background:white;padding:9px 12px;cursor:pointer;font-weight:700;color:#22549a}
.bp-flow-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.bp-flow-tile{border:1px solid #dce6f3;border-radius:13px;padding:14px 12px;text-align:left;background:#fff;cursor:pointer;transition:.15s;min-width:0}.bp-flow-tile:hover,.bp-flow-tile:focus-visible{border-color:#4c83d8;transform:translateY(-1px)}.bp-flow-tile.active{border-color:#2f6fcb;box-shadow:0 0 0 2px #2f6fcb20}.bp-flow-num{display:block;font-size:26px;font-weight:850;line-height:1.15;color:#16385f}.bp-flow-label{display:block;font-size:12px;font-weight:750;color:#344f70;margin-top:5px}.bp-flow-desc{display:block;font-size:10px;color:#7b8ca3;margin-top:4px}.bp-flow-footer{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:12px;font-size:11px;color:#657991;flex-wrap:wrap}.bp-flow-clear{background:transparent;border:0;color:#235fc2;font-weight:800;cursor:pointer}.bp-flow-badge{display:inline-flex;border-radius:20px;padding:3px 9px;background:#eaf2ff;color:#285c9c;font-size:11px;font-weight:750;margin:0 0 9px}.bp-flow-empty{padding:20px;border:1px dashed #c5d6ec;border-radius:12px;text-align:center;color:#637893}
@media(max-width:740px){.bp-flow-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;document.head.append(css);
const box=document.createElement('section');box.className='bp-flow';box.hidden=true;box.setAttribute('aria-label','Publishing workflow');
box.innerHTML=`<div class="bp-flow-head"><div><strong>Publishing workflow</strong><small>Quickly find content that needs attention</small></div><button type="button" class="bp-flow-refresh">↻ Update counts</button></div><div class="bp-flow-grid"></div><div class="bp-flow-footer"><span>Counts reflect the current organization and loaded posts.</span><button class="bp-flow-clear" type="button" hidden>Clear workflow filter ×</button></div>`;
const stages=[['draft','Drafts','Not yet submitted'],['review','Needs review','Waiting for approval'],['ready','Ready to publish','Approved, not recorded'],['done','Published','Publishing recorded']];
let filter='';let pending=false;let lastSig='';let sourceCards=[];
function getOrg(){return $('orgFilter')?.value||'';}
function isMaster(){return $('accessBadge')?.textContent?.includes('MASTER')||false;}
function cards(){return [...document.querySelectorAll('#cards article[data-post]')];}
function stage(card){const badge=[...card.querySelectorAll('.badges .badge')].find(b=>/^(Draft|Pending Review|Approved|Published)$/.test(b.textContent.trim()));const v=badge?.textContent.trim();if(v==='Draft')return 'draft';if(v==='Pending Review')return 'review';if(v==='Published')return 'done';if(v==='Approved')return 'ready';return 'other';}
function render(){const desk=$('desk');if(!desk||$('app')?.hidden){box.hidden=true;return;}if(!box.isConnected){const anchor=desk.querySelector('.section-top');if(anchor)anchor.before(box);else desk.prepend(box);}box.hidden=false;
 const all=cards();const counts=Object.fromEntries(stages.map(([id])=>[id,0]));for(const c of all)counts[stage(c)]=(counts[stage(c)]||0)+1;
 const grid=box.querySelector('.bp-flow-grid');grid.innerHTML=stages.map(([id,label,desc])=>`<button type="button" class="bp-flow-tile ${filter===id?'active':''}" data-stage="${id}" aria-pressed="${filter===id}"><span class="bp-flow-num">${counts[id]}</span><span class="bp-flow-label">${label}</span><span class="bp-flow-desc">${desc}</span></button>`).join('');
 box.querySelector('.bp-flow-clear').hidden=!filter;
 // Filter only cards already rendered by the existing app; never alter server data.
 for(const c of all){c.hidden=!!filter&&stage(c)!==filter;}
 if(filter&&!all.some(c=>!c.hidden)){let empty=desk.querySelector('#bp-flow-empty');if(!empty){empty=document.createElement('div');empty.id='bp-flow-empty';empty.className='bp-flow-empty';$('cards')?.after(empty);}empty.textContent='No '+(stages.find(x=>x[0]===filter)?.[1].toLowerCase()||'posts')+' in this view. Try All scheduled or clear the filter.';}else desk.querySelector('#bp-flow-empty')?.remove();
 const label=$('scheduleLabel');if(label){const badge=label.querySelector('.bp-flow-badge');badge?.remove();if(filter){const b=document.createElement('span');b.className='bp-flow-badge';b.textContent=' · '+stages.find(x=>x[0]===filter)[1];label.append(b);}}
 }
 function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;const sig=[getOrg(),$('app')?.hidden,$('desk')?.hidden,cards().map(c=>c.dataset.post+':'+[...c.querySelectorAll('.badges .badge')].map(b=>b.textContent).join('/')).join('|')].join('~');if(sig!==lastSig){lastSig=sig;render();}});}
 box.addEventListener('click',e=>{const tile=e.target.closest('[data-stage]');if(tile){filter=filter===tile.dataset.stage?'':tile.dataset.stage;render();return;}if(e.target.closest('.bp-flow-clear')){filter='';render();return;}if(e.target.closest('.bp-flow-refresh')){filter='';const all=$('desk')?.querySelector('[data-view="all"]');if(all){all.click();}else $('refresh')?.click();setTimeout(render,120);}});
 document.addEventListener('click',e=>{if(e.target.closest('[data-view],#navSchedule,#navCampaigns,#navLibrary,#navAdmin')){filter='';lastSig='';setTimeout(schedule,0);}});
 // Observe card additions/status updates only; avoid observing our own workflow UI.
 const target=$('cards');if(target)new MutationObserver(schedule).observe(target,{childList:true,subtree:true,characterData:true});
 const app=$('app');if(app)new MutationObserver(schedule).observe(app,{attributes:true,attributeFilter:['hidden']});
 const desk=$('desk');if(desk)new MutationObserver(schedule).observe(desk,{attributes:true,attributeFilter:['hidden']});
 $('orgFilter')?.addEventListener('change',()=>{filter='';lastSig='';schedule();});
 schedule();
})();
