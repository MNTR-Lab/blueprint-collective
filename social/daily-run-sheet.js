// Blueprint Social Studio V38 — Daily publishing with edit actions (read-only)
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const BASE='https://lbheezjanvalalinqxcd.supabase.co';
const KEY='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const db=createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const css=document.createElement('style');css.textContent=`
.bp-runsheet[hidden]{display:none!important}.bp-runsheet{margin:14px 0;padding:16px;background:white;border:1px solid #dce5f0;border-radius:14px}
.bp-runsheet-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.bp-runsheet h2{font-size:16px;margin:0;color:#173657}.bp-runsheet p{font-size:12px;color:#637995;margin:5px 0 12px}
.bp-runsheet-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
.bp-runsheet button,.bp-runsheet input[type=date]{border:1px solid #cbd9eb;border-radius:8px;background:#fff;color:#24548f;padding:8px 10px;font-size:12px;cursor:pointer}
.bp-runsheet-list{display:grid;gap:6px}
.bp-runsheet-item{display:grid;grid-template-columns:72px minmax(0,1fr) auto auto;gap:12px;align-items:center;border:1px solid #e1e9f3;border-radius:9px;padding:10px 12px;background:#f9fbff}
.bp-runsheet-time{font-size:12px;font-weight:850;color:#1f4b82}
.bp-runsheet-title{font-size:12px;font-weight:750;color:#173657;overflow-wrap:anywhere}
.bp-runsheet-meta{display:block;font-size:11px;color:#6a7e97;margin-top:3px;font-weight:450}
.bp-runsheet-badge{border-radius:99px;padding:5px 9px;font-size:10px;font-weight:850;white-space:nowrap;background:#e4f4eb;color:#247044}
.bp-runsheet-badge.pending{background:#fff0cf;color:#9a620c}.bp-runsheet-badge.draft{background:#e9edf4;color:#5a6b80}
.bp-runsheet-edit{border:1px solid #b8d1ee;border-radius:8px;padding:7px 10px;background:white;color:#20558e;font-size:11px;font-weight:800;cursor:pointer}.bp-runsheet-edit:hover{background:#eaf3ff}.bp-runsheet-status{font-size:11px;color:#6a7e97;margin-top:9px}
@media(max-width:600px){.bp-runsheet-item{grid-template-columns:60px minmax(0,1fr);gap:7px}.bp-runsheet-badge{grid-column:2;justify-self:start}}
`;document.head.append(css);
const panel=document.createElement('section');panel.className='bp-runsheet';panel.hidden=true;
panel.innerHTML=`<div class="bp-runsheet-head"><div><h2>Today's publishing schedule</h2><p>Scheduled posts with quick editing. No extra checklists.</p></div><div class="bp-runsheet-actions"><input type="date" class="bp-runsheet-date" aria-label="Schedule date"><button type="button" data-action="today">Today</button><button type="button" data-action="refresh">Refresh</button></div></div><div class="bp-runsheet-list"></div><div class="bp-runsheet-status" role="status"></div>`;
const dateInput=panel.querySelector('.bp-runsheet-date');let posts=[],loaded=false,loading=false;
function todayET(){const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).reduce((a,x)=>(a[x.type]=x.value,a),{});return `${p.year}-${p.month}-${p.day}`;}
dateInput.value=todayET();
function draw(){
 const desk=$('desk');if(!desk||$('app')?.hidden||desk.hidden){panel.hidden=true;return;}
 if(!panel.isConnected){const anchor=desk.querySelector('.section-top');anchor?anchor.before(panel):desk.prepend(panel);}panel.hidden=false;
 const org=$('orgFilter')?.value||'',date=dateInput.value;
 const rows=posts.filter(p=>!p.archived&&(!org||p.organization_slug===org||(Array.isArray(p.audience)&&p.audience.includes(org)))&&String(p.publish_at_et||'').slice(0,10)===date).sort((a,b)=>String(a.publish_at_et||'').localeCompare(String(b.publish_at_et||'')));
 const list=panel.querySelector('.bp-runsheet-list');list.replaceChildren();
 for(const p of rows){
  const row=document.createElement('article');row.className='bp-runsheet-item';
  const time=document.createElement('div');time.className='bp-runsheet-time';
  const t=String(p.publish_at_et||'').slice(11,16);time.textContent=t?new Date('2000-01-01T'+t+':00').toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'—';
  const content=document.createElement('div');content.className='bp-runsheet-title';content.textContent=p.title||'Untitled post';
  const meta=document.createElement('span');meta.className='bp-runsheet-meta';meta.textContent=[p.organization_slug||'Unassigned',p.platform||'No platform'].join(' · ');content.append(meta);
  const badge=document.createElement('span');badge.className='bp-runsheet-badge';badge.textContent=p.approval||'Unknown';if(p.approval==='Pending Review')badge.classList.add('pending');else if(p.approval!=='Approved')badge.classList.add('draft');
  row.append(time,content,badge);
  if(p.monday_id){const edit=document.createElement('button');edit.type='button';edit.className='bp-runsheet-edit';edit.textContent='✎ Edit';edit.dataset.editId=String(p.monday_id);row.append(edit);}
  list.append(row);
 }
 if(!rows.length){const empty=document.createElement('p');empty.textContent=loaded?'Nothing scheduled for this date.':'Loading schedule…';list.append(empty);}
 panel.querySelector('.bp-runsheet-status').textContent=`${rows.length} post${rows.length===1?'':'s'} scheduled · Eastern Time · Schedule only (not a publishing confirmation)`;
}
async function refresh(){
 if(loading||$('app')?.hidden)return;loading=true;panel.querySelector('.bp-runsheet-status').textContent='Refreshing schedule…';
 try{
  const {data:{session}}=await db.auth.getSession();if(!session)throw Error('Sign in to see the schedule.');
  const r=await fetch(BASE+'/functions/v1/blueprint-social',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'bootstrap'})});
  const d=await r.json();if(!r.ok||d.error)throw Error(d.error||'Unable to load schedule.');
  posts=Array.isArray(d.posts)?d.posts:[];loaded=true;draw();
 }catch(e){panel.querySelector('.bp-runsheet-status').textContent=e.message||'Schedule unavailable.';}
 finally{loading=false;}
}
function init(){
 const desk=$('desk'),app=$('app');if(!desk||!app)return;
 panel.addEventListener('click',e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(a==='today'){dateInput.value=todayET();draw();}if(a==='refresh')refresh();
  const edit=e.target.closest('[data-edit-id]');if(edit)window.dispatchEvent(new CustomEvent('blueprint:edit-post',{detail:{monday_id:edit.dataset.editId}}));
 });
 dateInput.addEventListener('change',draw);$('orgFilter')?.addEventListener('change',draw);$('refresh')?.addEventListener('click',refresh);
 $('signOut')?.addEventListener('click',()=>{posts=[];loaded=false;panel.hidden=true;});
 new MutationObserver(()=>{if(!app.hidden)refresh();else panel.hidden=true;}).observe(app,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(draw).observe(desk,{attributes:true,attributeFilter:['hidden']});
 draw();if(!app.hidden)refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
