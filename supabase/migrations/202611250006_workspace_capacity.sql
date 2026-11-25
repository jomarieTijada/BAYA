begin;
alter table public.workspaces add column learner_capacity integer;
-- Existing workspaces retain every active learner.
update public.workspaces w set learner_capacity=greatest(30,(select count(*) from public.workspace_memberships m where m.workspace_id=w.workspace_id and m.is_active));
alter table public.workspaces alter column learner_capacity set default 30;
alter table public.workspaces alter column learner_capacity set not null;
alter table public.workspaces add constraint positive_learner_capacity check (learner_capacity > 0);
create function public.create_workspace(p_name text,p_capacity integer) returns jsonb language plpgsql security definer set search_path = '' as $$
declare m uuid := baya_private.own_mentor(); w public.workspaces; i integer;
begin
 if m is null then raise exception 'unauthorized' using errcode='42501'; end if;
 if p_capacity is null or p_capacity not between 1 and 10000 then raise exception 'invalid_capacity' using errcode='22023'; end if;
 if p_name is null or char_length(btrim(p_name)) not between 1 and 100 then raise exception 'invalid_name' using errcode='22023'; end if;
 for i in 1..5 loop
  begin
   insert into public.workspaces(mentor_profile_id,workspace_name,workspace_code,learner_capacity)
   values(m,btrim(p_name),'BAYA-'||upper(left(replace(gen_random_uuid()::text,'-',''),12)),p_capacity) returning * into w;
   return to_jsonb(w)||jsonb_build_object('learnerCount',0);
  exception when unique_violation then null;
  end;
 end loop;
 raise exception 'conflict' using errcode='23505';
end $$;

create function public.update_workspace(p_workspace_id uuid,p_name text,p_status text,p_capacity integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not baya_private.owns_workspace(p_workspace_id) then raise exception 'unauthorized' using errcode='42501'; end if;
 if p_capacity is null or p_capacity not between 1 and 10000 then raise exception 'invalid_capacity' using errcode='22023'; end if;
 perform 1 from public.workspaces where workspace_id=p_workspace_id for update;
 if p_capacity < (select count(*) from public.workspace_memberships where workspace_id=p_workspace_id and is_active) then raise exception 'workspace_full'; end if;
 update public.workspaces set learner_capacity=p_capacity where workspace_id=p_workspace_id;
 result := public.update_workspace(p_workspace_id,p_name,p_status);
 return result;
end $$;
create function baya_private.enforce_workspace_capacity() returns trigger language plpgsql security definer set search_path='' as $$
declare capacity integer;
begin
 if not new.is_active then return new; end if;
 -- An idempotent join's ON CONFLICT must still succeed when the workspace is full.
 if TG_OP='INSERT' and exists(select 1 from public.workspace_memberships where workspace_id=new.workspace_id and learner_profile_id=new.learner_profile_id and is_active) then return new; end if;
 if TG_OP='UPDATE' then
  if old.is_active and old.workspace_id=new.workspace_id then return new; end if;
 end if;
 select learner_capacity into capacity from public.workspaces where workspace_id=new.workspace_id for update;
 if (select count(*) from public.workspace_memberships where workspace_id=new.workspace_id and is_active and membership_id<>new.membership_id) >= capacity then raise exception 'workspace_full'; end if;
 return new;
end $$;
create trigger workspace_capacity before insert or update of is_active,workspace_id on public.workspace_memberships for each row execute function baya_private.enforce_workspace_capacity();
revoke all on function public.create_workspace(text,integer), public.update_workspace(uuid,text,text,integer) from public,anon;
grant execute on function public.create_workspace(text,integer), public.update_workspace(uuid,text,text,integer) to authenticated;
-- Serialize approval before taking membership locks; avoid shared-lock upgrades.
create or replace function public.review_workspace_join_request(p_request_id uuid,p_decision text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.workspace_join_requests; w public.workspaces; m public.workspace_memberships; reviewer uuid:=baya_private.own_mentor();
begin
 if reviewer is null then raise exception 'unauthorized' using errcode='42501'; end if;
 if p_decision is null or p_decision not in ('approved','rejected') then raise exception 'invalid_decision' using errcode='22023'; end if;
 -- Check ownership before locking or exposing the request.
 select w0.* into w from public.workspaces w0 join public.workspace_join_requests r0 using(workspace_id)
 where r0.request_id=p_request_id and w0.mentor_profile_id=reviewer for update of w0;
 if not found then raise exception 'unauthorized' using errcode='42501'; end if;
 select * into r from public.workspace_join_requests where request_id=p_request_id for update;
 if r.status<> 'pending' and r.status<>p_decision then raise exception 'already_processed' using errcode='40001'; end if;
 if r.status='pending' then
  if p_decision='approved' then
   if w.status<>'active' then raise exception 'inactive' using errcode='P0001'; end if;
   if not exists(select 1 from public.profiles where profile_id=r.learner_profile_id and role='learner') then raise exception 'unauthorized' using errcode='42501'; end if;
   insert into public.workspace_memberships(workspace_id,learner_profile_id) values(r.workspace_id,r.learner_profile_id)
   on conflict(learner_profile_id,workspace_id) do update set is_active=true;
  end if;
  update public.workspace_join_requests set status=p_decision,reviewed_at=now(),reviewed_by=reviewer where request_id=r.request_id returning * into r;
 end if;
 select * into m from public.workspace_memberships where workspace_id=r.workspace_id and learner_profile_id=r.learner_profile_id;
 return jsonb_build_object('request',baya_private.join_request_json(r),'membership',case when m.membership_id is null then null else to_jsonb(m) end);
end $$;

-- Close the legacy instant-join path. Old clients may only read an existing membership.
commit;
