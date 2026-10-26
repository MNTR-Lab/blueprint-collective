// Blueprint Social Studio V30 — Daily Publishing Run Sheet.
// Checkboxes are local-only and never alter publication status in Supabase.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const BASE='https://lbheezjanvalalinqxcd.supabase.co';
const KEY='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const db=createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=document.createElement('style');css.textContent=`
.bp-runsheet[hidden]{display:none!important}.bp-runsheet{margin:16px 0;padding:19px;background:white;border:1px solid #dce5f0;border-radius:16px}
.bp-runsheet h2{font-size:17px;margin:0;color:#173657}.bp-runsheet p{font-size:12px;color:#637995;margin:6px 0 12px}
.bp-runsheet-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.bp-runsheet-actions{display:flex;gap:7px;flex-wrap:wrap}
.bp-runsheet button,.bp-runsheet input[type=date]{border:1px solid #cbd9eb;border-radius:9px;background:white;color:#24548f;padding:8px 10px;font-size:12px;font-weight:750;cursor:pointer}
.bp-runsheet-list{display:grid;gap:10px}.bp-runsheet-item{border:1px solid #dce5f0;border-radius:11px;padding:12px;background:#f8fbff}
.bp-runsheet-item strong{font-size:13px;color:#173657}.bp-runsheet-item small{display:block;color:#637995;font-size:11px;margin-top:4px}
.bp-runsheet-steps{display:flex;flex-wrap:wrap;gap:13px;margin-top:10px}.bp-runsheet-steps label{display:flex;align-items:center;gap:5px;font-size:11px;color:#385779;cursor:pointer}
.bp-runsheet-warning{font-size:11px!important;color:#986515!important}.bp-runsheet-status{font-size:12px;color:#637995}
`;document.head.append(css);
const panel=document.createElement('section');panel.className='bp-runsheet';panel.hidden=true;
panel.innerHTML=`<div class="bp-runsheet-head"><div><h2>Daily publishing run sheet</h2><p>Prepare, post and verify today's scheduled content.</p></div><div class="bp-runsheet-actions"><input type="date" class="bp-runsheet-date" aria-label="Run sheet date"><button type="button" data-action="today">Today</button><button type="button" data-action="refresh">↻ Refresh</button><button type="button" data-action="clear">Clear checks</button></div></div><p class="bp-runsheet-warning">Checks are saved only in this browser. They do not publish content or update official publication status.</p><div class="bp-runsheet-list"></div><p class="bp-runsheet-status" role="status"></p>`;
let posts=[],loading=false,loaded=false,authId='',seq=0;
function todayET(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).reduce((o,p)=>(o[p.type]=p.value,o),{});return `${parts.year}-${parts.month}-${parts.day}`;}
const dateInput=panel.querySelector('.bp-runsheet-date');dateInput.value=todayET();
function relevant(p){const org=$('orgFilter')?.value||'';return !p.archived&&(!org||p.organization_slug===org||(Array.isArray(p.audience)&&p.audience.includes(org)));}
function storageKey(p,step){return `bp-run-v30:${authId}:${String(p.monday_id||p.id||p.title||'unknown')}:${String(p.publish_at_et||'')}:${step}`;}
function checked(p,step){try{return localStorage.getItem(storageKey(p,step))==='1';}catch{return false;}}
function draw(){const desk=$('desk');if(!desk||$('app')?.hidden||desk.hidden){panel.hidden=true;return;}
 if(!panel.isConnected){const a=desk.querySelector('.section-top');a?a.before(panel):desk.prepend(panel);}panel.hidden=false;
 const date=dateInput.value;const rows=posts.filter(p=>relevant(p)&&String(p.publish_at_et||'').slice(0,10)===date).sort((a,b)=>String(a.publish_at_et||'').localeCompare(String(b.publish_at_et||'')));
 const list=panel.querySelector('.bp-runsheet-list');list.replaceChildren();
 for(const p of rows){const card=document.createElement('article');card.className='bp-runsheet-item';
  const title=document.createElement('strong');title.textContent=p.title||'Untitled post';card.append(title);
  const meta=document.createElement('small');meta.textContent=[p.organization_slug||'Unassigned',p.platform||'Platform missing',p.publish_at_et||'Time missing',p.approval||'Approval unknown'].join(' · ');card.append(meta);
  const steps=document.createElement('div');steps.className='bp-runsheet-steps';
  for(const [step,label] of [['assets','Assets checked'],['caption','Caption checked'],['posted','Posted manually'],['verified','Verified on platform']]){
   const wrap=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=checked(p,step);
   input.addEventListener('change',()=>{try{if(input.checked)localStorage.setItem(storageKey(p,step),'1');else localStorage.removeItem(storageKey(p,step));}catch{panel.querySelector('.bp-runsheet-status').textContent='Browser storage is unavailable; checks will not persist.';}});
   wrap.append(input,document.createTextNode(label));steps.append(wrap);
  }card.append(steps);list.append(card);
 }
 if(!rows.length){const empty=document.createElement('p');empty.textContent=loaded?'No scheduled posts for this date and organization.':'Load the schedule to see posts.';list.append(empty);}
 panel.querySelector('.bp-runsheet-status').textContent=`${rows.length} scheduled post${rows.length===1?'':'s'} · ${date} · Local checklist only.`;
}
async function refresh(){if(loading||$('app')?.hidden)return;loading=true;const current=++seq;panel.querySelector('.bp-runsheet-status').textContent='Loading daily schedule…';
 try{const {data:{session}}=await db.auth.getSession();if(!session)throw Error('Sign in to view your run sheet.');
  authId=session.user.id;
  const res=await fetch(BASE+'/functions/v1/blueprint-social',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'bootstrap'})});
  const data=await res.json();if(!res.ok||data.error)throw Error(data.error||'Unable to load schedule.');
  if(current!==seq)return;posts=Array.isArray(data.posts)?data.posts:[];loaded=true;draw();
 }catch(e){panel.querySelector('.bp-runsheet-status').textContent=e.message||'Run sheet unavailable.';}finally{loading=false;}}
function init(){const desk=$('desk'),app=$('app');if(!desk||!app)return;
 panel.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
  if(action==='today'){dateInput.value=todayET();draw();}
  if(action==='refresh')refresh();
  if(action==='clear'){if(!confirm('Clear local checklist marks for the selected date?'))return;const rows=posts.filter(p=>relevant(p)&&String(p.publish_at_et||'').slice(0,10)===dateInput.value);for(const p of rows)for(const step of ['assets','caption','posted','verified'])try{localStorage.removeItem(storageKey(p,step));}catch{}draw();}
 });
 dateInput.addEventListener('change',draw);$('orgFilter')?.addEventListener('change',draw);
 $('signOut')?.addEventListener('click',()=>{posts=[];authId='';loaded=false;panel.hidden=true;});
 new MutationObserver(()=>{if(!app.hidden)refresh();else panel.hidden=true;}).observe(app,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(draw).observe(desk,{attributes:true,attributeFilter:['hidden']});
 draw();if(!app.hidden)refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
