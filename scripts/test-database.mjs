import {readFileSync,writeFileSync} from 'node:fs';import postgres from 'postgres';
const secrets=JSON.parse(readFileSync('.local/cloud-secrets.json','utf8'));
for(const host of ['aws-0-eu-west-1.pooler.supabase.com','aws-1-eu-west-1.pooler.supabase.com']){
 const url=new URL('postgresql://'+host+':6543/postgres');url.username='aom_sg_app.gtsczcxwwopzllccwddt';url.password=secrets.databasePassword;
 const sql=postgres(url.toString(),{prepare:false,max:1,connect_timeout:8,ssl:{rejectUnauthorized:true,ca:readFileSync("data/supabase-ca.crt","utf8")}});
 try{const rows=await sql`select current_user as role`;if(rows[0].role!=='aom_sg_app')throw new Error('Unexpected role');secrets.DATABASE_URL=url.toString();writeFileSync('.local/cloud-secrets.json',JSON.stringify(secrets),{mode:0o600});console.log({connected:true,host});await sql.end();process.exit(0)}catch(e){console.log({connected:false,host,code:e.code||e.name});await sql.end()}
}
process.exitCode=1;
