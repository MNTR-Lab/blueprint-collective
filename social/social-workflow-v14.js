// Blueprint Social Studio V15 — complete replacement for social-workflow-v14.js
// Workflow counts are calculated from authenticated Supabase bootstrap data,
// not only cards currently rendered on screen. Existing publishing actions remain unchanged.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const BASE='https://lbheezjanvalalinqxcd.supabase.co';
const KEY='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const client=createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const STAGES=[['draft','Drafts','Still being prepared'],['review','Needs review','Awaiting approval'],['ready','Ready to publish','Approved, not completed'],['done','Published','Publishing recorded']];
const style=document.createElement('style');
style.textContent=`
.bp-flow[hidden],.bp-flow-empty[hidden]{display:none!important}
.bp-flow{margin:16px 0 20px;padding:20px;border:1px solid #dce6f3;border-radius:17px;background:linear-gradient(120deg,#fff,#f4f8ff);box-shadow:0 7px 24px #162c4809}
.bp-flow-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:15px}
.bp-flow-head strong{font-size:16px;color:#173458}.bp-flow-head small{display:block;color:#667b97;margin-top:5px}
.bp-flow-update,.bp-flow-clear{border:1px solid #c9d8ed;border-radius:9px;background:white;padding:9px 12px;cursor:pointer;font-weight:750;color:#22549a}
.bp-flow-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}
.bp-flow-tile{min-width:0;text-align:left;border:1px solid #dce6f3;border-radius:13px;padding:16px 13px;background:white;cursor:pointer;transition:.15s}
.bp-flow-tile:hover,.bp-flow-tile:focus-visible{border-color:#4c83d8;transform:translateY(-1px)}
.bp-flow-tile.active{border-color:#2f6fcb;box-shadow:0 0 0 2px #2f6fcb20;background:#f5f9ff}
.bp-flow-num{display:block;font-size:28px;font-weight:850;color:#16385f;line-height:1.2}
.bp-flow-label{display:block;font-size:12px;font-weight:800;color:#344f70;margin-top:5px}
.bp-flow-desc{display:block;font-size:10px;color:#7b8ca3;margin-top:4px}
.bp-flow-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:13px;font-size:11px;color:#657991}
.bp-flow-error{color:#b42318}.bp-flow-empty{padding:20px;border:1px dashed #c5d6ec;border-radius:12px;text-align:center;color:#637893}
@media(max-width:740px){.bp-flow-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;document.head.append(style);
const box=document.createElement('section');box.className='bp-flow';box.hidden=true;box.setAttribute('aria-label','Publishing workflow');
box.innerHTML=`<div class="bp-flow-head"><div><strong>Publishing workflow</strong><small>All active posts for your selected organization</small></div><button class="bp-flow-update" type="button">↻ Refresh workflow</button></div><div class="bp-flow-grid"></div><div class="bp-flow-footer"><span class="bp-flow-message" role="status">Loading publishing workflow…</span><button class="bp-flow-clear" type="button" hidden>Clear filter ×</button></div>`;
let posts=[],publications=[],active='',loading=false,initialized=false,loadSequence=0,selectedView='';
function stage(p){
 if(p.approval==='Draft')return 'draft';
 if(p.approval==='Pending Review')return 'review';
 if(p.approval!=='Approved')return 'other';
 const orgs=[p.organization_slug,...(Array.isArray(p.audience)?p.audience:[])].filter((v,i,a)=>v&&a.indexOf(v)===i);
 const platforms=String(p.platform||'').split(',').map(x=>x.trim()).filter(Boolean);
 return orgs.length&&platforms.length&&orgs.every(o=>platforms.every(platform=>publications.some(x=>String(x.monday_id)===String(p.monday_id)&&x.organization_slug===o&&x.platform===platform)))?'done':'ready';
}
function scoped(){
 const org=$('orgFilter')?.value||'';
 return posts.filter(p=>!p.archived&&(!org||p.organization_slug===org||(Array.isArray(p.audience)&&p.audience.includes(org))));
}
function showCards(){
 const cards=[...document.querySelectorAll('#cards article[data-post]')];
 for(const card of cards){const post=posts.find(p=>String(p.monday_id)===card.dataset.post);card.hidden=!!active&&(!post||stage(post)!==active);}
 const empty=$('bp-flow-empty');if(empty)empty.remove();
 if(active&&cards.length&&!cards.some(c=>!c.hidden)){
  const e=document.createElement('div');e.id='bp-flow-empty';e.className='bp-flow-empty';
  e.textContent='No matching posts in this date view. Select All scheduled to see the full workflow.';
  $('cards')?.after(e);
 }
}
function render(){
 const desk=$('desk');const app=$('app');
 if(!desk||!app||app.hidden||desk.hidden){box.hidden=true;return;}
 if(!box.isConnected){const anchor=desk.querySelector('.section-top');anchor?anchor.before(box):desk.prepend(box);}
 box.hidden=false;
 const counts={draft:0,review:0,ready:0,done:0};
 for(const p of scoped()){const s=stage(p);if(s in counts)counts[s]++;}
 box.querySelector('.bp-flow-grid').innerHTML=STAGES.map(([id,label,description])=>`<button class="bp-flow-tile ${active===id?'active':''}" data-stage="${id}" aria-pressed="${active===id}" type="button"><span class="bp-flow-num">${counts[id]}</span><span class="bp-flow-label">${label}</span><span class="bp-flow-desc">${description}</span></button>`).join('');
 box.querySelector('.bp-flow-clear').hidden=!active;
 showCards();
}
async function refresh(){
 if(loading||$('app')?.hidden)return;
 loading=true;const sequence=++loadSequence;
 const msg=box.querySelector('.bp-flow-message');msg.textContent='Updating counts…';msg.classList.remove('bp-flow-error');
 try{
  const {data:{session}}=await client.auth.getSession();
  if(!session)throw Error('Please sign in to view the workflow.');
  const response=await fetch(BASE+'/functions/v1/blueprint-social',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'bootstrap'})});
  const result=await response.json();
  if(!response.ok||result.error)throw Error(result.error||'Unable to load workflow');
  if(sequence!==loadSequence)return;
  posts=Array.isArray(result.posts)?result.posts:[];
  publications=Array.isArray(result.publications)?result.publications:[];
  msg.textContent='Counts include all active posts, not just today’s cards.';
  render();
 }catch(error){msg.textContent=error.message||'Unable to refresh';msg.classList.add('bp-flow-error');}
 finally{loading=false;}
}
function initialize(){
 if(initialized)return;
 const desk=$('desk'),cards=$('cards'),app=$('app');if(!desk||!cards||!app)return;
 initialized=true;
 box.addEventListener('click',event=>{
  const tile=event.target.closest('[data-stage]');
  if(tile){
   active=active===tile.dataset.stage?'':tile.dataset.stage;
   if(active){const all=desk.querySelector('[data-view="all"]');if(all&&!all.classList.contains('selected'))all.click();}
   render();
  }else if(event.target.closest('.bp-flow-clear')){active='';render();}
  else if(event.target.closest('.bp-flow-update'))refresh();
 });
 $('orgFilter')?.addEventListener('change',()=>{active='';render();});
 $('refresh')?.addEventListener('click',()=>setTimeout(refresh,250));
 $('signOut')?.addEventListener('click',()=>{posts=[];publications=[];active='';box.hidden=true;});
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-view]')){active='';setTimeout(render,0);}
  if(event.target.closest('#navSchedule'))setTimeout(()=>{render();refresh();},0);
  if(event.target.closest('#navCampaigns,#navLibrary,#navAdmin'))setTimeout(render,0);
 });
 let queued=false;
 new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});}).observe(cards,{childList:true,subtree:true});
 new MutationObserver(()=>{if(!app.hidden)refresh();else box.hidden=true;}).observe(app,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(render).observe(desk,{attributes:true,attributeFilter:['hidden']});
 render();if(!app.hidden)refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
