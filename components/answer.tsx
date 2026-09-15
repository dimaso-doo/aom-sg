import { cleanAnswerText } from '@/lib/answer-text';
import { Fragment } from 'react';
export type Message={id?:string;role:string;content:string;feedback?:string;sources?:{id:string;title:string;url:string}[]};
export function Answer({message}:{message:Message}){
 function inline(text:string){return text.split(/(\*\*[^*]+\*\*|\[[a-z0-9-]+\])/g).map((part,i)=>{if(part.startsWith('**'))return <strong key={i}>{part.slice(2,-2)}</strong>;const n=message.sources?.findIndex(s=>'['+s.id+']'===part)??-1;return n>=0?<a key={i} className="inline-citation" href={message.sources![n].url} target="_blank" rel="noopener noreferrer" aria-label={message.sources![n].title}>[{n+1}]</a>:<Fragment key={i}>{part}</Fragment>})}
 const blocks:{kind:'p'|'ol'|'ul';lines:string[]}[]=[];
 let current:{kind:'p'|'ol'|'ul';lines:string[]}|undefined;
 for(const line of (message.role==='assistant'?cleanAnswerText(message.content):message.content).split('\n')){if(!line.trim()){current=undefined;continue}const kind=/^\s*\d+[.)]\s/.test(line)?'ol':/^\s*[-*]\s/.test(line)?'ul':'p';const clean=kind==='p'?line.replace(/^#{1,3}\s/,''):line.replace(/^\s*(?:\d+[.)]|[-*])\s/,'');if(!current||current.kind!==kind){current={kind,lines:[]};blocks.push(current)}current.lines.push(clean)}
 return <div className="formatted-answer">{blocks.map((block,i)=>block.kind==='ol'?<ol key={i}>{block.lines.map((l,j)=><li key={j}>{inline(l)}</li>)}</ol>:block.kind==='ul'?<ul key={i}>{block.lines.map((l,j)=><li key={j}>{inline(l)}</li>)}</ul>:<p key={i}>{inline(block.lines.join('\n'))}</p>)}{message.sources?.length?<div className="citations">{message.sources.map((s,i)=><a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">[{i+1}] {s.title}</a>)}</div>:null}</div>
}
