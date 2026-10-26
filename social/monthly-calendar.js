// Blueprint Social Studio V31 — Monthly Content Calendar with day details (read-only)
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const BASE='https://lbheezjanvalalinqxcd.supabase.co';
const KEY='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const db=createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=document.createElement('style');
css.textContent=`
.bp-month[hidden]{display:none!important}.bp-month{margin:15px 0 22px;padding:19px;background:white;border:1px solid #dce5f0;border-radius:16px;box-shadow:0 8px 25px #11264a0a}
.bp-month-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.bp-month h2{font-size:17px;color:#173657;margin:0}.bp-month p{font-size:12px;color:#637995;margin:5px 0 12px}
.bp-month-controls{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.bp-month button{border:1px solid #cbd9eb;background:#fff;color:#24548f;padding:8px 11px;border-radius:9px;font-size:12px;font-weight:750;cursor:pointer}
.bp-month-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}.bp-month-dow{padding:8px 3px;text-align:center;color:#5d7695;font-size:11px;font-weight:850}
.bp-month-day{min-height:108px;min-width:0;border:1px solid #e0e9f4;border-radius:10px;background:#f9fbff;padding:8px;overflow:hidden}
.bp-month-day.outside{background:#f5f6f8;opacity:.45}.bp-month-day.today{border:2px solid #2b69c8;background:#f0f6ff}
.bp-month-number{font-size:12px;color:#2a496d;font-weight:850}.bp-month-count{float:right;font-size:10px;color:#6881a0}
.bp-month-day[data-date]{cursor:pointer}.bp-month-day[data-date]:hover,.bp-month-day[data-date]:focus-visible{border-color:#3779ce;outline:2px solid #3779ce33}.bp-month-day.is-selected{border:2px solid #2865b9;background:#eaf3ff}
.bp-month-details{margin-top:15px;padding:15px;background:#f7faff;border:1px solid #dbe6f5;border-radius:12px}
.bp-month-details h3{font-size:15px;color:#193b64;margin:0 0 9px}.bp-month-details-item{background:white;border:1px solid #e1e8f3;padding:11px;border-radius:9px;margin-top:8px}
.bp-month-details-item strong{display:block;color:#214469;font-size:13px}.bp-month-details-item small{display:block;color:#647d98;font-size:11px;margin-top:5px}
.bp-month-details-empty{font-size:12px;color:#657c96}.bp-month-post{display:block;margin-top:5px;border-radius:6px;padding:5px 6px;background:#eaf2ff;color:#204c82;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bp-month-post.pending{background:#fff3d9;color:#8b5a0a}.bp-month-post.draft{background:#edf0f5;color:#56657a}
.bp-month-more{font-size:10px;color:#607894;margin-top:5px}.bp-month-status{font-size:11px;color:#637995}
@media(max-width:850px){.bp-month-grid{grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}.bp-month-day{min-height:68px;padding:4px}.bp-month-post{font-size:9px;padding:3px}.bp-month-dow{font-size:9px}}
@media(max-width:500px){.bp-month-post{display:none}.bp-month-day{min-height:48px}.bp-month-count{float:none;display:block}}
`;document.head.append(css);
const panel=document.createElement('section');panel.className='bp-month';panel.hidden=true;
panel.innerHTML=`<div class="bp-month-top"><div><h2>Monthly content calendar</h2><p>View the full month and spot days with no scheduled posts.</p></div><div class="bp-month-controls"><button type="button" data-action="prev" aria-label="Previous month">←</button><strong class="bp-month-title"></strong><button type="button" data-action="next" aria-label="Next month">→</button><button type="button" data-action="today">Current month</button><button type="button" data-action="refresh">↻ Refresh</button></div></div><div class="bp-month-grid"></div><div class="bp-month-details" aria-live="polite"><h3>Day details</h3><div class="bp-month-details-body">Select a day to view its scheduled posts.</div></div><p class="bp-month-status" role="status"></p>`;
let posts=[],loading=false,initialized=false,sequence=0,selectedDay=null;
function etParts(date){return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(date).reduce((a,p)=>(a[p.type]=p.value,a),{});}
const todayParts=etParts(new Date());const todayKey=[todayParts.year,todayParts.month.padStart(2,'0'),todayParts.day.padStart(2,'0')].join('-');
let year=+todayParts.year,month=+todayParts.month-1;
const iso=(y,m,d)=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
function relevant(p){
 const org=$('orgFilter')?.value||'';
 return !p.archived&&(!org||p.organization_slug===org||(Array.isArray(p.audience)&&p.audience.includes(org)));
}
function draw(){
 const desk=$('desk');if(!desk||$('app')?.hidden||desk.hidden){panel.hidden=true;return;}
 if(!panel.isConnected){const anchor=desk.querySelector('.section-top');anchor?anchor.before(panel):desk.prepend(panel);}
 panel.hidden=false;
 panel.querySelector('.bp-month-title').textContent=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month,1)));
 const grid=panel.querySelector('.bp-month-grid');
 const first=new Date(Date.UTC(year,month,1)),offset=(first.getUTCDay()+6)%7;
 const days=new Date(Date.UTC(year,month+1,0)).getUTCDate();
 const buckets=new Map();
 for(const p of posts.filter(relevant)){
  const day=String(p.publish_at_et||'').match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if(!day)continue;if(!buckets.has(day))buckets.set(day,[]);buckets.get(day).push(p);
 }
 const names=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 let html=names.map(x=>`<div class="bp-month-dow">${x}</div>`).join('');
 const cells=Math.ceil((offset+days)/7)*7;
 for(let i=0;i<cells;i++){
  const d=i-offset+1;
  const inside=d>=1&&d<=days;
  if(!inside){html+='<div class="bp-month-day outside" aria-hidden="true"></div>';continue;}
  const key=iso(year,month,d),items=buckets.get(key)||[];
  const labels=items.slice(0,3).map(p=>`<span class="bp-month-post ${p.approval==='Pending Review'?'pending':p.approval==='Draft'?'draft':''}" title="${esc(p.title)} — ${esc(p.organization_slug)}">${esc(p.title||'Untitled')}</span>`).join('');
  html+=`<div role="button" tabindex="0" data-date="${key}" class="bp-month-day ${key===selectedDay?'is-selected':''} ${key===todayKey?'today':''}" aria-label="${esc(key)}, ${items.length} scheduled posts"><span class="bp-month-number">${d}</span><span class="bp-month-count">${items.length?items.length+' posts':''}</span>${labels}${items.length>3?`<div class="bp-month-more">+${items.length-3} more</div>`:''}</div>`;
 }
 grid.innerHTML=html;
 drawDetails();
 const total=[...buckets.entries()].filter(([key])=>key.startsWith(iso(year,month,1).slice(0,7))).reduce((n,[,items])=>n+items.length,0);
 panel.querySelector('.bp-month-status').textContent=`${total} scheduled posts this month · Counts reflect your authorized organizations.`;
}
function drawDetails(){
 const body=panel.querySelector('.bp-month-details-body');
 const title=panel.querySelector('.bp-month-details h3');
 if(!selectedDay){title.textContent='Day details';body.textContent='Select a day to view its scheduled posts.';return;}
 title.textContent='Scheduled posts · '+selectedDay;
 const items=posts.filter(relevant).filter(p=>String(p.publish_at_et||'').startsWith(selectedDay));
 if(!items.length){body.innerHTML='<div class="bp-month-details-empty">No posts scheduled for this day.</div>';return;}
 const master=Boolean($('accessBadge')?.textContent.includes('MASTER'));
 body.innerHTML=items.map(p=>`<div class="bp-month-details-item"><strong>${esc(p.title||'Untitled post')}</strong><small>${esc(p.organization_slug||'')} · ${esc(p.platform||'No platform')} · ${esc(p.approval||'Unknown status')} · ${esc(p.publish_at_et||'')}</small>${master&&p.monday_id?`<button type="button" class="bp-month-edit" data-edit-id="${esc(p.monday_id)}">✎ Edit Post</button>`:''}</div>`).join('');
}
async function refresh(){
 if(loading||$('app')?.hidden)return;loading=true;const current=++sequence;
 const status=panel.querySelector('.bp-month-status');status.textContent='Loading monthly schedule…';
 try{
  const {data:{session}}=await db.auth.getSession();if(!session)throw Error('Sign in to view the calendar.');
  const response=await fetch(BASE+'/functions/v1/blueprint-social',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'bootstrap'})});
  const data=await response.json();if(!response.ok||data.error)throw Error(data.error||'Unable to load schedule');
  if(current!==sequence)return;posts=Array.isArray(data.posts)?data.posts:[];draw();
 }catch(e){status.textContent=e.message||'Calendar unavailable';}
 finally{loading=false;}
}
function init(){
 if(initialized)return;const desk=$('desk'),app=$('app');if(!desk||!app)return;initialized=true;
 panel.addEventListener('click',e=>{
  const edit=e.target.closest('[data-edit-id]');
  if(edit){e.preventDefault();if($('accessBadge')?.textContent.includes('MASTER'))window.dispatchEvent(new CustomEvent('blueprint:edit-post',{detail:{monday_id:edit.dataset.editId}}));return;}
  const day=e.target.closest('[data-date]');
  if(day){selectedDay=day.dataset.date;draw();return;}
  const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
  if(action==='refresh'){refresh();return;}
  if(action==='today'){year=+todayParts.year;month=+todayParts.month-1;selectedDay=null;}
  else{const d=new Date(Date.UTC(year,month+(action==='next'?1:-1),1));year=d.getUTCFullYear();month=d.getUTCMonth();selectedDay=null;}
  draw();
 });
 panel.querySelector('.bp-month-grid').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-date]')){e.preventDefault();selectedDay=e.target.dataset.date;draw();panel.querySelector(`[data-date="${selectedDay}"]`)?.focus();}});
 $('orgFilter')?.addEventListener('change',draw);
 $('refresh')?.addEventListener('click',()=>setTimeout(refresh,300));
 $('signOut')?.addEventListener('click',()=>{posts=[];panel.hidden=true;});
 document.addEventListener('click',e=>{if(e.target.closest('#navSchedule'))setTimeout(()=>{draw();refresh()},0);else if(e.target.closest('#navCampaigns,#navLibrary,#navAdmin'))setTimeout(draw,0);});
 new MutationObserver(()=>{if(!app.hidden)refresh();else panel.hidden=true;}).observe(app,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(draw).observe(desk,{attributes:true,attributeFilter:['hidden']});
 draw();if(!app.hidden)refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();

// V31 edit button styling
const v31style=document.createElement('style');v31style.textContent='.bp-month-edit{margin-top:8px;padding:7px 10px;border:1px solid #bad1ee;background:#edf5ff;color:#174c91;border-radius:8px;font-weight:750;cursor:pointer}';document.head.append(v31style);
