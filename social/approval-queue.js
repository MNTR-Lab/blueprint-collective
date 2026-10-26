// Blueprint Social Studio V39 — Approval Queue grouped by scheduled day.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const BASE='https://lbheezjanvalalinqxcd.supabase.co';
const KEY='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const client=createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const css=document.createElement('style');
css.textContent=`
.bp-approval[hidden]{display:none!important}.bp-approval{margin:16px 0 22px;padding:19px;background:#fff;border:1px solid #dce5f0;border-radius:16px;box-shadow:0 8px 25px #11264a0a}
.bp-approval-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:13px}
.bp-approval h2{font-size:17px;color:#173657;margin:0}.bp-approval p{font-size:12px;color:#637995;margin:5px 0}
.bp-approval-refresh{padding:8px 12px;border-radius:9px;border:1px solid #cad9ec;background:#f7faff;color:#24599e;font-weight:750;cursor:pointer}
.bp-approval-list{display:grid;gap:9px}
.bp-approval-day{display:flex;align-items:center;gap:12px;margin:17px 0 3px;padding:10px 13px;border-radius:10px;background:#eaf2fc;border-left:4px solid #2d65a6;color:#1c456f;font-size:13px;font-weight:850}
.bp-approval-day:first-child{margin-top:2px}.bp-approval-day-count{margin-left:auto;font-size:11px;color:#54759a;background:white;border-radius:99px;padding:4px 9px}
.bp-approval-item{border:1px solid #e2e9f2;border-radius:12px;padding:14px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;background:#fcfdff}
.bp-approval-item h3{font-size:14px;margin:0 0 4px;color:#1c385b}.bp-approval-item small{color:#687f99}.bp-approval-actions{display:flex;gap:7px;flex-wrap:wrap}
.bp-approval-actions button{border:1px solid #cbd9eb;background:#fff;border-radius:9px;padding:9px 12px;font-weight:750;font-size:12px;color:#24548f;cursor:pointer}
.bp-approval-actions button[data-approval="Approved"]{background:#215bb9;border-color:#215bb9;color:white}
.bp-approval-actions button:disabled{opacity:.5;cursor:wait}.bp-approval-msg{font-size:12px;color:#657991}.bp-approval-error{color:#b42318}
`;document.head.append(css);
const section=document.createElement('section');section.className='bp-approval';section.hidden=true;
section.innerHTML=`<div class="bp-approval-head"><div><h2>Approval queue</h2><p>Posts grouped by scheduled publishing date. Only Blueprint master accounts can change approvals.</p></div><button class="bp-approval-refresh" type="button">↻ Refresh queue</button></div><div class="bp-approval-list"></div><p class="bp-approval-msg" role="status"></p>`;
let records=[],busy=false,loading=false,initialized=false,run=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
function master(){return !$('app')?.hidden&&($('accessBadge')?.textContent||'').includes('MASTER');}
function visible(p){const org=$('orgFilter')?.value||'';return !p.archived&&p.approval!=='Approved'&&(!org||p.organization_slug===org||(Array.isArray(p.audience)&&p.audience.includes(org)));}
function dayKey(p){return String(p.publish_at_et||'').match(/^\d{4}-\d{2}-\d{2}/)?.[0]||'unscheduled';}
function dayLabel(key){if(key==='unscheduled')return 'Date not scheduled';const [y,m,d]=key.split('-').map(Number);return new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d)));}
function paint(){
 const desk=$('desk');if(!desk||desk.hidden||!master()){section.hidden=true;return;}
 if(!section.isConnected){const bar=desk.querySelector('.section-top');bar?bar.before(section):desk.prepend(section);}
 section.hidden=false;
 const posts=records.filter(visible).sort((a,b)=>String(a.publish_at_et||'9999').localeCompare(String(b.publish_at_et||'9999'))).slice(0,25);
 const list=section.querySelector('.bp-approval-list');
 if(!posts.length){list.innerHTML='<p>No drafts or pending-review posts for this organization.</p>';return;}
 const groups=new Map();for(const p of posts){const key=dayKey(p);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
 list.innerHTML=[...groups].map(([day,items])=>`<div class="bp-approval-day"><span>▦ ${esc(dayLabel(day))}</span><span class="bp-approval-day-count">${items.length} post${items.length===1?'':'s'}</span></div>${items.map(p=>`<article class="bp-approval-item" data-id="${esc(p.monday_id)}"><div><h3>${esc(p.title)}</h3><small>${esc(p.organization_slug)} · ${esc(p.approval)} · ${esc(p.publish_at_et||'Unscheduled')} ET · ${esc(p.platform)}</small></div><div class="bp-approval-actions">${p.approval==='Draft'?`<button type="button" data-approval="Pending Review">Submit for review</button>`:''}<button type="button" data-approval="Approved">Approve</button>${p.approval==='Pending Review'?`<button type="button" data-approval="Draft">Return to draft</button>`:''}</div></article>`).join('')}`).join('');
}
async function api(action,body={}){
 const {data:{session}}=await client.auth.getSession();if(!session)throw Error('Sign in again.');
 const res=await fetch(BASE+'/functions/v1/blueprint-social',{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+session.access_token},body:JSON.stringify({action,...body})});
 const result=await res.json();if(!res.ok||result.error)throw Error(result.error||'Request failed');return result;
}
async function refresh(){
 if(loading||!master())return;loading=true;const n=++run;const msg=section.querySelector('.bp-approval-msg');msg.textContent='Loading approvals…';msg.classList.remove('bp-approval-error');
 try{const data=await api('bootstrap');if(n!==run)return;records=Array.isArray(data.posts)?data.posts:[];msg.textContent='Showing up to 25 posts awaiting action, grouped by publishing date.';paint();}
 catch(e){msg.textContent=e.message||'Unable to load queue';msg.classList.add('bp-approval-error');}
 finally{loading=false;}
}
function init(){
 if(initialized)return;const desk=$('desk'),app=$('app');if(!desk||!app)return;initialized=true;
 section.querySelector('.bp-approval-refresh').addEventListener('click',refresh);
 section.querySelector('.bp-approval-list').addEventListener('click',async e=>{
  const button=e.target.closest('button[data-approval]');if(!button||busy||!master())return;
  const id=button.closest('[data-id]')?.dataset.id,approval=button.dataset.approval;
  if(!/^\d+$/.test(id||''))return;
  busy=true;button.disabled=true;const msg=section.querySelector('.bp-approval-msg');
  msg.textContent='Saving approval to Monday…';msg.classList.remove('bp-approval-error');
  try{
   await api('approval_set',{monday_id:id,approval});
   const p=records.find(p=>String(p.monday_id)===id);if(p)p.approval=approval;
   msg.textContent=approval==='Approved'?'Approved. Client calendar visibility remains unchanged.':'Status saved.';
   paint();$('refresh')?.click();setTimeout(refresh,350);
  }catch(error){msg.textContent=error.message||'Unable to save';msg.classList.add('bp-approval-error');button.disabled=false;}
  finally{busy=false;}
 });
 $('orgFilter')?.addEventListener('change',paint);
 $('refresh')?.addEventListener('click',()=>setTimeout(refresh,350));
 $('signOut')?.addEventListener('click',()=>{records=[];section.hidden=true;});
 document.addEventListener('click',e=>{if(e.target.closest('#navSchedule'))setTimeout(()=>{paint();refresh()},0);else if(e.target.closest('#navCampaigns,#navLibrary,#navAdmin'))setTimeout(paint,0);});
 new MutationObserver(()=>{if(!app.hidden)refresh();else section.hidden=true;}).observe(app,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(paint).observe(desk,{attributes:true,attributeFilter:['hidden']});
 paint();if(!app.hidden)refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
