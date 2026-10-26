// Blueprint Social Studio V28 — read-only schedule health report.
// Past scheduled dates are NOT proof of failed publication; verify in destination platform.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const BASE='https://lbheezjanvalalinqxcd.supabase.co';
const KEY='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const db=createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style=document.createElement('style');style.textContent=`
.bp-health[hidden]{display:none!important}.bp-health{margin:16px 0 22px;padding:18px;background:#fff;border:1px solid #dce5f0;border-radius:16px}
.bp-health h2{font-size:17px;color:#173657;margin:0}.bp-health p{font-size:12px;color:#647b96;margin:6px 0 12px}
.bp-health-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.bp-health button{background:#fff;border:1px solid #cbd9eb;color:#24548f;border-radius:9px;padding:8px 11px;cursor:pointer;font-weight:750}
.bp-health-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:12px 0}.bp-health-stat{padding:12px;background:#f7faff;border:1px solid #e0e9f4;border-radius:11px}.bp-health-stat b{display:block;font-size:23px;color:#173657}.bp-health-stat span{font-size:11px;color:#617b98}
.bp-health-list{display:grid;gap:7px}.bp-health-item{padding:10px 12px;border:1px solid #e0e9f4;border-radius:10px;background:#fbfcff;display:flex;justify-content:space-between;gap:12px;align-items:center}.bp-health-item b{font-size:12px;color:#173657}.bp-health-item small{display:block;color:#667d97;font-size:11px;margin-top:4px}.bp-health-tag{font-size:10px;background:#fff1d5;color:#83570a;border-radius:7px;padding:5px 7px;white-space:nowrap}.bp-health-note{font-size:11px;color:#697f9a}.bp-health-status{font-size:11px;color:#697f9a}
@media(max-width:650px){.bp-health-stats{grid-template-columns:1fr 1fr}.bp-health-item{align-items:flex-start;flex-direction:column}}
`;document.head.append(style);
const panel=document.createElement('section');panel.className='bp-health';panel.hidden=true;
panel.innerHTML=`<div class="bp-health-top"><div><h2>Content schedule health</h2><p>Review the next 14 days and check recently scheduled posts.</p></div><button type="button" class="bp-health-refresh">↻ Refresh</button></div><div class="bp-health-stats"></div><div class="bp-health-list"></div><p class="bp-health-status" role="status"></p><p class="bp-health-note">Past scheduled dates do not establish whether a post was published. Confirm delivery in the destination platform.</p>`;
let posts=[],loading=false,seq=0;
function etToday(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const obj=Object.fromEntries(parts.map(p=>[p.type,p.value]));return `${obj.year}-${obj.month}-${obj.day}`;}
function dateShift(key,offset){const d=new Date(key+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
function relevant(p){const org=$('orgFilter')?.value||'';return !p.archived&&(!org||p.organization_slug===org||(Array.isArray(p.audience)&&p.audience.includes(org)));}
function render(){
 const desk=$('desk'),app=$('app');if(!desk||!app||app.hidden||desk.hidden){panel.hidden=true;return;}
 if(!panel.isConnected){const anchor=desk.querySelector('.section-top');anchor?anchor.before(panel):desk.prepend(panel);}panel.hidden=false;
 const today=etToday(),end=dateShift(today,13),recent=dateShift(today,-7);
 const scoped=posts.filter(relevant),upcoming=scoped.filter(p=>{const d=String(p.publish_at_et||'').slice(0,10);return d>=today&&d<=end;});
 const days=new Set(upcoming.map(p=>String(p.publish_at_et||'').slice(0,10)));
 const gaps=Array.from({length:14},(_,i)=>dateShift(today,i)).filter(d=>!days.has(d));
 const pending=upcoming.filter(p=>p.approval!=='Approved');
 const past=scoped.filter(p=>{const d=String(p.publish_at_et||'').slice(0,10);return d>=recent&&d<today;});
 panel.querySelector('.bp-health-stats').innerHTML=`<div class="bp-health-stat"><b>${gaps.length}</b><span>Days with no posts (next 14)</span></div><div class="bp-health-stat"><b>${pending.length}</b><span>Upcoming posts not approved</span></div><div class="bp-health-stat"><b>${past.length}</b><span>Past scheduled posts to verify</span></div>`;
 const issues=[...pending.map(p=>({title:p.title||'Untitled post',detail:`${p.organization_slug||'Organization'} · ${p.platform||'Platform'} · ${p.publish_at_et||'Unscheduled'}`,tag:p.approval||'Not approved'})),...gaps.slice(0,7).map(d=>({title:`No content scheduled — ${d}`,detail:'Check whether this date needs a post.',tag:'Coverage gap'})),...past.slice(0,7).map(p=>({title:p.title||'Untitled post',detail:`${p.organization_slug||'Organization'} · Scheduled ${p.publish_at_et||''}`,tag:'Verify delivery'}))];
 panel.querySelector('.bp-health-list').innerHTML=issues.length?issues.slice(0,25).map(x=>`<div class="bp-health-item"><div><b>${esc(x.title)}</b><small>${esc(x.detail)}</small></div><span class="bp-health-tag">${esc(x.tag)}</span></div>`).join(''):'<p class="bp-health-note">No issues identified in this view.</p>';
 panel.querySelector('.bp-health-status').textContent=`${upcoming.length} upcoming posts reviewed · Organization filter applies · Updated ${new Date().toLocaleTimeString()}`;
}
async function refresh(){if(loading||$('app')?.hidden)return;loading=true;const id=++seq;panel.querySelector('.bp-health-status').textContent='Loading schedule health…';
 try{const {data:{session}}=await db.auth.getSession();if(!session)throw Error('Please sign in to view this report.');
 const response=await fetch(BASE+'/functions/v1/blueprint-social',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'bootstrap'})});const data=await response.json();if(!response.ok||data.error)throw Error(data.error||'Unable to load posts.');if(id!==seq)return;posts=Array.isArray(data.posts)?data.posts:[];render();
 }catch(e){panel.querySelector('.bp-health-status').textContent=e.message||'Unable to load report.';}finally{loading=false;}}
function init(){const desk=$('desk'),app=$('app');if(!desk||!app)return;
 panel.querySelector('.bp-health-refresh').addEventListener('click',refresh);$('orgFilter')?.addEventListener('change',render);$('refresh')?.addEventListener('click',()=>setTimeout(refresh,250));$('signOut')?.addEventListener('click',()=>{posts=[];panel.hidden=true;});
 new MutationObserver(()=>{if(!app.hidden)refresh();else panel.hidden=true;}).observe(app,{attributes:true,attributeFilter:['hidden']});new MutationObserver(render).observe(desk,{attributes:true,attributeFilter:['hidden']});render();if(!app.hidden)refresh();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
