// Blueprint Social Studio V27 — authenticated, read-only weekly briefing.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const BASE='https://lbheezjanvalalinqxcd.supabase.co';
const KEY='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const db=createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style=document.createElement('style');style.textContent=`
.bp-brief[hidden]{display:none!important}.bp-brief{background:#fff;border:1px solid #dce5f0;border-radius:16px;padding:18px;margin:16px 0 22px}
.bp-brief h2{margin:0;color:#173657;font-size:17px}.bp-brief p{font-size:12px;color:#637995}.bp-brief-top{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}
.bp-brief-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.bp-brief button{border:1px solid #cbd9eb;border-radius:9px;background:#fff;padding:8px 11px;color:#24548f;font-weight:750;cursor:pointer}
.bp-brief-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}.bp-brief-card{background:#f7faff;border:1px solid #e0e9f4;border-radius:10px;padding:12px}.bp-brief-card b{display:block;font-size:22px;color:#173657}.bp-brief-card span{font-size:11px;color:#627b96}
.bp-brief-table{width:100%;border-collapse:collapse;font-size:12px}.bp-brief-table th,.bp-brief-table td{padding:9px 7px;text-align:left;border-bottom:1px solid #e7edf5;vertical-align:top;overflow-wrap:anywhere}.bp-brief-table th{color:#46627f;background:#f7faff}.bp-brief-empty{color:#8291a5;font-size:12px}.bp-brief-status{font-size:11px;color:#657b95}
@media(max-width:680px){.bp-brief-cards{grid-template-columns:1fr 1fr}.bp-brief-table{font-size:10px}}
@media print{body.bp-print-brief *{visibility:hidden!important}body.bp-print-brief .bp-brief,body.bp-print-brief .bp-brief *{visibility:visible!important}body.bp-print-brief .bp-brief{position:absolute;left:0;top:0;width:100%;border:0;box-shadow:none}body.bp-print-brief .bp-brief-actions{display:none!important}}
`;document.head.append(style);
const panel=document.createElement('section');panel.className='bp-brief';panel.hidden=true;
panel.innerHTML=`<div class="bp-brief-top"><div><h2>Weekly team briefing</h2><p>Scheduled content, approvals and open calendar days for your team.</p></div><div class="bp-brief-actions"><button data-action="prev" type="button">← Previous</button><strong class="bp-brief-range"></strong><button data-action="next" type="button">Next →</button><button data-action="current" type="button">This week</button><button data-action="refresh" type="button">↻ Refresh</button><button data-action="print" type="button">Print briefing</button></div></div><div class="bp-brief-cards"></div><div class="bp-brief-results"></div><p class="bp-brief-status" role="status"></p>`;
let posts=[],busy=false,initialized=false,weekOffset=0;
function etToday(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).reduce((o,p)=>(o[p.type]=p.value,o),{});return new Date(Date.UTC(+parts.year,+parts.month-1,+parts.day,12));}
function monday(){const d=etToday();d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7)+7*weekOffset);return d;}
function iso(d){return d.toISOString().slice(0,10)}
function display(d){return new Intl.DateTimeFormat('en-US',{timeZone:'UTC',month:'short',day:'numeric'}).format(d)}
function dateOf(p){return String(p.publish_at_et||'').match(/^\d{4}-\d{2}-\d{2}/)?.[0]||''}
function scope(p){const org=$('orgFilter')?.value||'';return !p.archived&&(!org||p.organization_slug===org||(Array.isArray(p.audience)&&p.audience.includes(org)))}
function draw(){
 const desk=$('desk'),app=$('app');if(!desk||!app||app.hidden||desk.hidden){panel.hidden=true;return;}
 if(!panel.isConnected){const anchor=desk.querySelector('.section-top');anchor?anchor.before(panel):desk.prepend(panel)}panel.hidden=false;
 const start=monday(),end=new Date(start);end.setUTCDate(start.getUTCDate()+6);
 panel.querySelector('.bp-brief-range').textContent=display(start)+' – '+display(end);
 const from=iso(start),to=iso(end),rows=posts.filter(p=>scope(p)&&dateOf(p)>=from&&dateOf(p)<=to).sort((a,b)=>String(a.publish_at_et||'').localeCompare(String(b.publish_at_et||'')));
 const active=new Set(rows.map(dateOf));const pending=rows.filter(p=>p.approval!=='Approved').length;
 panel.querySelector('.bp-brief-cards').innerHTML=`<div class="bp-brief-card"><b>${rows.length}</b><span>Scheduled posts</span></div><div class="bp-brief-card"><b>${pending}</b><span>Not yet approved</span></div><div class="bp-brief-card"><b>${7-active.size}</b><span>Days without posts</span></div>`;
 const results=panel.querySelector('.bp-brief-results');
 if(!rows.length){results.innerHTML='<p class="bp-brief-empty">No posts scheduled for this week in the selected organization.</p>';return;}
 results.innerHTML=`<div style="overflow-x:auto"><table class="bp-brief-table"><thead><tr><th>Date (ET)</th><th>Post</th><th>Organization</th><th>Platform</th><th>Approval</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${esc(p.publish_at_et||'Unscheduled')}</td><td>${esc(p.title||'Untitled')}</td><td>${esc(p.organization_slug||'—')}</td><td>${esc(Array.isArray(p.platform)?p.platform.join(', '):p.platform||'—')}</td><td>${esc(p.approval||'—')}</td></tr>`).join('')}</tbody></table></div>`;
 panel.querySelector('.bp-brief-status').textContent='Read-only briefing · Data reflects the signed-in user’s access.';
}
async function refresh(){if(busy||$('app')?.hidden)return;busy=true;panel.querySelector('.bp-brief-status').textContent='Loading briefing…';try{
 const {data:{session}}=await db.auth.getSession();if(!session)throw Error('Sign in to load the briefing.');
 const response=await fetch(BASE+'/functions/v1/blueprint-social',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'bootstrap'})});
 const data=await response.json();if(!response.ok||data.error)throw Error(data.error||'Unable to retrieve content.');posts=Array.isArray(data.posts)?data.posts:[];draw();
 }catch(e){panel.querySelector('.bp-brief-status').textContent=e.message||'Unable to load briefing.'}finally{busy=false}}
function init(){if(initialized)return;const desk=$('desk'),app=$('app');if(!desk||!app)return;initialized=true;
 panel.addEventListener('click',e=>{const a=e.target.closest('[data-action]')?.dataset.action;if(!a)return;if(a==='print'){document.body.classList.add('bp-print-brief');const clear=()=>document.body.classList.remove('bp-print-brief');window.addEventListener('afterprint',clear,{once:true});window.print();setTimeout(clear,1500);return;}if(a==='refresh'){refresh();return;}if(a==='current')weekOffset=0;else weekOffset+=a==='next'?1:-1;draw();});
 $('orgFilter')?.addEventListener('change',draw);$('signOut')?.addEventListener('click',()=>{posts=[];panel.hidden=true});
 new MutationObserver(()=>{if(!app.hidden)refresh();else panel.hidden=true}).observe(app,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(draw).observe(desk,{attributes:true,attributeFilter:['hidden']});draw();if(!app.hidden)refresh();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
