// Blueprint Social Studio V10 — complete replacement, loaded after studio.js
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const BASE='https://lbheezjanvalalinqxcd.supabase.co';
const KEY='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const auth=createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const UPLOAD=BASE+'/functions/v1/blueprint-social';
const LIST=BASE+'/functions/v1/blueprint-social-media';
const MAX=20*1024*1024;
const TYPES=new Set(['image/png','image/jpeg','image/webp','image/gif']);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL=s=>{try{const u=new URL(String(s));return u.protocol==='https:'?u.href:''}catch{return ''}};
const css=document.createElement('style');
css.textContent=`
.media-upload-box{margin:18px 0 2px;padding:0;border:1px solid #dce5f1;border-radius:15px;background:linear-gradient(145deg,#fff,#f7faff);overflow:hidden;box-shadow:0 5px 16px rgba(16,37,70,.045);font-family:inherit}
.media-upload-box *{box-sizing:border-box}.media-upload-box .media-bar{padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;background:#f2f6fd;border-bottom:1px solid #e2e9f3}
.media-upload-box .media-heading{font-size:13px;font-weight:800;color:#172b4d}.media-upload-box .media-sub{font-size:11px;color:#64748b;margin:3px 0 0}
.media-upload-box .media-pill{font-size:10px;font-weight:800;background:#e4eeff;color:#2855a1;border-radius:30px;padding:5px 9px;white-space:nowrap}
.media-upload-box .media-inner{padding:15px}.media-upload-box .media-section-title{display:flex;justify-content:space-between;gap:10px;align-items:center;margin:0 0 10px;font-size:11px;font-weight:800;color:#33455f;text-transform:uppercase;letter-spacing:.06em}
.media-upload-box .media-refresh{border:0;background:transparent;color:#2859df;font-size:11px;font-weight:800;cursor:pointer;padding:3px}
.media-upload-box .media-existing,.media-upload-box .media-preview{display:grid;grid-template-columns:repeat(auto-fill,minmax(105px,1fr));gap:9px}
.media-upload-box .media-tile{border:1px solid #e1e8f2;border-radius:10px;overflow:hidden;background:white;margin:0;min-width:0;text-decoration:none;color:#334155;display:block}
.media-upload-box .media-tile img{display:block;width:100%;height:92px;object-fit:cover;background:#e9eef6}.media-upload-box .media-tile .media-placeholder{height:92px;display:grid;place-items:center;background:#e9eef6;font-size:27px;color:#63748d}
.media-upload-box .media-tile figcaption,.media-upload-box .media-tile .media-caption{display:block;padding:7px;font-size:10px;line-height:1.35;overflow-wrap:anywhere;color:#52627b}
.media-upload-box .media-empty{font-size:12px;color:#7b8aa1;margin:0 0 12px}.media-upload-box .media-divider{border:0;border-top:1px solid #e3eaf4;margin:14px 0}
.media-upload-box .media-drop{display:block;border:1.5px dashed #b8c9e2;border-radius:11px;background:#f7faff;padding:17px 13px;text-align:center;cursor:pointer;transition:.15s}.media-upload-box .media-drop:hover,.media-upload-box .media-drop.dragging{background:#eaf2ff;border-color:#3970d5}
.media-upload-box .media-drop strong{display:block;font-size:12px;color:#234579}.media-upload-box .media-drop span{display:block;font-size:11px;color:#75849b;margin-top:5px}.media-upload-box .media-drop input{position:absolute;opacity:0;width:1px;height:1px}
.media-upload-box .media-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;flex-wrap:wrap}.media-upload-box .media-org{font-size:11px;color:#63748d;flex:1}
.media-upload-box .media-upload-btn{border:0;border-radius:9px;background:#2458ce;color:white;font-size:12px;font-weight:800;padding:10px 14px;cursor:pointer;box-shadow:0 3px 9px rgba(36,88,206,.15)}.media-upload-box .media-upload-btn:disabled{opacity:.45;cursor:not-allowed}
.media-upload-box .media-message{font-size:11px;color:#52627b;line-height:1.45;margin:10px 0 0}.media-upload-box .media-message.error{color:#b42318}.media-upload-box progress{width:100%;height:6px;margin-top:10px;accent-color:#2458ce}
.media-upload-box .media-preview{margin-top:10px}.media-upload-box .media-preview:empty{display:none}@media(max-width:600px){.media-upload-box .media-inner{padding:12px}.media-upload-box .media-bar{padding:12px}}
`;
document.head.append(css);
const clean=s=>String(s||'').trim().toLowerCase();
function resolveOrg(card){
 const select=document.getElementById('orgFilter');if(!select)return null;
 const options=[...select.options].filter(o=>o.value);
 const badges=[...card.querySelectorAll('.badges .badge')].map(e=>clean(e.textContent));
 const matches=options.filter(o=>badges.includes(clean(o.textContent))||badges.includes(clean(o.value)));
 if(matches.length!==1)return null;
 return matches[0];
}
const boxes=new Map();let refreshTimer=null;let requestSequence=0;
function setMessage(box,text,error=false){const el=box.querySelector('.media-message');el.textContent=text;el.classList.toggle('error',error)}
function showExisting(box,assets){
 const holder=box.querySelector('.media-existing');holder.replaceChildren();
 const pill=box.querySelector('.media-pill');pill.textContent=assets.length+' attached';
 box.querySelector('.media-empty').hidden=assets.length>0;
 for(const asset of assets){
  const a=document.createElement(asset.url?'a':'div');a.className='media-tile';
  if(asset.url){a.href=safeURL(asset.url);a.target='_blank';a.rel='noopener noreferrer'}
  const imgOK=['png','jpg','jpeg','webp','gif'].includes(asset.extension)&&safeURL(asset.url);
  if(imgOK){const img=document.createElement('img');img.src=safeURL(asset.url);img.alt=asset.name;img.loading='lazy';a.append(img)}
  else{const icon=document.createElement('div');icon.className='media-placeholder';icon.textContent='▧';a.append(icon)}
  const label=document.createElement('span');label.className='media-caption';label.textContent=asset.name;a.append(label);holder.append(a);
 }
}
async function loadExisting(){
 const current=[...boxes.entries()].filter(([id,box])=>box.isConnected).slice(0,80);
 if(!current.length)return;
 const sequence=++requestSequence;
 try{
  const {data:{session}}=await auth.auth.getSession();if(!session)return;
  const response=await fetch(LIST,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({ids:current.map(([id])=>id)})});
  const data=await response.json();if(!response.ok)throw Error(data.error||'Could not load media');
  if(sequence!==requestSequence)return;
  for(const [id,box] of current)if(box.isConnected)showExisting(box,data.assets?.[id]||[]);
 }catch(e){for(const [,box] of current)if(box.isConnected)box.querySelector('.media-empty').textContent='Existing attachments unavailable: '+e.message;}
}
function scheduleExisting(){clearTimeout(refreshTimer);refreshTimer=setTimeout(loadExisting,550)}
function decorate(){
 const app=document.getElementById('app');if(!app||app.hidden)return;
 if(!document.getElementById('accessBadge')?.textContent.includes('MASTER'))return;
 let added=false;
 document.querySelectorAll('#cards article[data-post]').forEach(card=>{
  const id=card.dataset.post;if(!/^\d+$/.test(id||'')||card.querySelector('.media-upload-box'))return;
  const box=document.createElement('section');box.className='media-upload-box';
  box.innerHTML=`<div class="media-bar"><div><div class="media-heading">Artwork & attachments</div><p class="media-sub">Files connected to this scheduled post</p></div><span class="media-pill">Loading…</span></div><div class="media-inner"><div class="media-section-title"><span>Attached in Monday</span><button type="button" class="media-refresh">↻ Refresh</button></div><p class="media-empty">Loading attached files…</p><div class="media-existing"></div><hr class="media-divider"><div class="media-section-title"><span>Add new images</span></div><label class="media-drop"><strong>＋ Choose images or drag them here</strong><span>PNG, JPG, WebP, GIF · 20 MB per file</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple aria-label="Select images to attach"></label><div class="media-preview"></div><div class="media-actions"><span class="media-org"></span><button type="button" class="media-upload-btn" disabled>Upload to post ↗</button></div><progress max="100" value="0" hidden></progress><p class="media-message" role="status">Files will be attached to this post in Monday.</p></div>`;
  (card.querySelector('.post-content')||card).append(box);boxes.set(id,box);added=true;
  const input=box.querySelector('input'),button=box.querySelector('.media-upload-btn'),preview=box.querySelector('.media-preview'),progress=box.querySelector('progress'),orgLine=box.querySelector('.media-org'),drop=box.querySelector('.media-drop');
  let busy=false;
  const update=()=>{const org=resolveOrg(card);orgLine.textContent=org?'Client: '+org.textContent.trim():'Client not verified — choose this organization in the filter';button.disabled=busy||!org||!input.files.length;};
  input.addEventListener('change',()=>{
   preview.replaceChildren();const files=[...input.files];
   for(const file of files){const figure=document.createElement('figure');figure.className='media-tile';const img=document.createElement('img');const url=URL.createObjectURL(file);img.src=url;img.alt=file.name;img.onload=()=>URL.revokeObjectURL(url);img.onerror=()=>URL.revokeObjectURL(url);const label=document.createElement('figcaption');label.textContent=file.name;figure.append(img,label);preview.append(figure)}
   const bad=files.find(f=>!TYPES.has(f.type)||!f.size||f.size>MAX);
   setMessage(box,bad?'Unsupported image or over 20 MB: '+bad.name:files.length?files.length+' image(s) selected and ready.':'Files will be attached to this post in Monday.',!!bad);update();
  });
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragging')});
  drop.addEventListener('dragleave',()=>drop.classList.remove('dragging'));
  drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragging');if(e.dataTransfer?.files?.length){input.files=e.dataTransfer.files;input.dispatchEvent(new Event('change'))}});
  box.querySelector('.media-refresh').addEventListener('click',loadExisting);
  button.addEventListener('click',async()=>{
   if(busy)return;const org=resolveOrg(card),files=[...input.files];
   if(!org){setMessage(box,'Cannot verify this post’s client. Select its organization in the filter.',true);return}
   if(!files.length)return;
   const bad=files.find(f=>!TYPES.has(f.type)||!f.size||f.size>MAX);if(bad){setMessage(box,'Unsupported image or over 20 MB: '+bad.name,true);return}
   busy=true;input.disabled=true;button.disabled=true;progress.hidden=false;progress.value=0;let uploaded=0;
   try{
    const {data:{session}}=await auth.auth.getSession();if(!session)throw Error('Please sign in again.');
    for(const file of files){setMessage(box,'Uploading '+(uploaded+1)+' of '+files.length+': '+file.name);const form=new FormData();form.append('file',file);form.append('organization_slug',org.value);form.append('monday_id',id);const response=await fetch(UPLOAD,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token},body:form});const data=await response.json();if(!response.ok||data.error)throw Error(data.error||'Upload failed');uploaded++;progress.value=Math.round(uploaded/files.length*100)}
    input.value='';preview.replaceChildren();setMessage(box,'✓ '+uploaded+' image(s) attached successfully.');await loadExisting();
   }catch(e){setMessage(box,'Uploaded '+uploaded+' of '+files.length+'. '+(e.message||'Upload failed'),true)}
   finally{busy=false;input.disabled=false;progress.hidden=true;update()}
  });update();
 });
 for(const [id,box] of boxes)if(!box.isConnected)boxes.delete(id);
 if(added)scheduleExisting();
}
let scheduled=false;const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate()})};
new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
document.getElementById('orgFilter')?.addEventListener('change',schedule);schedule();
