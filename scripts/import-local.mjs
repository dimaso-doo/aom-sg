import {readFileSync} from 'node:fs';
// Run only after the approved project's migration is applied. Idempotent, AOM tables only.
import postgres from 'postgres';
import { DatabaseSync } from 'node:sqlite';
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL');
const source=new DatabaseSync('../aom-sg/.local/support.sqlite',{readOnly:true});
const sql=postgres(process.env.DATABASE_URL,{prepare:false,max:1,ssl:{rejectUnauthorized:true,ca:readFileSync("data/supabase-ca.crt","utf8")}});
try{
 await sql.begin(async tx=>{
  for(const table of ['conversations','messages','corrections','audit']){
   for(const row of source.prepare('SELECT * FROM '+table+' ORDER BY rowid').all()){
    if(table==='messages')row.sources=tx.json(JSON.parse(row.sources));
    await tx`insert into ${tx('aom_'+table)} ${tx(row)} on conflict(id) do nothing`;
   }
  }
  for(const doc of source.prepare('SELECT * FROM documents').all())await tx`select public.aom_index_document(${tx.json(doc)})`;
 });
 console.log('AOM data imported successfully. Local data unchanged.');
}finally{source.close();await sql.end()}
