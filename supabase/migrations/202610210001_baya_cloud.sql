-- Fresh-project migration. Fails rather than overwriting an existing schema.
-- The approved mentor link is profile_id (the ERD calls it learner_profile_id).
begin;
create schema if not exists baya_private;
revoke all on schema baya_private from public;

create table public.content_versions (
 content_version_id uuid primary key default gen_random_uuid(),
 version_label text not null unique,
 validation_status text not null default 'draft' check (validation_status in ('draft','validated','retired')),
 activated_at timestamptz
);
create table public.lessons (
 lesson_id uuid primary key default gen_random_uuid(),
 content_version_id uuid not null references public.content_versions on delete restrict,
 stage_number integer not null check (stage_number > 0), title text not null, description text not null default ''
);
create table public.activities (
 activity_id uuid primary key default gen_random_uuid(), lesson_id uuid not null references public.lessons on delete restrict,
 activity_type text not null, title text not null, sequence_no integer not null check (sequence_no >= 0),
 unique(lesson_id, sequence_no)
);
create table public.profiles (
 profile_id uuid primary key default gen_random_uuid(),
 auth_user_id uuid not null unique references auth.users(id) on delete cascade,
 display_name text not null check (char_length(btrim(display_name)) between 1 and 100),
 role text not null check (role in ('mentor','learner')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.mentor_profiles (
 mentor_profile_id uuid primary key default gen_random_uuid(),
 profile_id uuid not null unique references public.profiles on delete cascade
);
create table public.workspaces (
 workspace_id uuid primary key default gen_random_uuid(),
 mentor_profile_id uuid not null references public.mentor_profiles on delete cascade,
 workspace_code text not null unique check (workspace_code ~ '^BAYA-[A-F0-9]{12}$'),
 workspace_name text not null check (char_length(btrim(workspace_name)) between 1 and 100),
 status text not null default 'active' check (status in ('active','archived')),
 created_at timestamptz not null default now()
);
create table public.workspace_memberships (
 membership_id uuid primary key default gen_random_uuid(),
 learner_profile_id uuid not null references public.profiles on delete cascade,
 workspace_id uuid not null references public.workspaces on delete cascade,
 joined_at timestamptz not null default now(), last_synced_at timestamptz,
 is_active boolean not null default true,
 unique(learner_profile_id, workspace_id)
);
create table public.learner_progress (
 learner_progress_id uuid primary key default gen_random_uuid(),
 learner_profile_id uuid not null references public.profiles on delete cascade,
 lesson_id uuid not null references public.lessons on delete restrict,
 status text not null, completed_at timestamptz, last_activity_at timestamptz,
 updated_at timestamptz not null default now(), unique(learner_profile_id, lesson_id)
);
create table public.activity_attempts (
 attempt_id uuid primary key default gen_random_uuid(),
 learner_profile_id uuid not null references public.profiles on delete cascade,
 activity_id uuid not null references public.activities on delete restrict,
 result_status text not null, recognized_result text, confidence_value numeric check (confidence_value between 0 and 1),
 feedback_code text, attempted_at timestamptz not null default now()
);
create table public.review_items (
 review_item_id uuid primary key default gen_random_uuid(),
 learner_profile_id uuid not null references public.profiles on delete cascade,
 activity_id uuid not null references public.activities on delete restrict,
 reason text not null, status text not null default 'pending', created_at timestamptz not null default now(), resolved_at timestamptz
);
create index on public.lessons(content_version_id);
create index on public.workspaces(mentor_profile_id);
create index on public.workspace_memberships(workspace_id, is_active);
create index on public.learner_progress(learner_profile_id);
create index on public.activity_attempts(learner_profile_id);
create index on public.activity_attempts(activity_id);
create index on public.review_items(learner_profile_id);
create index on public.review_items(activity_id);

-- Identity comes from Supabase Auth, never user-editable role metadata.
-- Email accounts are mentor accounts; anonymous accounts are device learners.
create function baya_private.create_auth_profile() returns trigger language plpgsql security definer set search_path = '' as $$
declare p uuid;
begin
 insert into public.profiles(auth_user_id, display_name, role)
 values (new.id, left(coalesce(nullif(btrim(new.raw_user_meta_data->>'display_name'), ''), case when new.is_anonymous then 'Learner' else 'Mentor' end), 100),
 case when coalesce(new.is_anonymous, false) then 'learner' else 'mentor' end) returning profile_id into p;
 if not coalesce(new.is_anonymous, false) then
  insert into public.mentor_profiles(profile_id) values (p);
 end if;
 return new;
end $$;
create trigger baya_auth_profile after insert on auth.users for each row execute function baya_private.create_auth_profile();

create function baya_private.own_profile() returns uuid language sql stable security definer set search_path = '' as $$
 select profile_id from public.profiles where auth_user_id = (select auth.uid())
$$;
create function baya_private.own_mentor() returns uuid language sql stable security definer set search_path = '' as $$
 select m.mentor_profile_id from public.mentor_profiles m join public.profiles p on p.profile_id=m.profile_id
 join auth.users u on u.id=p.auth_user_id
 where p.auth_user_id=(select auth.uid()) and p.role='mentor' and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
$$;
create function baya_private.owns_workspace(w uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.workspaces where workspace_id=w and mentor_profile_id=baya_private.own_mentor())
$$;
create function baya_private.can_read_workspace(w uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select baya_private.owns_workspace(w) or exists(select 1 from public.workspace_memberships where workspace_id=w and learner_profile_id=baya_private.own_profile() and is_active)
$$;
create function baya_private.can_read_learner(p uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select p=baya_private.own_profile() or exists(select 1 from public.workspace_memberships m join public.workspaces w using(workspace_id)
 where m.learner_profile_id=p and m.is_active and w.status='active' and w.mentor_profile_id=baya_private.own_mentor())
$$;

-- No direct client writes to identity, ownership, codes or membership authorization.
alter table public.content_versions enable row level security;
alter table public.lessons enable row level security;
alter table public.activities enable row level security;
alter table public.profiles enable row level security;
alter table public.mentor_profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.learner_progress enable row level security;
alter table public.activity_attempts enable row level security;
alter table public.review_items enable row level security;

revoke all on public.content_versions,public.lessons,public.activities,public.profiles,public.mentor_profiles,public.workspaces,public.workspace_memberships,public.learner_progress,public.activity_attempts,public.review_items from anon, authenticated;
grant select on public.content_versions,public.lessons,public.activities to anon, authenticated;
grant select on public.profiles,public.mentor_profiles,public.workspaces,public.workspace_memberships,public.learner_progress,public.activity_attempts,public.review_items to authenticated;
-- Progress writes intentionally remain service-only until curriculum IDs and sync conflict rules are approved.
create policy published_versions on public.content_versions for select to anon,authenticated using(validation_status='validated' and activated_at<=now());
create policy published_lessons on public.lessons for select to anon,authenticated using(exists(select 1 from public.content_versions v where v.content_version_id=lessons.content_version_id));
create policy published_activities on public.activities for select to anon,authenticated using(exists(select 1 from public.lessons l where l.lesson_id=activities.lesson_id));
create policy authorized_profiles on public.profiles for select to authenticated using(baya_private.can_read_learner(profile_id));
create policy own_mentor on public.mentor_profiles for select to authenticated using(profile_id=baya_private.own_profile());
create policy authorized_workspaces on public.workspaces for select to authenticated using(baya_private.can_read_workspace(workspace_id));
create policy authorized_memberships on public.workspace_memberships for select to authenticated using(learner_profile_id=baya_private.own_profile() or baya_private.owns_workspace(workspace_id));
create policy authorized_progress on public.learner_progress for select to authenticated using(baya_private.can_read_learner(learner_profile_id));
create policy authorized_attempts on public.activity_attempts for select to authenticated using(baya_private.can_read_learner(learner_profile_id));
create policy authorized_reviews on public.review_items for select to authenticated using(baya_private.can_read_learner(learner_profile_id));

create function public.create_workspace(p_name text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare m uuid := baya_private.own_mentor(); w public.workspaces; i integer;
begin
 if m is null then raise exception 'unauthorized' using errcode='42501'; end if;
 if p_name is null or char_length(btrim(p_name)) not between 1 and 100 then raise exception 'invalid_name' using errcode='22023'; end if;
 for i in 1..5 loop
  begin
   insert into public.workspaces(mentor_profile_id,workspace_name,workspace_code)
   values(m,btrim(p_name),'BAYA-'||upper(left(replace(gen_random_uuid()::text,'-',''),12))) returning * into w;
   return to_jsonb(w)||jsonb_build_object('learnerCount',0);
  exception when unique_violation then null;
  end;
 end loop;
 raise exception 'conflict' using errcode='23505';
end $$;
create function public.list_owned_workspaces() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare m uuid := baya_private.own_mentor(); result jsonb;
begin
 if m is null then raise exception 'unauthorized' using errcode='42501'; end if;
 select coalesce(jsonb_agg(to_jsonb(w)||jsonb_build_object('learnerCount',(select count(*) from public.workspace_memberships wm where wm.workspace_id=w.workspace_id and wm.is_active)) order by w.created_at desc),'[]'::jsonb)
 into result from public.workspaces w where w.mentor_profile_id=m;
 return result;
end $$;
create function public.get_workspace_details(p_workspace_id uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare w public.workspaces;
begin
 if not baya_private.owns_workspace(p_workspace_id) then raise exception 'unauthorized' using errcode='42501'; end if;
 select * into w from public.workspaces where workspace_id=p_workspace_id;
 return to_jsonb(w)||jsonb_build_object('learnerCount',(select count(*) from public.workspace_memberships where workspace_id=p_workspace_id and is_active));
end $$;
create function public.join_workspace(p_code text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare p uuid := baya_private.own_profile(); w public.workspaces; membership public.workspace_memberships; inserted uuid;
begin
 if p is null or not exists(select 1 from public.profiles where profile_id=p and role='learner') then raise exception 'unauthorized' using errcode='42501'; end if;
 if p_code is null or upper(btrim(p_code)) !~ '^BAYA-[A-F0-9]{12}$' then raise exception 'invalid_code' using errcode='22023'; end if;
 select * into w from public.workspaces where workspace_code=upper(btrim(p_code)) for share;
 if not found then raise exception 'not_found' using errcode='P0002'; end if;
 if w.status<>'active' then raise exception 'inactive' using errcode='P0001'; end if;
 insert into public.workspace_memberships(learner_profile_id,workspace_id) values(p,w.workspace_id)
 on conflict(learner_profile_id,workspace_id) do nothing returning membership_id into inserted;
 select * into membership from public.workspace_memberships where learner_profile_id=p and workspace_id=w.workspace_id;
 -- Do not let a removed learner reactivate themselves by re-entering a code.
 if not membership.is_active then raise exception 'unauthorized' using errcode='42501'; end if;
 return jsonb_build_object('workspace',to_jsonb(w),'membership',to_jsonb(membership),'alreadyJoined',inserted is null);
end $$;
create function public.list_my_memberships() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare p uuid := baya_private.own_profile(); result jsonb;
begin
 if p is null or not exists(select 1 from public.profiles where profile_id=p and role='learner') then raise exception 'unauthorized' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('workspace',to_jsonb(w),'membership',to_jsonb(m),'alreadyJoined',true) order by m.joined_at desc),'[]'::jsonb)
 into result from public.workspace_memberships m join public.workspaces w using(workspace_id) where m.learner_profile_id=p;
 return result;
end $$;

-- Explicit ACLs: functions otherwise default to PUBLIC execution.
revoke all on all functions in schema baya_private from public,anon,authenticated;
grant usage on schema baya_private to authenticated;
grant execute on function baya_private.own_profile(),baya_private.own_mentor(),baya_private.owns_workspace(uuid),baya_private.can_read_workspace(uuid),baya_private.can_read_learner(uuid) to authenticated;
revoke all on function public.create_workspace(text),public.list_owned_workspaces(),public.get_workspace_details(uuid),public.join_workspace(text),public.list_my_memberships() from public,anon;
grant execute on function public.create_workspace(text),public.list_owned_workspaces(),public.get_workspace_details(uuid),public.join_workspace(text),public.list_my_memberships() to authenticated;
commit;
