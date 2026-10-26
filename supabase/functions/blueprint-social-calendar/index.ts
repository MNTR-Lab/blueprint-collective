import {createClient} from 'npm:@supabase/supabase-js@2.57.0';
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
const BOARD='18437085764';
const BLUEPRINT_ORG='7cf3f170-30c2-4b7f-9fbb-166982c3b936';
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return respond({error:'Method not allowed'},405);
 try{
  const jwt=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  if(!jwt)return respond({error:'Sign in required'},401);
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await db.auth.getUser(jwt);
  if(authError||!user?.email_confirmed_at)return respond({error:'Verified sign-in required'},401);
  const email=(user.email||'').toLowerCase();
  const [superResult,memberResult]=await Promise.all([
   db.from('platform_super_admins').select('email').eq('email',email).maybeSingle(),
   db.from('memberships').select('organization_id').eq('user_id',user.id).eq('organization_id',BLUEPRINT_ORG).limit(1)
  ]);
  if(superResult.error||memberResult.error)throw Error('Permission check failed');
  if(!superResult.data&&!memberResult.data?.length)return respond({error:'Blueprint staff access required'},403);
  const payload=await req.json();const ids=payload?.ids;
  if(!Array.isArray(ids)||ids.length>80||ids.some(x=>typeof x!=='string'||!/^\d{1,25}$/.test(x)))return respond({error:'Invalid post IDs (maximum 80)'},400);
  const unique=[...new Set(ids)];if(!unique.length)return respond({assets:{}});
  const {data:posts,error:postError}=await db.from('social_hub_posts').select('monday_id,archived').in('monday_id',unique);
  if(postError)throw postError;
  const valid=(posts||[]).filter((p:any)=>!p.archived).map((p:any)=>String(p.monday_id));
  if(!valid.length)return respond({assets:{}});
  const token=Deno.env.get('SOCIAL_MONDAY_API_TOKEN')||Deno.env.get('MONDAY_API_TOKEN');
  if(!token)return respond({error:'Monday connection not configured'},503);
  const query='query($ids:[ID!]!){items(ids:$ids){id board{id} assets{id name public_url file_extension}}}';
  const response=await fetch('https://api.monday.com/v2',{method:'POST',headers:{Authorization:token,'Content-Type':'application/json'},body:JSON.stringify({query,variables:{ids:valid}}),signal:AbortSignal.timeout(15000)});
  const data=await response.json();if(!response.ok||data.errors?.length)throw Error('Monday asset lookup failed');
  const assets:Record<string,unknown[]>={};
  for(const item of data.data?.items||[]){
   if(String(item.board?.id)!==BOARD||!valid.includes(String(item.id)))continue;
   assets[String(item.id)]=(item.assets||[]).map((a:any)=>{
    let url='';try{const u=new URL(String(a.public_url||''));if(u.protocol==='https:')url=u.href}catch{/* no public preview */}
    return {id:String(a.id),name:String(a.name||'Attachment'),extension:String(a.file_extension||'').toLowerCase(),url};
   });
  }
  return respond({assets});
 }catch(e){console.error('Social media lookup failed',e);return respond({error:'Could not retrieve attached media. Try again.'},503)}
});
