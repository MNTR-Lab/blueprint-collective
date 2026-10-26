// Blueprint Social Studio V19 — authenticated CSV export, no writes.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const BASE='https://lbheezjanvalalinqxcd.supabase.co';
const KEY='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const db=createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
const style=document.createElement('style');style.textContent=`
.bp-export[hidden]{display:none!important}.bp-export{margin:15px 0 20px;padding:17px 19px;border:1px solid #dce6f3;border-radius:16px;background:#fff;box-shadow:0 8px 25px #11264a0a}
.bp-export-header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}.bp-export h2{font-size:16px;margin:0;color:#173657}.bp-export p{font-size:12px;color:#637995;margin:5px 0}
.bp-export-controls{display:flex;align-items:end;gap:9px;flex-wrap:wrap}.bp-export label{display:grid;gap:4px;color:#4e6784;font-size:11px;font-weight:750}.bp-export input,.bp-export select{padding:9px;border:1px solid #d2deec;border-radius:9px;background:white;color:#183858;min-width:130px}
.bp-export button{padding:10px 14px;border:0;border-radius:9px;background:#245fba;color:white;font-weight:800;cursor:pointer}.bp-export button:disabled{opacity:.6;cursor:wait}.bp-export-status{margin-top:10px!important}
`;document.head.append(style);
const panel=document.createElement('section');panel.className='bp-export';panel.hidden=true;panel.innerHTML=`<div class="bp-export-header"><div><h2>Publishing report</h2><p>Export your authorized organization's posts to CSV. No publishing changes are made.</p></div><div class="bp-export-controls"><label>From<input type="date" id="bp-export-from"></label><label>Through<input type="date" id="bp-export-to"></label><label>Approval<select id="bp-export-approval"><option value="">All statuses</option><option>Draft</option><option>Pending Review</option><option>Approved</option></select></label><button type="button" id="bp-export-download">↓ Export CSV</button></div></div><p class="bp-export-status" role="status"></p>`;
let initialized=false,working=false;
const csvCell=v=>'"'+String(v??'').replace(/^[\s]*[=+\-@\t\r]/,match=>"'"+match).replace(/"/g,'""')+'"';
function show(){const desk=$('desk');if(!desk||$('app')?.hidden||desk.hidden){panel.hidden=true;return;}if(!panel.isConnected){const a=desk.querySelector('.section-top');a?a.before(panel):desk.prepend(panel);}panel.hidden=false;}
function localDate(value){if(!value)return '';const s=String(value);const match=s.match(/^\d{4}-\d{2}-\d{2}/);return match?match[0]:'';}
async function exportPosts(){if(working)return;working=true;const btn=$('bp-export-download'),status=panel.querySelector('.bp-export-status');btn.disabled=true;status.textContent='Preparing export…';
 try{
  const from=$('bp-export-from').value,to=$('bp-export-to').value,approval=$('bp-export-approval').value,org=$('orgFilter')?.value||'';
  if(from&&to&&from>to)throw Error('The start date must be on or before the end date.');
  const {data:{session}}=await db.auth.getSession();if(!session)throw Error('Please sign in again to export posts.');
  const response=await fetch(BASE+'/functions/v1/blueprint-social',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({action:'bootstrap'})});
  const data=await response.json();if(!response.ok||data.error)throw Error(data.error||'Unable to retrieve posts.');
  const posts=Array.isArray(data.posts)?data.posts:[];
  const rows=posts.filter(p=>{
   if(p.archived)return false;
   if(org&&p.organization_slug!==org&&!(Array.isArray(p.audience)&&p.audience.includes(org)))return false;
   if(approval&&p.approval!==approval)return false;
   const d=localDate(p.publish_at_et);if(from&&(!d||d<from))return false;if(to&&(!d||d>to))return false;return true;
  }).sort((a,b)=>String(a.publish_at_et||'').localeCompare(String(b.publish_at_et||'')));
  const columns=[['Monday ID','monday_id'],['Title','title'],['Organization','organization_slug'],['Audience','audience'],['Platform','platform'],['Scheduled (ET)','publish_at_et'],['Approval','approval'],['Client Calendar Visible','client_visible'],['Caption','caption']];
  const output=[columns.map(c=>csvCell(c[0])).join(',')];
  for(const p of rows)output.push(columns.map(([,key])=>csvCell(Array.isArray(p[key])?p[key].join('; '):p[key]===true?'Yes':p[key]===false?'No':p[key])).join(','));
  const blob=new Blob(['\uFEFF'+output.join('\r\n')+'\r\n'],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='blueprint-social-'+(org||'all-authorized')+'-'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  status.textContent=`Exported ${rows.length} post${rows.length===1?'':'s'}. The CSV contains only posts returned for your account.`;
 }catch(e){status.textContent=e.message||'Export failed.';}finally{working=false;btn.disabled=false;}
}
function init(){if(initialized)return;initialized=true;$('bp-export-download').addEventListener('click',exportPosts);$('orgFilter')?.addEventListener('change',show);document.addEventListener('click',e=>{if(e.target.closest('#navSchedule,#navCampaigns,#navLibrary,#navAdmin'))setTimeout(show,0);});const app=$('app'),desk=$('desk');if(app)new MutationObserver(show).observe(app,{attributes:true,attributeFilter:['hidden']});if(desk)new MutationObserver(show).observe(desk,{attributes:true,attributeFilter:['hidden']});show();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
