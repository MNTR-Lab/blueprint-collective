import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
const BOARD='18437085764';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
const safeURL=(s:unknown)=>{try{const u=new URL(String(s));return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
const orgSlug=(v:string)=>{const s=(v||'').trim().toLowerCase();return ({nal:'nal','national arena league':'nal','blueprint collective':'blueprint','wheeling miners':'wheeling-miners'} as Record<string,string>)[s]||s.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');};
const approval=(v:string)=>{const s=(v||'').trim().toLowerCase();return s==='scheduled'||s==='posted'||s==='approved'?'Approved':s==='draft'?'Draft':v;};
const normalizeDate=(v:string)=>{const s=(v||'').trim();const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);if(!m)return s.replace(/\s*ET$/i,'');const y=m[3].length===2?'20'+m[3]:m[3];const h=Number(m[4])%12+(m[6].toUpperCase()==='PM'?12:0);return `${y}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}T${String(h).padStart(2,'0')}:${m[5]}`;};
function visible(p:any,slug:string,month:string){return p.approval==='Approved'&&p.client_visible===true&&!p.archived&&p.organization_slug===slug&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(p.publish_at_et)&&p.publish_at_et.startsWith(month+'-');}
function publicPost(p:any){return {media:p.media||[],id:p.monday_id,title:p.title,campaign:p.campaign,publish_at_et:p.publish_at_et,platform:p.platform,caption:p.caption,instructions:p.instructions||'',asset_link:safeURL(p.asset_link),asset_type:p.asset_type,destination_link:safeURL(p.destination_link),content_role:p.content_role,original_post_link:safeURL(p.original_post_link)};}
async function assetURL(db:any,url:string){const prefix=Deno.env.get('SUPABASE_URL')+'/storage/v1/object/public/social-studio-assets/';if(!url?.startsWith(prefix))return url;const {data,error}=await db.storage.from('social-studio-assets').createSignedUrl(url.slice(prefix.length),3600);if(error)throw error;return data.signedUrl;}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});if(req.method!=='GET')return reply({error:'Read-only calendar'},405);
 try{
  const u=new URL(req.url),slug=u.searchParams.get('organization')||'',month=u.searchParams.get('month')||'';
  if(!/^[a-z0-9][a-z0-9-]{0,59}$/.test(slug)||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))return reply({error:'Choose a valid organization and month'},400);
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:org,error}=await db.from('social_hub_organizations').select('slug,name,color').eq('slug',slug).eq('enabled',true).maybeSingle();if(error)throw error;if(!org)return reply({error:'Calendar not found'},404);
  const token=Deno.env.get('SOCIAL_MONDAY_API_TOKEN')||Deno.env.get('MONDAY_API_TOKEN');let posts:any[]=[],source='saved',updated='';
  if(token){
   async function monday(query:string,variables:unknown){const r=await fetch('https://api.monday.com/v2',{method:'POST',headers:{Authorization:token!,'Content-Type':'application/json'},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(15000)});const d=await r.json();if(!r.ok||d.errors?.length)throw Error('Monday calendar connection unavailable');return d.data;}
   const d=await monday('query($ids:[ID!]!){boards(ids:$ids){columns{id title} items_page(limit:500){cursor items{id name group{title} assets{id name public_url file_extension} column_values{id text}}}}}',{ids:[BOARD]});const b=d.boards?.[0];if(!b)throw Error('Monday calendar connection unavailable');
   const columns=new Map(b.columns.map((c:any)=>[c.id,c.title]));let items=b.items_page.items,cursor=b.items_page.cursor;
   while(cursor){if(items.length>=10000)throw Error('Calendar board limit reached');const n=await monday('query($cursor:String!){next_items_page(cursor:$cursor,limit:500){cursor items{id name group{title} assets{id name public_url file_extension} column_values{id text}}}}',{cursor});items.push(...n.next_items_page.items);cursor=n.next_items_page.cursor;}
   posts=items.map((i:any)=>{const c=Object.fromEntries(i.column_values.map((v:any)=>[columns.get(v.id),v.text||'']));return {monday_id:i.id,title:i.name,media:(i.assets||[]).filter((a:any)=>a.public_url&&['png','jpg','jpeg','gif','webp'].includes(String(a.file_extension||'').toLowerCase())).map((a:any)=>({name:a.name,url:safeURL(a.public_url)})),organization_slug:orgSlug(c.Organization),campaign:c.Campaign,publish_at_et:normalizeDate(c['Publish At ET']),platform:c.Platform,caption:c.Caption,instructions:c['Publishing Instructions']||c.Instructions||'',asset_link:c['Asset Link'],asset_type:c['Asset Type'],destination_link:c['Call-to-Action Link']||c['Destination Link'],content_role:c['Content Role'],original_post_link:c['Original Post Link'],approval:approval(c.Approval),client_visible:/^yes$/i.test(String(c['Client Visible']||'').trim()),archived:i.group?.title==='Archived'};});source='live';updated=new Date().toISOString();
  }else{
   const {data,error:pe}=await db.from('social_hub_posts').select('monday_id,title,organization_slug,campaign,publish_at_et,platform,caption,instructions,asset_link,asset_type,destination_link,content_role,original_post_link,approval,client_visible,archived,synced_at').eq('approval','Approved').eq('client_visible',true).eq('archived',false).gte('publish_at_et',month+'-01').lt('publish_at_et',month+'-32').limit(1000);if(pe)throw pe;posts=data||[];updated=posts.reduce((s:string,p:any)=>p.synced_at>s?p.synced_at:s,'');
  }
  const events=await Promise.all(posts.filter(p=>visible(p,slug,month)).sort((a,b)=>a.publish_at_et.localeCompare(b.publish_at_et)).map(async p=>({...publicPost(p),asset_link:await assetURL(db,p.asset_link)})));
  return reply({organization:org,month,timezone:'America/New_York',source,updated_at:updated,events});
 }catch(e){console.error('Calendar refresh failed',e);return reply({error:'The calendar could not refresh. Please try again shortly.'},503);}
});
