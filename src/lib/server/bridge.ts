import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
export class ServiceError extends Error { constructor(public code:string,public status=503){super(code);} }
export function signingText(ts:number,nonce:string,body:string){return `${ts}.${nonce}.${body}`;}
export function signature(secret:string,ts:number,nonce:string,body:string){return createHmac("sha256",secret).update(signingText(ts,nonce,body)).digest("hex");}
export function sameSecret(actual:string,expected:string){const a=Buffer.from(actual),b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b);}
export function configured(){return Boolean(process.env.APPS_SCRIPT_URL&&process.env.APPS_SCRIPT_SECRET&&process.env.APP_ORIGIN&&process.env.TURNSTILE_SECRET_KEY&&process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);}
export async function bridge(action:string,data:unknown={}){
 const url=process.env.APPS_SCRIPT_URL,secret=process.env.APPS_SCRIPT_SECRET;
 if(!url||!secret||secret.length<32)throw new ServiceError("NOT_CONFIGURED");
 const target=new URL(url);if(target.origin!=="https://script.google.com"||!/^\/macros\/s\/[^/]+\/exec$/.test(target.pathname)||target.search)throw new ServiceError("NOT_CONFIGURED");
 const body=JSON.stringify({action,data}),ts=Date.now(),nonce=randomUUID();
 let result:Response;
 try{result=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ts,nonce,body,signature:signature(secret,ts,nonce,body)}),signal:AbortSignal.timeout(25000),cache:"no-store",redirect:"follow"});}catch{throw new ServiceError("UPSTREAM_UNKNOWN");}
 if(!result.ok)throw new ServiceError("UPSTREAM_UNKNOWN");
 let parsed;try{parsed=await result.json();}catch{throw new ServiceError("UPSTREAM_UNKNOWN");}
 if(!parsed||typeof parsed.ok!=="boolean")throw new ServiceError("UPSTREAM_UNKNOWN");
 if(!parsed.ok){const known:Record<string,number>={NOT_FOUND:404,CONFLICT:409,VALIDATION:400,RATE_LIMIT:429,UNAUTHORIZED:403};throw new ServiceError(parsed.code in known?parsed.code:"UPSTREAM_UNKNOWN",known[parsed.code]??503);}
 return parsed.data;
}
export function checkOrigin(req:Request){const origin=process.env.APP_ORIGIN;if(!origin||req.headers.get("origin")!==new URL(origin).origin)throw new ServiceError("ORIGIN",403);}
export async function readBody(req:Request){if(!req.headers.get("content-type")?.startsWith("application/json"))throw new ServiceError("VALIDATION",400);if(Number(req.headers.get("content-length"))>16000)throw new ServiceError("TOO_LARGE",413);const reader=req.body?.getReader();if(!reader)throw new ServiceError("VALIDATION",400);let bytes=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>16000){await reader.cancel();throw new ServiceError("TOO_LARGE",413);}chunks.push(value);}try{return JSON.parse(Buffer.concat(chunks).toString("utf8"));}catch{throw new ServiceError("VALIDATION",400);}}
export async function verifyChallenge(token:string){if(!process.env.TURNSTILE_SECRET_KEY||!process.env.APP_ORIGIN)throw new ServiceError("NOT_CONFIGURED");const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:new URLSearchParams({secret:process.env.TURNSTILE_SECRET_KEY,response:token}),signal:AbortSignal.timeout(8000)});if(!response.ok)throw new ServiceError("CHALLENGE",400);const r=await response.json();if(!r.success||r.hostname!==new URL(process.env.APP_ORIGIN).hostname||r.action!=="order")throw new ServiceError("CHALLENGE",400);}
export function requireAdmin(req:Request){const secret=process.env.ADMIN_ACCESS_TOKEN;if(!secret||secret.length<32)throw new ServiceError("NOT_CONFIGURED");const supplied=req.headers.get("authorization")??"";if(!sameSecret(supplied,`Bearer ${secret}`))throw new ServiceError("UNAUTHORIZED",401);}
export function failure(error:unknown){const e=error instanceof ServiceError?error:new ServiceError("UNAVAILABLE");return Response.json({ok:false,code:e.code},{status:e.status,headers:{"Cache-Control":"no-store"}});}
export function success(data:unknown,status=200){return Response.json({ok:true,data},{status,headers:{"Cache-Control":"no-store"}});}
