// Blueprint Social Studio V21 — Content Finder. Read-only authenticated search.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const BASE='https://lbheezjanvalalinqxcd.supabase.co';
const KEY='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const db=createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const css=document.createElement('style');css.textContent=`
.bp-finder[hidden]{display:none!important}.bp-finder{margin:16px 0 20px;padding:19px;border:1px solid #dce6f3;border-radius:16px;background:#fff;box-shadow:0 7px 22px #10294a0b}
.bp-finder h2{font-size:17px;margin:0;color:#173657}.bp-finder p{font-size:12px;color:#627991;margin:5px 0 12px}
.bp-finder-controls{display:flex;gap:9px;flex-wrap:wrap;align-items:center}.bp-finder-controls input{flex:1;min-width:190px;padding:11px;border:1px solid #cbd9eb;border-radius:9px}.bp-finder-controls select,.bp-finder-controls button{padding:10px;border:1px solid #cbd9eb;border-radius:9px;background:#fff;color:#24548f;font-weight:700}
.bp-finder-controls button{cursor:pointer}.bp-finder-results{display:grid;gap:8px;margin-top:13px;max-height:420px;overflow:auto}
.bp-finder-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border:1px solid #e0e8f2;border-radius:11px;padding:12px;background:#fbfdff}
.bp-finder-row strong{font-size:13px;color:#1b385a}.bp-finder-row small{display:block;font-size:11px;color:#607a99;margin-top:5px}.bp-finder-row button{border:1px solid #cbd9eb;background:#edf4ff;border-radius:9px;padding:8px 11px;color:#235c9e;font-weight:750;cursor:pointer}
.bp-finder-status{font-size:11px;color:#607a99;margin-top:9px}.bp-finder-error{color:#b42318!important}
`;document.head.append(css);
const panel=document.createElement('section');panel.className='bp-finder';panel.hidden=true;panel.innerHTML=`<h2>Find content across your workspace</h2><p>Search authorized posts across dates, captions, platforms and organizations. Results are read-only.</p><div class="bp-finder-controls"><input id="bp-finder-query" type="search" placeholder="Search title, caption, platform…" aria-label="Search all authorized content"><select id="bp-finder-status" aria-label="Approval status"><option value="">All statuses</option><option>Draft</option><option>Pending Review</option><option>Approved</option></select><button type="button" id="bp-finder-refresh">↻ Refresh</button></div><div class="bp-finder-results" aria-live="polite"></div><div class="bp-finder-status" role="status"></div>`;
let records=[],loading=false,initialized=false,token=0,debounce;
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function paint(){
 const desk=$('desk');if(!desk||$('app')?.hidden||desk.hidden){panel.hidden=true;return;}
 if(!panel.isConnected){const anchor=desk.querySelector('.section-top');anchor?anchor.before(panel):desk.prepend(panel);}
 panel.hidden=false;
 const org=$('orgFilter')?.value||'',query=$('bp-finder-query').value.trim().toLowerCase(),status=$('bp-finder-status').value;
 const matches=records.filter(p=>{
  if(org&&p.organization_slug!==org&&!(Array.isArray(p.audience)&&p.audience.includes(org)))return false;
  if(status&&p.approval!==status)return false;
  if(!query)return true;
  return [p.title,p.caption,p.organization_slug,p.platform,p.approval,p.publish_at_et].some(v=>String(v??'').toLowerCase().includes(query));
 }).sort((a,b)=>String(b.publish_at_et||'').localeCompare(String(a.publish_at_et||'')));
 panel.querySelector('.bp-finder-results').innerHTML=matches.slice(0,40).map(p=>`<div class="bp-finder-row"><div><strong>${escapeHtml(p.title||'Untitled post')}</strong><small>${escapeHtml(p.organization_slug)} · ${escapeHtml(p.approval)} · ${escapeHtml(p.platform)} · ${escapeHtml(p.publish_at_et||'No date')} ET${p.archived?' · Archived':''}</small></div><button type="button" data-find-id="${escapeHtml(p.monday_id)}">Find on desk ↗</button></div>`).join('')||'<p>No posts match these filters.</p>';
 const msg=panel.querySelector('.bp-finder-status');if(!msg.classList.contains('bp-finder-error'))msg.textContent=`${matches.length} matching post${matches.length===1?'':'s'}${matches.length>40?' · Showing first 40':''}.`;
}
async function refresh(){
 if(loading||$('app')?.hidden)return;loading=true;const current=++token;
 const msg=panel.querySelector('.bp-finder-status');msg.classList.remove('bp-finder-error');msg.textContent='Loading authorized content…';
 try{
  const {data:{session}}=await db.auth.getSession();if(!session)throw Error('Sign in to search your workspace.');
  const response=await fetch(BASE+'/functions/v1/blueprint-social',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'bootstrap'})});
  const data=await response.json();if(!response.ok||data.error)throw Error(data.error||'Unable to load content.');
  if(current!==token)return;records=Array.isArray(data.posts)?data.posts:[];paint();
 }catch(error){msg.textContent=error.message||'Search unavailable';msg.classList.add('bp-finder-error');}
 finally{loading=false;}
}
function init(){
 if(initialized)return;const desk=$('desk'),app=$('app');if(!desk||!app)return;initialized=true;
 $('bp-finder-query').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(paint,120);});
 $('bp-finder-status').addEventListener('change',paint);
 $('bp-finder-refresh').addEventListener('click',refresh);
 $('orgFilter')?.addEventListener('change',paint);
 $('refresh')?.addEventListener('click',()=>setTimeout(refresh,300));
 $('signOut')?.addEventListener('click',()=>{records=[];token++;panel.hidden=true;});
 panel.querySelector('.bp-finder-results').addEventListener('click',event=>{
  const btn=event.target.closest('[data-find-id]');if(!btn)return;
  const post=records.find(p=>String(p.monday_id)===btn.dataset.findId);if(!post)return;
  const all=desk.querySelector('[data-view="all"]');if(all)all.click();
  const search=$('search');if(search){search.value=post.title||'';search.dispatchEvent(new Event('input',{bubbles:true}));}
  const msg=panel.querySelector('.bp-finder-status');msg.classList.remove('bp-finder-error');msg.textContent='Showing matching title in Publishing Desk. Archived or unpublished items may require their dedicated view.';
 });
 document.addEventListener('click',e=>{if(e.target.closest('#navSchedule'))setTimeout(()=>{paint();refresh();},0);else if(e.target.closest('#navCampaigns,#navLibrary,#navAdmin'))setTimeout(paint,0);});
 new MutationObserver(()=>{if(app.hidden){records=[];token++;panel.hidden=true;}else refresh();}).observe(app,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(paint).observe(desk,{attributes:true,attributeFilter:['hidden']});
 paint();if(!app.hidden)refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
