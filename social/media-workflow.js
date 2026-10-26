// Blueprint Social Studio — Monday Post Media uploader
// Include AFTER studio.js: <script type="module" src="media-workflow.js"></script>
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.0';
const base='https://lbheezjanvalalinqxcd.supabase.co';
const key='sb_publishable_PVlEl61mo7WEm_0AiaIMAw_Us8xIXqC';
const auth=createClient(base,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const api=base+'/functions/v1/blueprint-social';
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=document.createElement('style');
css.textContent='.media-upload-box{border-top:1px solid #e5eaf2;margin-top:12px;padding-top:12px}.media-upload-box label{font-size:12px;font-weight:700;display:block;margin-bottom:6px}.media-upload-box input{display:block;max-width:100%;font-size:12px}.media-upload-box .media-message{font-size:12px;color:#52627b;margin:6px 0}.media-upload-box button{margin-top:6px}.media-upload-box .media-preview{display:flex;gap:8px;flex-wrap:wrap}.media-upload-box .media-preview img{width:100px;height:75px;object-fit:cover;border-radius:6px}';
document.head.append(css);
function decorate(){
  const app=document.getElementById('app');
  if(!app||app.hidden)return;
  const master=document.getElementById('accessBadge')?.textContent.includes('MASTER');
  if(!master)return;
  document.querySelectorAll('#cards article[data-post]').forEach(card=>{
    if(card.querySelector('.media-upload-box'))return;
    const id=card.dataset.post;
    if(!/^\d+$/.test(id))return;
    const box=document.createElement('div');box.className='media-upload-box';
    box.innerHTML='<label>Post Media — upload images to Monday</label><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple aria-label="Select post images"><button type="button">Upload selected images</button><p class="media-message" role="status">Images are attached to this post in Monday.</p><div class="media-preview"></div>';
    const anchor=card.querySelector('.post-content')||card;
    anchor.append(box);
    const input=box.querySelector('input'),button=box.querySelector('button'),message=box.querySelector('.media-message');
    button.addEventListener('click',async()=>{
      const files=[...input.files];
      if(!files.length){message.textContent='Choose one or more images first.';return;}
      const orgBadge=card.querySelector('.badges .badge:last-child')?.textContent.trim();
      const orgFilter=document.getElementById('orgFilter');
      const org=orgFilter?.value||[...orgFilter.options].find(o=>o.textContent.trim()===orgBadge)?.value;
      if(!org){message.textContent='Select the post’s organization in the Organization filter before uploading.';return;}
      button.disabled=true;
      try{
        const {data:{session}}=await auth.auth.getSession();
        if(!session)throw Error('Sign in to Blueprint first.');
        for(let i=0;i<files.length;i++){
          const file=files[i];
          if(file.size>20*1024*1024)throw Error(file.name+' exceeds 20 MB.');
          message.textContent=`Uploading ${i+1} of ${files.length}: ${file.name}`;
          const data=new FormData();
          data.append('file',file);data.append('organization_slug',org);data.append('monday_id',id);
          const res=await fetch(api,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+session.access_token},body:data});
          const out=await res.json();if(!res.ok)throw Error(out.error||'Upload failed.');
          if(file.type.startsWith('image/')){
            const img=document.createElement('img');img.src=URL.createObjectURL(file);img.alt=file.name;
            img.onload=()=>URL.revokeObjectURL(img.src);box.querySelector('.media-preview').append(img);
          }
        }
        input.value='';message.textContent=`${files.length} image(s) saved to this Monday post.`;
      }catch(e){message.textContent='Upload stopped: '+e.message;}
      finally{button.disabled=false;}
    });
  });
}
const observer=new MutationObserver(()=>{requestAnimationFrame(decorate)});
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
decorate();
