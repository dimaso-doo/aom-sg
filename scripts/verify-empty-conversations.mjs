import assert from 'node:assert/strict';
const base='https://aom-sg.vercel.app';const html=await(await fetch(base)).text();let found=false;
for(const m of html.matchAll(/src="([^"]+\.js)"/g)){const js=await(await fetch(base+m[1])).text();if(js.includes('Find your way around AOM')){found=true;assert.ok(!js.includes('Conversations are saved in this private demo'));}}
assert.ok(found,'New description is deployed');
const session=await fetch(base+'/api/session');const cookie=session.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
const create=async()=>{const r=await fetch(base+'/api/session',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({action:'new'})});assert.equal(r.status,200);return (await r.json()).id;};
const ids=await Promise.all(Array.from({length:6},create));assert.equal(new Set(ids).size,1);assert.equal(await create(),ids[0]);const history=await(await fetch(base+'/api/session',{headers:{Cookie:cookie}})).json();assert.equal(history.conversations.length,1);console.log({passed:true,checks:['new description deployed','six simultaneous clicks reuse one empty conversation','repeat click reuses conversation','history has one entry']});
