import 'server-only';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import ca from '@/data/supabase-ca.json';
import core from '@/data/sources.json';
export type Row=Record<string,unknown>;
export const uid=()=>randomUUID();export const now=()=>new Date().toISOString();
const queryOptions={simple:false,prepare:false};
const connectionOptions={prepare:false,fetch_types:false,max_pipeline:1,max:2,idle_timeout:20,connect_timeout:10,ssl:{rejectUnauthorized:true,ca}};
let connection:ReturnType<typeof postgres>|undefined;
function sql(){if(!process.env.DATABASE_URL)throw new Error('Database not configured.');return connection??=postgres(process.env.DATABASE_URL,connectionOptions)}
const identifier=(v:string)=>{if(!/^[A-Za-z_][A-Za-z_0-9]*$/.test(v))throw new Error('Invalid identifier');return '"'+v+'"'};
export async function db(path:string,method='GET',payload?:unknown):Promise<Row[]>{
 const [resource,query='']=path.split('?');const values:postgres.ParameterOrJSON<never>[]=[];
 const bind=(v:unknown)=>{values.push((typeof v==='object'&&v!==null?JSON.stringify(v):v) as postgres.ParameterOrJSON<never>);return '$'+values.length};
 if(resource.startsWith('rpc/')){const name=resource.slice(4);if(!['aom_start_conversation','aom_search','aom_acquire','aom_save_pair','aom_index_document'].includes(name))throw new Error('Unknown operation');const args=Object.entries(payload as Row).map(([k,v])=>identifier(k)+' => '+bind(v)).join(',');const rows=await sql().unsafe('select * from public.'+identifier(name)+'('+args+')',values,queryOptions);return name==='aom_search'?rows as Row[]:rows.map(r=>r[name] as Row)}
 if(!['aom_conversations','aom_messages','aom_documents','aom_corrections','aom_audit','aom_leases'].includes(resource))throw new Error('Unknown table');
 const params=new URLSearchParams(query);const conditions:string[]=[];
 for(const [k,v] of params){if(['select','order','limit'].includes(k))continue;if(!v.startsWith('eq.'))throw new Error('Unsupported filter');conditions.push(identifier(k)+' = '+bind(v.slice(3)))}
 const where=conditions.length?' where '+conditions.join(' and '):'';let statement='';
 if(method==='GET'){const fields=(params.get('select')||'*').split(',').map(x=>x==='*'?'*':identifier(x)).join(',');statement='select '+fields+' from public.'+identifier(resource)+where;const order=params.get('order');if(order){const [col,dir]=order.split('.');statement+=' order by '+identifier(col)+(dir==='desc'?' desc':' asc')}const limit=params.get('limit');if(limit)statement+=' limit '+bind(Math.min(Number(limit)||100,1000));}
 else if(method==='POST'){const row=payload as Row;const entries=Object.entries(row);statement='insert into public.'+identifier(resource)+'('+entries.map(([k])=>identifier(k)).join(',')+') values('+entries.map(([,v])=>bind(v)).join(',')+') returning *';}
 else if(method==='PATCH'){if(!where)throw new Error('Filter required');statement='update public.'+identifier(resource)+' set '+Object.entries(payload as Row).map(([k,v])=>identifier(k)+' = '+bind(v)).join(',')+where+' returning *';}
 else if(method==='DELETE'){if(!where)throw new Error('Filter required');statement='delete from public.'+identifier(resource)+where+' returning *';}else throw new Error('Unsupported operation');
 return await sql().unsafe(statement,values,queryOptions) as Row[];
}
export const eq=(value:string)=>encodeURIComponent(value);
export async function owned(id:string,owner:string){return (await db('aom_conversations?select=id&id=eq.'+eq(id)+'&owner=eq.'+eq(owner))).length===1}
export async function history(id:string){return db('aom_messages?conversation=eq.'+eq(id)+'&order=sequence.asc')}
export async function audit(action:string,target:string){await db('aom_audit','POST',{id:uid(),action,target,created:now()})}
export async function retrieve(query:string){
 const words=[...new Set(query.toLowerCase().match(/[a-z]{3,}/g)||[])].filter(w=>!['the','and','that','with','for','what','how','can','you','are','aom','please','from','have','which','this','would'].includes(w)).slice(-25);
 const basics=await Promise.all(core.map(async s=>{const rows=await db('aom_documents?url=eq.'+eq(s.url)+'&select=id,title,url,text,retrieved');const d=rows[0];return d&&String(d.retrieved)>s.retrieved?{...s,retrieved:String(d.retrieved),text:String(d.text).slice(0,15000)}:s}));
 const extras=words.length?await db('rpc/aom_search','POST',{terms:words.join(' | ')}):[];
 const grouped=new Map<string,Row>();for(const e of extras){const old=grouped.get(String(e.id));grouped.set(String(e.id),old?{...e,text:String(old.text)+'\n…\n'+e.text}:e)}
 return [...basics,...[...grouped.values()].filter(e=>!basics.some(b=>b.url===e.url)).map(e=>({id:String(e.id),title:String(e.title),url:String(e.url),retrieved:String(e.retrieved),text:String(e.text)}))];
}
export async function relevantCorrections(query:string){const stop=new Set(['what','which','where','when','that','this','with','from','have','does','please','could','would','about','your']);const tokens=(text:string)=>[...new Set(text.toLowerCase().match(/[a-z]{4,}/g)||[])].filter(w=>!stop.has(w));const words=new Set(tokens(query));return (await db('aom_corrections?status=eq.approved&order=created.desc&limit=500')).map(c=>({c,score:tokens(String(c.question)).filter(w=>words.has(w)).length})).filter(x=>x.score>=2).sort((a,b)=>b.score-a.score).slice(0,6).map(x=>x.c)}
