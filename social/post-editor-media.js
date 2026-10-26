// Blueprint Social Studio V13 — integrated media upload for Create/Edit Post.
// Load AFTER post-editor.js. The existing editor UI and permissions remain intact.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const BASE='https://lbheezjanvalalinqxcd.supabase.co';
const KEY='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const client=createClient(BASE,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const API=BASE+'/functions/v1/blueprint-social';
const MAX=20*1024*1024;
const ALLOWED=new Set(['image/png','image/jpeg','image/webp','image/gif','video/mp4','application/pdf']);
const css=document.createElement('style');
css.textContent=`
.bp-media-panel{background:#fff;border:1px solid #dce5f1;border-radius:15px;padding:20px;box-shadow:0 5px 20px #142a4a08}
.bp-media-panel h3{font-size:15px;margin:0 0 5px;color:#19365b}.bp-media-panel .bp-media-intro{font-size:12px;color:#63758f;margin:0 0 14px}
.bp-media-drop{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px;min-height:125px;border:2px dashed #b7cbea;border-radius:13px;background:linear-gradient(135deg,#f7faff,#eff6ff);cursor:pointer;text-align:center;padding:16px;color:#274875;transition:.15s}
.bp-media-drop:hover,.bp-media-drop.dragging{border-color:#397be4;background:#eaf3ff}.bp-media-drop strong{font-size:13px}.bp-media-drop small{font-size:11px;color:#667b99}.bp-media-drop input{display:none!important}
.bp-media-files{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;margin-top:12px}.bp-media-file{min-width:0;position:relative;border:1px solid #e0e8f3;border-radius:10px;background:#f8fbff;overflow:hidden}.bp-media-file img{display:block;width:100%;height:88px;object-fit:cover}.bp-media-file .bp-media-icon{height:88px;display:grid;place-items:center;font-size:28px}.bp-media-file span{display:block;font-size:10px;padding:7px;overflow-wrap:anywhere;color:#38506e}.bp-media-file button{position:absolute;right:5px;top:5px;background:#fff;border:1px solid #d5e1f0;border-radius:50%;width:25px;height:25px;cursor:pointer;font-weight:800}
.bp-media-note{font-size:11px;color:#61758e;margin:9px 0 0}.bp-media-note.error{color:#b42318}.bp-media-progress{height:7px;width:100%;accent-color:#2965c7;margin-top:10px}
`;document.head.append(css);
let files=[];let urls=[];let installed=false;let busy=false;
const el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text)x.textContent=text;return x;};
function clearURLs(){for(const u of urls)URL.revokeObjectURL(u);urls=[];}
function setup(){if(installed)return;const form=document.getElementById('bp-form');if(!form)return;installed=true;
 const panel=el('section','bp-media-panel');const heading=el('h3','', '02b · Attach artwork');const intro=el('p','bp-media-intro','Attach artwork while creating or editing. The post is saved first, then files are uploaded directly to its Monday item.');
 const drop=el('label','bp-media-drop');drop.tabIndex=0;drop.setAttribute('role','button');drop.setAttribute('aria-label','Select images, video or PDF files');
 const title=el('strong','','＋ Drop files here or click to browse');const hint=el('small','','PNG, JPG, WebP, GIF, MP4 or PDF · 20 MB each');const input=document.createElement('input');input.type='file';input.multiple=true;input.accept='image/png,image/jpeg,image/webp,image/gif,video/mp4,application/pdf';drop.append(title,hint,input);
 const previews=el('div','bp-media-files');const note=el('p','bp-media-note','No new attachments selected.');note.setAttribute('role','status');const progress=document.createElement('progress');progress.className='bp-media-progress';progress.max=100;progress.value=0;progress.hidden=true;
 panel.append(heading,intro,drop,previews,progress,note);
 const creative=[...form.querySelectorAll('.bp-panel')].find(x=>x.textContent.includes('Creative & caption'));creative?.after(panel);
 function render(){clearURLs();previews.replaceChildren();files.forEach((file,i)=>{const tile=el('div','bp-media-file');if(file.type.startsWith('image/')){const img=document.createElement('img');const u=URL.createObjectURL(file);urls.push(u);img.src=u;img.alt=file.name;tile.append(img);}else tile.append(el('div','bp-media-icon',file.type==='video/mp4'?'🎬':'📄'));tile.append(el('span','',file.name));const remove=el('button','','×');remove.type='button';remove.setAttribute('aria-label','Remove '+file.name);remove.onclick=()=>{files.splice(i,1);render()};tile.append(remove);previews.append(tile);});note.textContent=files.length?`${files.length} file(s) ready to attach when you save.`:'No new attachments selected.';note.classList.remove('error');}
 function add(list){const incoming=[...list];const invalid=incoming.find(f=>!ALLOWED.has(f.type)||!f.size||f.size>MAX);if(invalid){note.textContent='Unsupported file or exceeds 20 MB: '+invalid.name;note.classList.add('error');return;}files.push(...incoming);render();}
 input.onchange=()=>{add(input.files);input.value='';};
 drop.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click();}};
 for(const ev of ['dragenter','dragover'])drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('dragging')});
 for(const ev of ['dragleave','drop'])drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('dragging')});
 drop.addEventListener('drop',e=>add(e.dataTransfer?.files||[]));
 const shell=document.querySelector('.bp-overlay');
 // Keep the exact Monday item ID from the clicked card, not a title lookup.
 // Titles are not unique, and editing the title must not turn an edit into a new post.
 document.addEventListener('click',event=>{
  const edit=event.target.closest('.bp-edit');
  if(edit){const id=edit.closest('article[data-post]')?.dataset.post||'';shell.dataset.editPostId=/^\d+$/.test(id)?id:'';return;}
  if(event.target.closest('#bp-create'))shell.dataset.editPostId='';
 },true);
 const observer=new MutationObserver(()=>{if(!shell.hidden)return;files=[];clearURLs();previews.replaceChildren();note.textContent='No new attachments selected.';progress.hidden=true;});observer.observe(shell,{attributes:true,attributeFilter:['hidden']});
 // Capture the submit BEFORE V11's bubble listener; replace only the save flow.
 form.addEventListener('submit',async e=>{e.preventDefault();e.stopImmediatePropagation();if(busy)return;
  const button=shell.querySelector('.bp-save');const status=shell.querySelector('.bp-status');const editing=shell.querySelector('#bp-title')?.textContent?.toLowerCase().includes('edit');const currentId=editing?(shell.dataset.editPostId||''):'';
  // Never use the title to resolve an edit; it can be changed or duplicated.
  if(editing&&!/^\d+$/.test(currentId)){status.textContent='Cannot identify this post safely. Close the editor, refresh, and try again.';status.classList.add('bad');return;}
  busy=true;button.disabled=true;status.classList.remove('bad');let savedId='';let uploaded=0;
  try{const {data:{session},error}=await client.auth.getSession();if(error||!session)throw Error('Sign in again to save.');const values=Object.fromEntries(new FormData(form));const post={...values,client_visible:form.elements.client_visible.checked,audience:[],asset_link:values.asset_link||'',destination_link:values.destination_link||'',original_post_link:values.original_post_link||'',publish_at_et:values.publish_at_et||'',campaign:values.campaign||'',caption:values.caption||'',instructions:values.instructions||'',assigned_to:values.assigned_to||''};
   if(!post.title.trim()||!post.organization_slug||!post.platform.trim())throw Error('Organization, title and platform are required.');
   status.textContent='Saving post to Monday…';
   const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+session.access_token},body:JSON.stringify({action:'post_save',monday_id:currentId,post})});const result=await response.json();if(!response.ok||result.error)throw Error(result.error||'Could not save post');savedId=String(result.monday_id||'');if(!/^\d+$/.test(savedId))throw Error('Post saved but no Monday ID was returned. Refresh before uploading.');
   if(files.length){progress.hidden=false;progress.value=0;const selected=[...files];for(const file of selected){status.textContent=`Saved post. Uploading artwork ${uploaded+1} of ${selected.length}…`;const data=new FormData();data.append('file',file);data.append('organization_slug',post.organization_slug);data.append('monday_id',savedId);const res=await fetch(API,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token},body:data});const out=await res.json();if(!res.ok||out.error)throw Error(out.error||'Artwork upload failed');uploaded++;progress.value=Math.round(uploaded/selected.length*100);}}
   status.textContent='Saved successfully.';files=[];clearURLs();shell.hidden=true;document.body.style.overflow='';document.getElementById('refresh')?.click();
  }catch(err){status.textContent=(savedId?`Post saved (#${savedId}); ${uploaded} artwork file(s) uploaded. `:'')+(err.message||'Save failed');status.classList.add('bad');note.textContent=status.textContent;note.classList.add('error');}finally{busy=false;button.disabled=false;progress.hidden=true;}
 },true);
}
const watcher=new MutationObserver(()=>{if(!installed)setup()});watcher.observe(document.body,{childList:true,subtree:true});setup();
