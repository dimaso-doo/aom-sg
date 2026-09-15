import {readFileSync} from 'node:fs';import {existingOpenAI} from './cloud-access.mjs';
const auth=JSON.parse(readFileSync('/Users/home/Library/Application Support/com.vercel.cli/auth.json','utf8'));
const secrets=JSON.parse(readFileSync('.local/cloud-secrets.json','utf8'));
const project=JSON.parse(readFileSync('.vercel/project.json','utf8'));
if(!secrets.DATABASE_URL)throw new Error('Database must be connected before configuring deployment.');
const envs={DATABASE_URL:secrets.DATABASE_URL,SESSION_SECRET:secrets.SESSION_SECRET,DEMO_ACCESS_CODE:secrets.DEMO_ACCESS_CODE,ADMIN_ACCESS_CODE:secrets.ADMIN_ACCESS_CODE,OPENAI_API_KEY:existingOpenAI(),OPENAI_MODEL:'gpt-5.4-mini'};
for(const [key,value] of Object.entries(envs)){
 const r=await fetch(`https://api.vercel.com/v10/projects/${project.projectId}/env?teamId=${project.orgId}&upsert=true`,{method:'POST',headers:{Authorization:`Bearer ${auth.token}`,'Content-Type':'application/json'},body:JSON.stringify({key,value,type:'sensitive',target:['production','preview']})});
 if(!r.ok){console.log({key,status:r.status});process.exit(1)}
 console.log(key+' configured');
}
