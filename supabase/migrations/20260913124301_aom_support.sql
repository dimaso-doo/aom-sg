-- AOM-owned objects only. Existing project tables are never changed.
create table public.aom_conversations(id uuid primary key, owner uuid not null, title text not null, created text not null);
create index aom_conversations_owner on public.aom_conversations(owner,created desc);
create table public.aom_messages(id uuid primary key, sequence bigint generated always as identity, conversation uuid not null references public.aom_conversations(id), role text not null check(role in ('user','assistant')), content text not null, sources jsonb not null default '[]', created text not null, feedback text check(feedback in ('helpful','needs_review')));
create index aom_messages_conversation on public.aom_messages(conversation,sequence);
create table public.aom_documents(id text primary key,title text not null,url text unique not null,text text not null,retrieved text not null,"wpId" bigint);
create table public.aom_chunks(id bigint generated always as identity primary key,doc text not null references public.aom_documents(id) on delete cascade,body text not null,search tsvector generated always as (to_tsvector('english',body)) stored);
create index aom_chunks_search on public.aom_chunks using gin(search);
create index aom_chunks_doc on public.aom_chunks(doc);
create table public.aom_corrections(id uuid primary key,question text not null,answer text not null,source text not null,status text not null check(status in ('draft','tested','approved','rejected','revoked')),preview text,created text not null);
create table public.aom_audit(id uuid primary key,action text not null,target text not null,created text not null);
create table public.aom_leases(id uuid primary key,conversation uuid unique not null references public.aom_conversations(id),expires timestamptz not null);
create table public.aom_requests(id uuid primary key,owner uuid not null,created timestamptz not null default now());
create index aom_requests_created on public.aom_requests(created);
create index aom_requests_owner_created on public.aom_requests(owner,created);

create function public.aom_search(terms text) returns table(id text,title text,url text,retrieved text,text text) language sql stable security invoker set search_path='' as $$
 select d.id,d.title,d.url,d.retrieved,c.body from public.aom_chunks c join public.aom_documents d on d.id=c.doc where c.search @@ to_tsquery('english',terms) order by ts_rank(c.search,to_tsquery('english',terms)) desc limit 8
$$;
create function public.aom_acquire(conv uuid,who uuid,lease_id uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(762401);
 if not exists(select 1 from public.aom_conversations where id=conv and owner=who) then return jsonb_build_object('ok',false);end if;
 delete from public.aom_leases where expires<now();
 delete from public.aom_requests where created<now()-interval '1 day';
 if exists(select 1 from public.aom_leases where conversation=conv) or (select count(*) from public.aom_requests where owner=who and created>now()-interval '1 minute')>=10 or (select count(*) from public.aom_requests where created>now()-interval '1 hour')>=100 then return jsonb_build_object('ok',false);end if;
 insert into public.aom_leases values(lease_id,conv,now()+interval '90 seconds');
 insert into public.aom_requests(id,owner) values(lease_id,who);
 return jsonb_build_object('ok',true);
end $$;
create function public.aom_save_pair(conv uuid,who uuid,answer_id uuid,question text,answer text,refs jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.aom_conversations where id=conv and owner=who for update;
 if not found then raise exception 'Conversation not found';end if;
 if exists(select 1 from public.aom_messages where id=answer_id) then return jsonb_build_object('ok',true);end if;
 insert into public.aom_messages(id,conversation,role,content,created) values(gen_random_uuid(),conv,'user',question,to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
 insert into public.aom_messages(id,conversation,role,content,sources,created) values(answer_id,conv,'assistant',answer,refs,to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
 update public.aom_conversations set title=left(question,75) where id=conv and title='New conversation';
 return jsonb_build_object('ok',true);
end $$;
create function public.aom_index_document(document jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare n integer; txt text:=document->>'text';
begin
 insert into public.aom_documents(id,title,url,text,retrieved,"wpId") values(document->>'id',document->>'title',document->>'url',txt,document->>'retrieved',(document->>'wpId')::bigint) on conflict(id) do update set title=excluded.title,url=excluded.url,text=excluded.text,retrieved=excluded.retrieved;
 delete from public.aom_chunks where doc=document->>'id';
 for n in 0..(length(txt)/1300) loop
 insert into public.aom_chunks(doc,body) values(document->>'id',substring(txt from n*1300+1 for 1600));
 end loop;
 return jsonb_build_object('ok',true);
end $$;
-- Private server-only data: no browser Data API access.
do $$ declare t text;begin
 foreach t in array array['aom_conversations','aom_messages','aom_documents','aom_chunks','aom_corrections','aom_audit','aom_leases','aom_requests'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated,public',t);
 end loop;
end $$;
revoke all on function public.aom_search(text),public.aom_acquire(uuid,uuid,uuid),public.aom_save_pair(uuid,uuid,uuid,text,text,jsonb),public.aom_index_document(jsonb) from public,anon,authenticated;
