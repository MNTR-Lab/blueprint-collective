// Blueprint Social Studio V26 — authenticated, read-only content coverage summary.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const BASE='https://lbheezjanvalalinqxcd.supabase.co';
const KEY='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const db=createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style=document.createElement('style');style.textContent=`
.bp-coverage[hidden]{display:none!important}.bp-coverage{margin:16px 0 22px;padding:18px;background:#fff;border:1px solid #dce5f0;border-radius:16px}
.bp-coverage-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.bp-coverage h2{margin:0;color:#173657;font-size:17px}.bp-coverage p{color:#657b95;font-size:12px;margin:6px 0 12px}
.bp-coverage button{background:#fff;border:1px solid #cbd9eb;border-radius:9px;padding:8px 11px;color:#24548f;font-weight:750;cursor:pointer}
.bp-coverage-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}.bp-coverage-stat{padding:14px;border:1px solid #e0e9f4;background:#f7faff;border-radius:12px}.bp-coverage-stat b{display:block;color:#173657;font-size:23px}.bp-coverage-stat span{color:#627b96;font-size:11px}
.bp-coverage-columns{display:grid;grid-template-columns:1fr 1fr;gap:15px}.bp-coverage h3{font-size:13px;color:#173657}.bp-coverage-row{display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #edf1f7;font-size:12px;color:#395674}.bp-coverage-status{font-size:11px;color:#627b96}
@media(max-width:680px){.bp-coverage-grid{grid-template-columns:1fr 1fr}.bp-coverage-columns{grid-template-columns:1fr}}
`;document.head.append(style);
const panel=document.createElement('section');panel.className='bp-coverage';panel.hidden=true;
panel.innerHTML='<div class="bp-coverage-head"><div><h2>Content coverage · next 30 days</h2><p>Scheduled content by platform and organization. Use this to identify planning gaps.</p></div><button type="button" class="bp-coverage-refresh">↻ Refresh report</button></div><div class="bp-coverage-grid"></div><div class="bp-coverage-columns"><div><h3>By platform</h3><div class="bp-coverage-platforms"></div></div><div><h3>By organization</h3><div class="bp-coverage-orgs"></div></div></div><p class="bp-coverage-status" role="status"></p>';
let posts=[],busy=false,initialized=false;
function dateKey(d){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d).reduce((a,p)=>(a[p.type]=p.value,a),{});return `${parts.year}-${parts.month}-${parts.day}`;}
function render(){const desk=$('desk');if(!desk||$('app')?.hidden||desk.hidden){panel.hidden=true;return;}if(!panel.isConnected){const anchor=desk.querySelector('.section-top');anchor?anchor.before(panel):desk.prepend(panel);}panel.hidden=false;
 const org=$('orgFilter')?.value||'';const now=new Date();const from=dateKey(now),to=dateKey(new Date(now.getTime()+30*86400000));
 const relevant=posts.filter(p=>{const d=String(p.publish_at_et||'').slice(0,10);return !p.archived&&d>=from&&d<=to&&(!org||p.organization_slug===org||(Array.isArray(p.audience)&&p.audience.includes(org)));});
 const platforms=new Map(),orgs=new Map(),days=new Set();let approved=0;
 for(const p of relevant){const platform=String(p.platform||'Unspecified').trim()||'Unspecified';const organization=String(p.organization_slug||'Unassigned').trim()||'Unassigned';platforms.set(platform,(platforms.get(platform)||0)+1);orgs.set(organization,(orgs.get(organization)||0)+1);days.add(String(p.publish_at_et).slice(0,10));if(p.approval==='Approved')approved++;}
 panel.querySelector('.bp-coverage-grid').innerHTML=`<div class="bp-coverage-stat"><b>${relevant.length}</b><span>Scheduled posts</span></div><div class="bp-coverage-stat"><b>${approved}</b><span>Approved posts</span></div><div class="bp-coverage-stat"><b>${days.size}</b><span>Days with content</span></div>`;
 const rows=m=>[...m.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([label,count])=>`<div class="bp-coverage-row"><span>${esc(label)}</span><strong>${count}</strong></div>`).join('')||'<p>No scheduled content in this range.</p>';
 panel.querySelector('.bp-coverage-platforms').innerHTML=rows(platforms);panel.querySelector('.bp-coverage-orgs').innerHTML=rows(orgs);
 panel.querySelector('.bp-coverage-status').textContent=`${from} through ${to} (Eastern dates) · Based on your authorized posts.`;
}
async function refresh(){if(busy||$('app')?.hidden)return;busy=true;panel.querySelector('.bp-coverage-status').textContent='Loading report…';try{const {data:{session}}=await db.auth.getSession();if(!session)throw Error('Sign in to view the report.');const response=await fetch(BASE+'/functions/v1/blueprint-social',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'bootstrap'})});const data=await response.json();if(!response.ok||data.error)throw Error(data.error||'Could not load content');posts=Array.isArray(data.posts)?data.posts:[];render();}catch(e){panel.querySelector('.bp-coverage-status').textContent=e.message||'Report unavailable.';}finally{busy=false;}}
function init(){if(initialized)return;const desk=$('desk'),app=$('app');if(!desk||!app)return;initialized=true;panel.querySelector('.bp-coverage-refresh').addEventListener('click',refresh);$('orgFilter')?.addEventListener('change',render);$('signOut')?.addEventListener('click',()=>{posts=[];panel.hidden=true;});new MutationObserver(()=>{if(app.hidden){posts=[];panel.hidden=true;}else refresh();}).observe(app,{attributes:true,attributeFilter:['hidden']});new MutationObserver(render).observe(desk,{attributes:true,attributeFilter:['hidden']});render();if(!app.hidden)refresh();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
