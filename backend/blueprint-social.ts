import { createClient } from 'npm:@supabase/supabase-js@2.57.0';
const BOARD='18437085764';
const BLUEPRINT_ORG='7cf3f170-30c2-4b7f-9fbb-166982c3b936';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const fail=(message:string,status=400)=>reply({error:message},status);
const slugOK=(s:unknown)=>typeof s==='string'&&/^[a-z0-9][a-z0-9-]{0,59}$/.test(s);
const safeURL=(s:unknown)=>{try{const u=new URL(String(s));return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
function canSee(p:any,scopes:Set<string>,master:boolean){return master || (p.approval==='Approved'&&!p.archived&&[p.organization_slug,...(p.audience||[])].some(s=>scopes.has(s)));}
function normalize(item:any,columns:Map<string,string>){
 const c=Object.fromEntries((item.column_values||[]).map((v:any)=>[columns.get(v.id)||v.id,v.text||'']));
 return {monday_id:item.id,title:item.name,organization_slug:c.Organization.trim(),audience:(c.Audience||'').split(',').map((s:string)=>s.trim()).filter(Boolean),campaign:c.Campaign,publish_at_et:c['Publish At ET'],platform:c.Platform,caption:c.Caption,destination_link:safeURL(c['Destination Link']),asset_link:safeURL(c['Asset Link']),asset_type:c['Asset Type']||'Image',instructions:c.Instructions,approval:c.Approval||'Draft',assigned_to:c['Assigned To'],content_role:c['Content Role']||'Main Post',original_post_link:safeURL(c['Original Post Link']),archived:item.group?.title==='Archived',synced_at:new Date().toISOString()};
}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return fail('Method not allowed',405);
 try{
  if(Number(req.headers.get('content-length')||0)>20000)return fail('Request too large',413);
  const jwt=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');if(!jwt)return fail('Sign in to continue',401);
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await db.auth.getUser(jwt);if(authError||!user?.email_confirmed_at)return fail('Verified staff sign-in required',401);
  const email=(user.email||'').toLowerCase();
  const [superResult,memberResult,orgResult,grantResult]=await Promise.all([
   db.from('platform_super_admins').select('email').eq('email',email).maybeSingle(),
   db.from('memberships').select('organization_id,role').eq('user_id',user.id),
   db.from('social_hub_organizations').select('*').eq('enabled',true).order('name'),
   db.from('social_hub_access').select('organization_slug').eq('email',email)
  ]);
  for(const r of [superResult,memberResult,orgResult,grantResult])if(r.error)throw r.error;
  const master=!!superResult.data||(memberResult.data||[]).some((m:any)=>m.organization_id===BLUEPRINT_ORG);
  const orgs=orgResult.data||[];
  const memberships=new Set((memberResult.data||[]).map((m:any)=>m.organization_id));
  const grants=new Set((grantResult.data||[]).map((g:any)=>g.organization_slug));
  const allowed=orgs.filter((o:any)=>master||grants.has(o.slug)||(o.crm_organization_id&&memberships.has(o.crm_organization_id)));
  const scopes=new Set<string>(allowed.map((o:any)=>o.slug));
  if(!master&&!scopes.size)return fail('Your account has no social media access yet. Ask Blueprint to assign your organization.',403);
  const body=await req.json();const action=body.action||'bootstrap';
  const mondayToken=Deno.env.get('SOCIAL_MONDAY_API_TOKEN')||Deno.env.get('MONDAY_API_TOKEN');
  async function monday(query:string,variables:unknown){
   if(!mondayToken)throw new Error('MONDAY_SETUP');
   const r=await fetch('https://api.monday.com/v2',{method:'POST',headers:{Authorization:mondayToken!,'Content-Type':'application/json'},body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(15000)});
   if(!r.ok)throw new Error('MONDAY_CONNECTION');const j=await r.json();if(j.errors?.length)throw new Error('MONDAY_CONNECTION');return j.data;
  }
  async function sync(){
   const d=await monday('query($ids:[ID!]!){boards(ids:$ids){columns{id title} items_page(limit:500){cursor items{id name group{title} column_values{id text}}}}}',{ids:[BOARD]});
   const b=d.boards?.[0];if(!b)throw new Error('MONDAY_ACCESS');const map=new Map<string,string>(b.columns.map((c:any)=>[c.id,c.title]));
   let items=b.items_page.items, cursor=b.items_page.cursor;
   while(cursor){if(items.length>=10000)throw new Error('MONDAY_LIMIT');const n=await monday('query($cursor:String!){next_items_page(cursor:$cursor,limit:500){cursor items{id name group{title} column_values{id text}}}}',{cursor});items.push(...n.next_items_page.items);cursor=n.next_items_page.cursor;}
   const posts=items.map((i:any)=>normalize(i,map));
   if(posts.length){const {error}=await db.from('social_hub_posts').upsert(posts,{onConflict:'monday_id'});if(error)throw error;}
   // A successful full-board read is required before removing stale content from staff views.
   const {data:prior,error:pe}=await db.from('social_hub_posts').select('monday_id');if(pe)throw pe;
   const ids=new Set(posts.map((p:any)=>p.monday_id));const removed=(prior||[]).filter((p:any)=>!ids.has(p.monday_id)).map((p:any)=>p.monday_id);
   if(removed.length){const {error}=await db.from('social_hub_posts').update({archived:true}).in('monday_id',removed);if(error)throw error;}
   return posts.length;
  }
  if(action==='sync'){
   if(!master)return fail('Blueprint master access required',403);
   const count=await sync();return reply({success:true,count});
  }
  if(action==='organization_save'){
   if(!master)return fail('Blueprint master access required',403);
   if(!slugOK(body.slug)||typeof body.name!=='string'||!body.name.trim()||!/^#[0-9a-fA-F]{6}$/.test(body.color||'#2563eb'))return fail('Enter an organization name, a valid slug, and a hex color');
   const {error}=await db.from('social_hub_organizations').upsert({slug:body.slug,name:body.name.trim().slice(0,100),color:body.color||'#2563eb',enabled:true},{onConflict:'slug'});if(error)throw error;return reply({success:true});
  }
  if(action==='access_list'){
   if(!master)return fail('Blueprint master access required',403);
   const {data,error}=await db.from('social_hub_access').select('email,organization_slug,created_at').order('email');if(error)throw error;return reply({grants:data});
  }
  if(action==='access_grant'||action==='access_revoke'){
   if(!master)return fail('Blueprint master access required',403);
   if(typeof body.email!=='string'||!/^\S+@\S+\.\S+$/.test(body.email)||!scopes.has(body.organization_slug))return fail('Provide a staff email and an enabled organization');
   const e=body.email.trim().toLowerCase();
   const result=action==='access_grant'?await db.from('social_hub_access').upsert({email:e,organization_slug:body.organization_slug,granted_by:user.id},{onConflict:'email,organization_slug'}):await db.from('social_hub_access').delete().eq('email',e).eq('organization_slug',body.organization_slug);
   if(result.error)throw result.error;return reply({success:true});
  }
  if(action==='approval_set'){
   if(!master)return fail('Blueprint master access required',403);
   if(!['Draft','Pending Review','Approved'].includes(body.approval)||!/^\d+$/.test(String(body.monday_id)))return fail('Invalid approval');
   const result=await monday('mutation($b:ID!,$i:ID!,$v:JSON!){change_multiple_column_values(board_id:$b,item_id:$i,column_values:$v){id}}',{b:BOARD,i:String(body.monday_id),v:JSON.stringify({text_mm8g7n8d:body.approval})});
   if(!result.change_multiple_column_values?.id)return fail('Approval could not be saved',502);
   const {error}=await db.from('social_hub_posts').update({approval:body.approval}).eq('monday_id',String(body.monday_id));if(error)throw error;
   return reply({success:true});
  }
  if(action==='publication_save'){
   if(!scopes.has(body.organization_slug))return fail('Organization access denied',403);
   const {data:post,error}=await db.from('social_hub_posts').select('*').eq('monday_id',String(body.monday_id)).maybeSingle();if(error)throw error;
   const targetScope=new Set<string>([body.organization_slug]);
   if(!post||post.archived||post.approval!=='Approved'||!canSee(post,targetScope,false))return fail('This post is not approved for this organization',403);
   const platform=String(body.platform||'');if(!post.platform.split(',').map((s:string)=>s.trim()).includes(platform))return fail('Choose one of this post’s platforms');
   if(body.published_link&&!safeURL(body.published_link))return fail('Enter a valid http or https published URL');
   const {error:saveError}=await db.from('social_hub_publications').upsert({monday_id:post.monday_id,organization_slug:body.organization_slug,platform,published_link:safeURL(body.published_link),published_by:user.id,published_at:new Date().toISOString()},{onConflict:'monday_id,organization_slug,platform'});if(saveError)throw saveError;return reply({success:true});
  }
  if(action!=='bootstrap')return fail('Unknown action');
  let syncWarning='';
  // Refresh from the one master Monday board, retaining a dated snapshot during connection outages.
  if(mondayToken){try{await sync();}catch(e){syncWarning=master?'Monday refresh failed. Showing the last saved sync. Check SOCIAL_MONDAY_API_TOKEN access to the master board.':'Content could not refresh. Showing the last saved version.';}}
  else syncWarning=master?'Live Monday sync needs SOCIAL_MONDAY_API_TOKEN in the Blueprint Supabase project. Showing the saved content snapshot.':'';
  const {data:posts,error:postsError}=await db.from('social_hub_posts').select('*').order('publish_at_et').limit(10000);if(postsError)throw postsError;
  const visible=(posts||[]).filter((p:any)=>canSee(p,scopes,master));
  let publicationsQuery=db.from('social_hub_publications').select('monday_id,organization_slug,platform,published_link,published_at');
  if(!master)publicationsQuery=publicationsQuery.in('organization_slug',[...scopes]);
  const {data:publications,error:pubError}=await publicationsQuery.limit(10000);if(pubError)throw pubError;
  return reply({email,master,organizations:allowed,posts:visible,publications,last_synced_at:(posts||[]).reduce((latest:string,p:any)=>p.synced_at>latest?p.synced_at:latest,''),sync_warning:syncWarning,board_url:master?'https://ai-apparel-group-inc.monday.com/boards/'+BOARD:null});
 }catch(e){
  const code=e instanceof Error?e.message:'';
  if(code==='MONDAY_SETUP')return fail('Add SOCIAL_MONDAY_API_TOKEN to the Blueprint Supabase project for live Monday sync.',503);
  if(code.startsWith('MONDAY_'))return fail('Unable to read the Social Media Master board. Check the dedicated social Monday connection.',502);
  console.error('blueprint-social request failed');return fail('Unable to complete this request. Please try again.',500);
 }
});
