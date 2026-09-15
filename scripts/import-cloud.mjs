import {readFileSync} from 'node:fs';
const secrets=JSON.parse(readFileSync('.local/cloud-secrets.json','utf8'));process.env.DATABASE_URL=secrets.DATABASE_URL;
await import('./import-local.mjs');
