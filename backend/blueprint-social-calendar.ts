import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
const BOARD='18437085764';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
const safeURL=(s:unknown)=>{try{const u=new URL(String(s));return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
function visible(p:any,slug:string,month:string){return p.approval==='Approved'&&p.client_visible===true&&!p.archived&&(p.organization_slug===slug||(p.audience||[]).includes(slug))&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(p.publish_at_et)&&p.publish_at_et.startsWith(month+'-');}
function publicPost(p:any){return {id:p.monday_id,title:p.title,campaign:p.campaign,publish_at_et:p.publish_at_et,platform:p.platform,caption:p.caption,asset_link:safeURL(p.asset_link),asset_type:p.asset_type,destination_link:safeURL(p.destination_link),content_role:p.content_role,original_post_link:safeURL(p.original_post_link)};}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});if(req.method!=='GET')return reply({error:'Read-only calendar'},405);
 try{
  const url=new URL(req.url),slug=url.searchParams.get('organization')||'',month=url.searchParams.get('month')||'';
  if(!/^[a-z0-9][a-z0-9-]{0,59}$/.test(slug)||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))return reply({error:'Choose a valid organization and month'},400);
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:org,error}=await db.from('social_hub_organizations').select('slug,name,color').eq('slug',slug).eq('enabled',true).maybeSingle();if(error)throw error;if(!org)return reply({error:'Calendar not found'},404);
  const token=Deno.env.get('SOCIAL_MONDAY_API_TOKEN')||Deno.env.get('MONDAY_API_TOKEN');
  let posts:any[]=[],source='saved',updated='';
  if(token){
   async function monday(query:string,variables:unknown){const r=await fetch('https://api.monday.com/v2',{method:'POST',headers:{Authorization:token!,'Content-Type':'application/json'},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(15000)});const d=await r.json();if(!r.ok||d.errors?.length)throw Error('Monday calendar connection unavailable');return d.data;}
   const d=await monday('query($ids:[ID!]!){boards(ids:$ids){columns{id title} items_page(limit:500){cursor items{id name group{title} column_values{id text}}}}}',{ids:[BOARD]});const b=d.boards?.[0];if(!b)throw Error('Monday calendar connection unavailable');
   const columns=new Map(b.columns.map((c:any)=>[c.id,c.title]));let items=b.items_page.items,cursor=b.items_page.cursor;
   while(cursor){if(items.length>=10000)throw Error('Calendar board limit reached');const n=await monday('query($cursor:String!){next_items_page(cursor:$cursor,limit:500){cursor items{id name group{title} column_values{id text}}}}',{cursor});items.push(...n.next_items_page.items);cursor=n.next_items_page.cursor;}
   posts=items.map((i:any)=>{const c=Object.fromEntries(i.column_values.map((v:any)=>[columns.get(v.id),v.text||'']));return {monday_id:i.id,title:i.name,organization_slug:c.Organization.trim(),audience:c.Audience.split(',').map((s:string)=>s.trim()),campaign:c.Campaign,publish_at_et:c['Publish At ET'],platform:c.Platform,caption:c.Caption,asset_link:c['Asset Link'],asset_type:c['Asset Type'],destination_link:c['Destination Link'],content_role:c['Content Role'],original_post_link:c['Original Post Link'],approval:c.Approval,client_visible:/^yes$/i.test(c['Client Visible'].trim()),archived:i.group?.title==='Archived'};});source='live';updated=new Date().toISOString();
  }else{
   const {data,error:pe}=await db.from('social_hub_posts').select('monday_id,title,organization_slug,audience,campaign,publish_at_et,platform,caption,asset_link,asset_type,destination_link,content_role,original_post_link,approval,client_visible,archived,synced_at').eq('approval','Approved').eq('client_visible',true).eq('archived',false).gte('publish_at_et',month+'-01').lt('publish_at_et',month+'-32').limit(1000);if(pe)throw pe;posts=data||[];updated=posts.reduce((s:string,p:any)=>p.synced_at>s?p.synced_at:s,'');
  }
  return reply({organization:org,month,timezone:'America/New_York',source,updated_at:updated,events:posts.filter(p=>visible(p,slug,month)).sort((a,b)=>a.publish_at_et.localeCompare(b.publish_at_et)).map(publicPost)});
 }catch{ return reply({error:'The calendar could not refresh. Please try again shortly.'},503); }
});
