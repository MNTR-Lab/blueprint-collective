// Blueprint Social Studio V22: read-only weekly planning board.
// Uses the same authenticated, organization-scoped bootstrap as the publishing desk.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const BASE='https://lbheezjanvalalinqxcd.supabase.co';
const KEY='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const db=createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=document.createElement('style');css.textContent=`
.bp-week[hidden]{display:none!important}.bp-week{margin:15px 0 22px;padding:19px;background:white;border:1px solid #dce5f0;border-radius:16px;box-shadow:0 8px 25px #11264a0a}
.bp-week-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.bp-week h2{margin:0;color:#173657;font-size:17px}.bp-week p{font-size:12px;color:#637995;margin:5px 0 12px}.bp-week-controls{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.bp-week button{border:1px solid #cbd9eb;border-radius:9px;background:#fff;padding:8px 11px;color:#24548f;font-weight:750;cursor:pointer}.bp-week-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin-top:12px}.bp-week-day{min-width:0;background:#f8fbff;border:1px solid #e0e9f4;border-radius:12px;padding:11px}.bp-week-day h3{font-size:12px;color:#29496c;margin:0 0 8px}.bp-week-day strong{font-size:20px;color:#173657}.bp-week-entry{border:1px solid #dce6f1;border-radius:8px;padding:8px;margin-top:8px;background:white}.bp-week-entry b{display:block;font-size:11px;color:#1d3e62;overflow-wrap:anywhere}.bp-week-entry small{display:block;font-size:10px;color:#657991;margin-top:4px;overflow-wrap:anywhere}.bp-week-empty{font-size:11px;color:#8a9aaf;margin-top:10px}.bp-week-message{font-size:11px;color:#637995}.bp-week-error{color:#b42318!important}@media(max-width:1100px){.bp-week-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(max-width:650px){.bp-week-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;document.head.append(css);
const panel=document.createElement('section');panel.className='bp-week';panel.hidden=true;panel.innerHTML=`<div class="bp-week-top"><div><h2>Weekly publishing planner</h2><p>See seven days of scheduled posts and identify gaps in your content plan.</p></div><div class="bp-week-controls"><button type="button" data-week="prev" aria-label="Previous week">←</button><span class="bp-week-range"></span><button type="button" data-week="next" aria-label="Next week">→</button><button type="button" data-week="today">This week</button><button type="button" data-week="refresh">↻ Refresh</button></div></div><div class="bp-week-grid"></div><p class="bp-week-message" role="status"></p>`;
let posts=[],loading=false,initialized=false,sequence=0;
function dateParts(date){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).reduce((o,p)=>(o[p.type]=p.value,o),{});}
function easternToday(){const p=dateParts(new Date());return new Date(Date.UTC(+p.year,+p.month-1,+p.day,12));}
function monday(date){const d=new Date(date);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d;}
let week=monday(easternToday());
function dateKey(d){return d.toISOString().slice(0,10);}
function day(d){return new Intl.DateTimeFormat('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}).format(d);}
function scope(p){const org=$('orgFilter')?.value||'';return !p.archived&&(!org||p.organization_slug===org||(Array.isArray(p.audience)&&p.audience.includes(org)));}
function render(){const desk=$('desk');if(!desk||$('app')?.hidden||desk.hidden){panel.hidden=true;return;}if(!panel.isConnected){const a=desk.querySelector('.section-top');a?a.before(panel):desk.prepend(panel);}panel.hidden=false;
 const end=new Date(week);end.setUTCDate(end.getUTCDate()+6);panel.querySelector('.bp-week-range').textContent=day(week)+' – '+day(end);
 const rows=posts.filter(scope);const grid=panel.querySelector('.bp-week-grid');grid.innerHTML='';
 for(let i=0;i<7;i++){const d=new Date(week);d.setUTCDate(d.getUTCDate()+i);const key=dateKey(d);const list=rows.filter(p=>String(p.publish_at_et||'').slice(0,10)===key).sort((a,b)=>String(a.publish_at_et).localeCompare(String(b.publish_at_et)));
  const col=document.createElement('div');col.className='bp-week-day';col.innerHTML=`<h3>${escapeHTML(day(d))}</h3><strong>${list.length}</strong><small> scheduled</small>`;
  if(!list.length){const e=document.createElement('div');e.className='bp-week-empty';e.textContent='No posts planned';col.append(e);}
  for(const p of list.slice(0,8)){const e=document.createElement('div');e.className='bp-week-entry';e.innerHTML=`<b>${escapeHTML(p.title||'Untitled')}</b><small>${escapeHTML(p.organization_slug||'')} · ${escapeHTML(p.approval||'Draft')}</small><small>${escapeHTML(String(p.publish_at_et||'').slice(11,16))} ET · ${escapeHTML(p.platform||'')}</small>`;col.append(e);}
  if(list.length>8){const more=document.createElement('div');more.className='bp-week-empty';more.textContent=`+${list.length-8} more posts`;col.append(more);}
  grid.append(col);
 }
}
async function refresh(){if(loading||$('app')?.hidden)return;loading=true;const current=++sequence;const status=panel.querySelector('.bp-week-message');status.textContent='Loading schedule…';status.classList.remove('bp-week-error');
 try{const {data:{session}}=await db.auth.getSession();if(!session)throw Error('Sign in to view your weekly planner.');const response=await fetch(BASE+'/functions/v1/blueprint-social',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'bootstrap'})});const result=await response.json();if(!response.ok||result.error)throw Error(result.error||'Could not retrieve posts');if(current!==sequence)return;posts=Array.isArray(result.posts)?result.posts:[];status.textContent='Times shown in Eastern Time. The planner is read-only.';render();}catch(e){status.textContent=e.message||'Unable to load';status.classList.add('bp-week-error');}finally{loading=false;}}
function init(){if(initialized)return;const desk=$('desk'),app=$('app');if(!desk||!app)return;initialized=true;
 panel.addEventListener('click',e=>{const action=e.target.closest('[data-week]')?.dataset.week;if(!action)return;if(action==='refresh'){refresh();return;}if(action==='today')week=monday(easternToday());else{week=new Date(week);week.setUTCDate(week.getUTCDate()+(action==='next'?7:-7));}render();});
 $('orgFilter')?.addEventListener('change',render);$('refresh')?.addEventListener('click',()=>setTimeout(refresh,250));$('signOut')?.addEventListener('click',()=>{posts=[];panel.hidden=true;});
 document.addEventListener('click',e=>{if(e.target.closest('#navSchedule'))setTimeout(()=>{render();refresh();},0);else if(e.target.closest('#navCampaigns,#navLibrary,#navAdmin'))setTimeout(render,0);});
 new MutationObserver(()=>{if(!app.hidden)refresh();else panel.hidden=true;}).observe(app,{attributes:true,attributeFilter:['hidden']});new MutationObserver(render).observe(desk,{attributes:true,attributeFilter:['hidden']});render();if(!app.hidden)refresh();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
