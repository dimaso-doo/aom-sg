# AOM SG — private Vercel demo

Live chat: https://aom-sg.vercel.app
Support desk: https://aom-sg.vercel.app/admin
Access codes are in the local, ignored `AOM-access.txt` file. Do not commit or publish it.

The original local app and SQLite database remain in ../aom-sg. This separate Next.js 16.3.5 app uses Supabase Postgres through a certificate-verified transaction pooler. The Dimaso RFP Radar project was restored with user authorization. A dedicated aom_sg_app role accesses only AOM tables; existing application tables were not changed.

## Data and memory

Imported 283 source documents, 4 conversations and 34 messages from SQLite on 13 September 2026. Imports preserve IDs and are transactional. The local database is read-only during import. Verification conversations are additional records.

New online conversations are stored in Supabase. Reloading in the same browser preserves them through the ownership cookie. Clearing cookies or switching browser/device does not restore ownership automatically. Imported localhost conversations are accessible in the support desk; localhost cookies do not automatically transfer to the Vercel domain.

The assistant uses recent conversation history, retrieved public source extracts and relevant approved corrections. It does not train or change its model automatically. Source content is a 13 September 2026 snapshot; supported source refreshes are manual in the support desk. Answers remain English.

## Access and operations

The chat opens without a code; administration still requires its private access code. Signed HttpOnly SameSite cookies expire after seven days. All eight AOM tables have RLS; public, anon and authenticated roles have no table access. The trusted server enforces conversation ownership. API secrets stay in sensitive Vercel environment variables.

DB-backed leases serialize replies within a conversation. Limits allow 10 generation attempts per owner per minute and 100 globally per hour. Request IDs prevent duplicate completed answers. This is a private demo with browser-based ownership, not a full user-account system.

The support desk reviews conversations, feedback and sources. Corrections require draft → test → approve; only approved guidance enters normal replies. Approved corrections can be revoked.

## Maintenance

- Run npm run build before deployment.
- Run scripts/verify-cloud.mjs with TEST_URL pointing at the deployed URL and local private credentials available. It checks login, ownership, persistence, retry safety and the reviewed-correction workflow. It makes real model calls and creates labeled test records.
- Deploy with the linked Vercel CLI project aom-sg in dimasodoo-9210s-projects. Keep .local, .env files and AOM-access.txt excluded.
- Supabase schema migration: supabase/migrations/20260913124301_aom_support.sql. The separate scoped-role migration is recorded in the Supabase migration history; its password was generated locally, not checked into source.
- Postgres.js uses prepare:false, fetch_types:false and max_pipeline:1; internal queries explicitly use extended protocol and admin queries run sequentially for transaction-pooler reliability. The Supabase CA is embedded from the official Supabase certificate download.

Supabase security-advisor checks found no AOM-object findings. Existing unrelated rls_auto_enable function grants are reported by the project advisor and were not changed: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable

Browser automation was unavailable because its security verification failed. Verification uses production builds and HTTP/API/database checks; do not claim automated visual or click testing.

## Verified deployment

Production deployment dpl_4sNfQMtjKuDHqDemJjTyZq8eepjV was READY on 13 September 2026. Full verification against https://aom-sg.vercel.app passed: real AI answer, saved history, retry without duplicate messages, other-owner rejection, separate admin authentication, 283 source records, correction approval blocked before testing, then successful test/approve/revoke. Local production build also passed.
