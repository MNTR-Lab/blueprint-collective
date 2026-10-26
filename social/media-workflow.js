// Blueprint Collective Social Studio — media upload interface V9
// Complete replacement. Loaded after studio.js.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const BASE='https://lbheezjanvalalinqxcd.supabase.co';
const KEY='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const auth=createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const API=BASE+'/functions/v1/blueprint-social';
const MAX=20*1024*1024;
const TYPES=new Set(['image/png','image/jpeg','image/webp','image/gif']);
const css=document.createElement('style');
css.textContent=`.media-upload-box{border-top:1px solid #e1e7f0;margin-top:15px;padding-top:13px}.media-upload-box .media-title{font-size:12px;font-weight:800;color:#26364f;margin-bottom:4px}.media-upload-box .media-hint{font-size:11px;color:#64748b;margin:0 0 10px}.media-upload-box .media-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.media-upload-box input[type=file]{max-width:100%;font-size:12px}.media-upload-box button{border:1px solid #cad5e5;background:#fff;border-radius:7px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer}.media-upload-box button:disabled{opacity:.5;cursor:wait}.media-upload-box .media-message{font-size:12px;color:#52627b;margin:9px 0 0;white-space:pre-wrap}.media-upload-box .media-message.error{color:#b42318}.media-upload-box .media-preview{display:flex;gap:9px;flex-wrap:wrap;margin-top:10px}.media-upload-box .media-preview figure{margin:0;width:110px}.media-upload-box .media-preview img{width:110px;height:82px;object-fit:cover;border:1px solid #dbe3ee;border-radius:7px}.media-upload-box .media-preview figcaption{font-size:10px;overflow-wrap:anywhere;color:#52627b}.media-upload-box .media-org{font-size:11px;color:#64748b;margin:6px 0}.media-upload-box progress{width:100%;height:5px;margin-top:9px}`;
document.head.append(css);
const clean=s=>String(s||'').trim().toLowerCase();
function resolveOrg(card){
 const select=document.getElementById('orgFilter');
 if(!select)return null;
 const options=[...select.options].filter(o=>o.value);
 const badges=[...card.querySelectorAll('.badges .badge')].map(e=>clean(e.textContent));
 const matches=options.filter(o=>badges.includes(clean(o.textContent))||badges.includes(clean(o.value)));
 if(matches.length===1)return matches[0];
 // A selected filter is safe only if its organization is also visible on the card.
 if(select.value&&matches.some(o=>o.value===select.value))return matches.find(o=>o.value===select.value);
 return null;
}
function decorate(){
 const app=document.getElementById('app');
 if(!app||app.hidden)return;
 const badge=document.getElementById('accessBadge');
 if(!badge||!badge.textContent.includes('MASTER'))return;
 document.querySelectorAll('#cards article[data-post]').forEach(card=>{
  if(card.querySelector('.media-upload-box')||!/^[0-9]+$/.test(card.dataset.post||''))return;
  const box=document.createElement('section');box.className='media-upload-box';
  box.innerHTML='<div class="media-title">Post Media</div><p class="media-hint">Upload PNG, JPG, WebP or GIF images (20 MB max each). Files attach to this specific Monday post.</p><div class="media-org"></div><div class="media-controls"><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple aria-label="Choose images for this post"><button type="button">Upload images</button></div><progress max="100" value="0" hidden></progress><p class="media-message" role="status">Select images to preview before uploading.</p><div class="media-preview"></div>';
  (card.querySelector('.post-content')||card).append(box);
  const input=box.querySelector('input'),button=box.querySelector('button'),message=box.querySelector('.media-message'),preview=box.querySelector('.media-preview'),progress=box.querySelector('progress'),orgLine=box.querySelector('.media-org');
  let busy=false;
  const setMessage=(msg,error=false)=>{message.textContent=msg;message.classList.toggle('error',error)};
  const updateOrg=()=>{const org=resolveOrg(card);orgLine.textContent=org?'Organization: '+org.textContent.trim():'Organization could not be verified. Filter to the correct client and refresh.';button.disabled=busy||!org||!input.files.length;};
  input.addEventListener('change',()=>{
   preview.replaceChildren();
   const files=[...input.files];
   for(const file of files){
    const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');
    const url=URL.createObjectURL(file);img.src=url;img.alt=file.name;img.onload=()=>URL.revokeObjectURL(url);img.onerror=()=>URL.revokeObjectURL(url);
    caption.textContent=file.name;figure.append(img,caption);preview.append(figure);
   }
   const bad=files.find(f=>!TYPES.has(f.type)||!f.size||f.size>MAX);
   setMessage(bad?'Unsupported file or over 20 MB: '+bad.name:files.length?files.length+' image(s) ready to upload.':'Select images to preview before uploading.',!!bad);
   updateOrg();
  });
  button.addEventListener('click',async()=>{
   if(busy)return;
   const org=resolveOrg(card),files=[...input.files];
   if(!org){setMessage('Cannot verify this post’s organization. Choose its organization in the filter and refresh.',true);return;}
   if(!files.length){setMessage('Choose an image first.',true);return;}
   const bad=files.find(f=>!TYPES.has(f.type)||!f.size||f.size>MAX);
   if(bad){setMessage('Unsupported file or over 20 MB: '+bad.name,true);return;}
   busy=true;button.disabled=true;input.disabled=true;progress.hidden=false;progress.value=0;
   let uploaded=0;
   try{
    const {data:{session},error}=await auth.auth.getSession();
    if(error||!session)throw Error('Sign in to Blueprint first.');
    for(const file of files){
     setMessage('Uploading '+(uploaded+1)+' of '+files.length+': '+file.name);
     const form=new FormData();form.append('file',file);form.append('organization_slug',org.value);form.append('monday_id',card.dataset.post);
     const response=await fetch(API,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token},body:form});
     let data;try{data=await response.json()}catch{throw Error('Upload server returned an invalid response.');}
     if(!response.ok||data.error)throw Error(data.error||'Upload failed.');
     uploaded++;progress.value=Math.round(uploaded/files.length*100);
    }
    input.value='';setMessage('✓ '+uploaded+' image(s) attached to this Monday post. Refresh to see updated assets.');
   }catch(e){setMessage('Uploaded '+uploaded+' of '+files.length+'. '+(e.message||'Upload failed.'),true);}
   finally{busy=false;input.disabled=false;progress.hidden=true;updateOrg();}
  });
  updateOrg();
 });
}
let scheduled=false;
const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate()})};
new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
document.getElementById('orgFilter')?.addEventListener('change',schedule);
schedule();
