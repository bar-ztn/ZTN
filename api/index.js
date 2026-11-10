import {PAGE} from '../lib/page.js';
const ADMIN='dolmong@yview.co.kr';
const baseHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
const json=(b,status=200,extra={})=>new Response(JSON.stringify(b),{status,headers:{...baseHeaders,'Content-Type':'application/json; charset=utf-8',...extra}});
const cookies=req=>Object.fromEntries((req.headers.get('cookie')||'').split(';').map(x=>x.trim().split(/=(.*)/s).slice(0,2)));
export async function handle(req,env=process.env,fetcher=fetch){
 const u=new URL(req.url),path=u.pathname;const sb=env.SUPABASE_URL,key=env.SUPABASE_PUBLISHABLE_KEY;
 if(!sb||!key)return json({error:'서버 연결 설정을 확인해 주세요.'},503);
 const auth=async(p,options={})=>fetcher(sb+'/auth/v1/'+p,{...options,headers:{apikey:key,'Content-Type':'application/json',...options.headers}});
 const c=cookies(req);let access=c.hiring_access,refresh=c.hiring_refresh,session=null;
 const allowed=user=>!!user?.id&&!!user?.email_confirmed_at&&user.email?.toLowerCase()===ADMIN;
 const sessionHeaders=(response,s)=>{if(s){response.headers.append('Set-Cookie',`hiring_access=${s.access_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.min(s.expires_in||3600,3600)}`);response.headers.append('Set-Cookie',`hiring_refresh=${s.refresh_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`)}return response};
 async function user(){if(access){const r=await auth('user',{headers:{Authorization:'Bearer '+access}});if(r.ok)return r.json()}if(refresh){const r=await auth('token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:refresh})});if(r.ok){const s=await r.json();if(allowed(s.user)){session=s;access=s.access_token;return s.user}}}return null;}
 try{
 if(['POST','PATCH','DELETE','PUT'].includes(req.method)&&req.headers.get('origin')!==u.origin)return json({error:'동일한 사이트에서 요청해 주세요.'},403);
 if(path==='/api/auth/login'&&req.method==='POST'){
 if(!/^application\/json(?:;|$)/i.test(req.headers.get('content-type')||''))return json({error:'잘못된 요청이에요.'},400);const raw=await req.text();if(raw.length>4096)return json({error:'요청이 너무 커요.'},413);let b;try{b=JSON.parse(raw)}catch{return json({error:'입력 형식을 확인해 주세요.'},400)}if(typeof b.email!=='string'||b.email.trim().toLowerCase()!==ADMIN||typeof b.password!=='string'||!b.password)return json({error:'관리자 이메일과 비밀번호를 확인해 주세요.'},403);const r=await auth('token?grant_type=password',{method:'POST',body:JSON.stringify({email:ADMIN,password:b.password})});if(!r.ok)return json({error:'로그인에 실패했어요. 관리자 계정 생성 여부와 비밀번호를 확인해 주세요.'},403);const s=await r.json();if(!allowed(s.user))return json({error:'이메일 확인을 마친 관리자 계정이 필요해요.'},403);return sessionHeaders(json({ok:true}),s);}
 if(path==='/api/auth/logout'&&req.method==='POST'){if(access)await auth('logout',{method:'POST',headers:{Authorization:'Bearer '+access}});const r=json({ok:true});for(const name of ['hiring_access','hiring_refresh'])r.headers.append('Set-Cookie',`${name}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);return r;}
 if(path.startsWith('/api/submissions')){
 if(!/^\/api\/submissions(?:\/summary|\/[0-9a-f-]{36})?$/i.test(path))return json({error:'잘못된 경로예요.'},404);
 const submitting=path==='/api/submissions'&&req.method==='POST';if(!submitting&&!allowed(await user()))return json({error:'사장님 계정으로 로그인해 주세요.'},403);
 if(!['GET','POST','PATCH'].includes(req.method))return json({error:'지원하지 않는 요청이에요.'},405);
 let body;if(submitting){body=await req.text();if(body.length>250000)return json({error:'요청이 너무 커요.'},413)}
 const target=new URL(sb+'/functions/v1/hiring-api');target.searchParams.set('route',path);if(u.searchParams.has('cursor'))target.searchParams.set('cursor',u.searchParams.get('cursor'));
 const r=await fetcher(target,{method:req.method,headers:{apikey:key,'Content-Type':req.headers.get('content-type')||'application/json',...(!submitting?{Authorization:'Bearer '+access}:{})},body,signal:AbortSignal.timeout(20000)});return sessionHeaders(new Response(await r.text(),{status:r.status,headers:{...baseHeaders,'Content-Type':'application/json; charset=utf-8'}}),session);}
 if(!['GET','HEAD'].includes(req.method))return json({error:'지원하지 않는 요청이에요.'},405);
 if(path!=='/'&&path!=='/admin')return json({error:'페이지를 찾을 수 없어요.'},404);
 const mode=path==='/admin'?(allowed(await user())?'admin':'login'):'builder';return sessionHeaders(new Response(req.method==='HEAD'?null:PAGE.replace('"__MODE__"',JSON.stringify(mode)),{headers:{...baseHeaders,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"}}),session);
 }catch(e){console.error('hiring-web failed',e.name);return json({error:'서버 연결에 실패했어요. 입력을 유지한 채 다시 시도해 주세요.'},503)}
}
export default {fetch(request){return handle(request)}};
