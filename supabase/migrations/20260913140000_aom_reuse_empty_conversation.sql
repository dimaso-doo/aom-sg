create or replace function public.aom_start_conversation(who uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare selected uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended('aom-new-'||who::text,0));
 select c.id into selected from public.aom_conversations c where c.owner=who and not exists(select 1 from public.aom_messages m where m.conversation=c.id) order by c.created desc limit 1;
 if selected is null then selected=gen_random_uuid();insert into public.aom_conversations(id,owner,title,created) values(selected,who,'New conversation',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));end if;
 return jsonb_build_object('id',selected,'messages','[]'::jsonb);
end $$;
revoke all on function public.aom_start_conversation(uuid) from public,anon,authenticated;
grant execute on function public.aom_start_conversation(uuid) to aom_sg_app;
