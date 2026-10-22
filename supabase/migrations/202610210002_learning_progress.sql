-- Canonical IDs map the existing approved offline curriculum into cloud UUIDs.
begin;
alter table public.lessons add column source_key text;
alter table public.activities add column source_key text;
create unique index lessons_source_key on public.lessons(content_version_id,source_key);
create unique index activities_source_key on public.activities(lesson_id,source_key);
insert into public.content_versions(content_version_id,version_label,validation_status,activated_at) values ('10000000-0000-4000-8000-000000000001','version-baya-modules-1-to-3-v1','validated',now());
insert into public.lessons(lesson_id,content_version_id,source_key,stage_number,title) values ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','module-1',1,'Pagkilala sa Baybayin');
insert into public.activities(activity_id,lesson_id,source_key,activity_type,title,sequence_no) values ('30000000-0000-4000-8000-000000000101','20000000-0000-4000-8000-000000000001','topic-1-1','topic','Kasaysayan at Kahalagahan ng Baybayin',1);
insert into public.activities(activity_id,lesson_id,source_key,activity_type,title,sequence_no) values ('30000000-0000-4000-8000-000000000102','20000000-0000-4000-8000-000000000001','topic-1-2','topic','Baybayin: Isang Silabaryo (Pantigan)',2);
insert into public.activities(activity_id,lesson_id,source_key,activity_type,title,sequence_no) values ('30000000-0000-4000-8000-000000000103','20000000-0000-4000-8000-000000000001','topic-1-3','topic','Ang 17 Simbolo ng Baybayin',3);
insert into public.activities(activity_id,lesson_id,source_key,activity_type,title,sequence_no) values ('30000000-0000-4000-8000-000000000104','20000000-0000-4000-8000-000000000001','topic-1-4','topic','Magkaibang Letra, Iisang Simbolo?',4);
insert into public.activities(activity_id,lesson_id,source_key,activity_type,title,sequence_no) values ('30000000-0000-4000-8000-000000000105','20000000-0000-4000-8000-000000000001','topic-1-5','topic','Paano naman ang Da at Ra?',5);
insert into public.lessons(lesson_id,content_version_id,source_key,stage_number,title) values ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','module-2',2,'Baybayin Characters');
insert into public.activities(activity_id,lesson_id,source_key,activity_type,title,sequence_no) values ('30000000-0000-4000-8000-000000000201','20000000-0000-4000-8000-000000000002','topic-2-1','topic','Ang mga Patinig',1);
insert into public.activities(activity_id,lesson_id,source_key,activity_type,title,sequence_no) values ('30000000-0000-4000-8000-000000000202','20000000-0000-4000-8000-000000000002','topic-2-2','topic','Kilalanin ang mga Katinig',2);
insert into public.lessons(lesson_id,content_version_id,source_key,stage_number,title) values ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','module-3',3,'Pagsusulat ng Baybayin');
insert into public.activities(activity_id,lesson_id,source_key,activity_type,title,sequence_no) values ('30000000-0000-4000-8000-000000000301','20000000-0000-4000-8000-000000000003','topic-3-1','topic','Mga Patinig',1);
insert into public.activities(activity_id,lesson_id,source_key,activity_type,title,sequence_no) values ('30000000-0000-4000-8000-000000000302','20000000-0000-4000-8000-000000000003','topic-3-2','topic','Mga Katinig',2);

create unique index completed_topic_once on public.activity_attempts(learner_profile_id,activity_id) where result_status='completed';
create index active_membership_pages on public.workspace_memberships(workspace_id,joined_at,membership_id) where is_active;

-- Bounded cumulative completion upload. The server owns IDs, authorization and receipt time.
create function public.sync_learning_progress(p_version text,p_name text,p_completed jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p uuid:=baya_private.own_profile(); item jsonb; a uuid; finished timestamptz; receipt timestamptz:=now();
begin
 if p is null or not exists(select 1 from public.profiles where profile_id=p and role='learner') then raise exception 'unauthorized' using errcode='42501'; end if;
 perform 1 from public.profiles where profile_id=p for update;
 -- Serialize against revocation/archive while sharing the same snapshot with active mentors.
 perform 1 from public.workspace_memberships m join public.workspaces w using(workspace_id)
 where m.learner_profile_id=p and m.is_active and w.status='active' for share of m,w;
 if not found then raise exception 'inactive' using errcode='P0001'; end if;
 if p_version is distinct from 'version-baya-modules-1-to-3-v1'
 or jsonb_typeof(p_completed) is distinct from 'array' then raise exception 'unsupported_snapshot' using errcode='22023'; end if;
 if jsonb_array_length(p_completed)>9 or p_name is null or char_length(btrim(p_name)) not between 1 and 100 then raise exception 'invalid_snapshot' using errcode='22023'; end if;
 for item in select value from jsonb_array_elements(p_completed) loop
  select act.activity_id into a from public.activities act join public.lessons l using(lesson_id)
  join public.content_versions v using(content_version_id)
  where act.source_key=item->>'topicKey' and v.version_label=p_version and v.validation_status='validated' and v.activated_at<=now();
  if a is null then raise exception 'unknown_topic' using errcode='22023'; end if;
  finished:=(item->>'completedAt')::timestamptz;
  if finished is null or not isfinite(finished) then raise exception 'invalid_time' using errcode='22023'; end if;
  finished:=least(finished,receipt);
  insert into public.activity_attempts(learner_profile_id,activity_id,result_status,attempted_at)
  values(p,a,'completed',finished)
  on conflict(learner_profile_id,activity_id) where result_status='completed'
  do update set attempted_at=least(public.activity_attempts.attempted_at,excluded.attempted_at);
 end loop;
 insert into public.learner_progress(learner_profile_id,lesson_id,status,completed_at,last_activity_at,updated_at)
 select p,l.lesson_id,case when count(done.attempt_id)=count(act.activity_id) then 'completed' else 'in_progress' end,
 case when count(done.attempt_id)=count(act.activity_id) then max(done.attempted_at) else null end,max(done.attempted_at),receipt
 from public.lessons l join public.content_versions v using(content_version_id)
 join public.activities act using(lesson_id)
 left join public.activity_attempts done on done.activity_id=act.activity_id and done.learner_profile_id=p and done.result_status='completed'
 where v.version_label=p_version group by l.lesson_id having count(done.attempt_id)>0
 on conflict(learner_profile_id,lesson_id) do update set status=excluded.status,completed_at=excluded.completed_at,last_activity_at=excluded.last_activity_at,updated_at=excluded.updated_at;
 update public.profiles set display_name=btrim(p_name),updated_at=receipt where profile_id=p;
 update public.workspace_memberships m set last_synced_at=receipt from public.workspaces w
 where m.workspace_id=w.workspace_id and m.learner_profile_id=p and m.is_active and w.status='active';
 return jsonb_build_object('syncedAt',receipt);
end $$;

create function baya_private.progress_summary(p uuid,synced timestamptz) returns jsonb
language sql stable security definer set search_path='' as $$
 with topics as (
 select a.activity_id,a.title,l.stage_number,a.sequence_no,done.attempted_at
 from public.activities a join public.lessons l using(lesson_id) join public.content_versions v using(content_version_id)
 left join public.activity_attempts done on done.activity_id=a.activity_id and done.learner_profile_id=p and done.result_status='completed'
 where v.version_label='version-baya-modules-1-to-3-v1'
 order by l.stage_number,a.sequence_no
 )
 select jsonb_build_object('profileId',p,'displayName',(select display_name from public.profiles where profile_id=p),
 'lastSyncedAt',synced,'completedTopics',count(attempted_at),'totalTopics',count(*),
 'percentage',case when synced is null then null else round(100.0*count(attempted_at)/nullif(count(*),0)) end,
 'currentTopic',case when synced is null then 'Not synchronized yet' else coalesce((select title from topics where attempted_at is null order by stage_number,sequence_no limit 1),'All topics completed') end,
 'stage',coalesce((select stage_number from topics where attempted_at is null order by stage_number,sequence_no limit 1),3),'totalStages',3)
 from topics
$$;
revoke all on function baya_private.progress_summary(uuid,timestamptz) from public,anon,authenticated;

create function public.get_progress_dashboard(p_workspace_id uuid,p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare w public.workspaces; total integer; latest timestamptz; learners jsonb;
begin
 if not baya_private.owns_workspace(p_workspace_id) then raise exception 'unauthorized' using errcode='42501'; end if;
 if p_offset is null or p_offset<0 then raise exception 'invalid_offset' using errcode='22023'; end if;
 select * into w from public.workspaces where workspace_id=p_workspace_id;
 if w.status<>'active' then raise exception 'inactive' using errcode='P0001'; end if;
 select count(*),max(last_synced_at) into total,latest from public.workspace_memberships where workspace_id=p_workspace_id and is_active;
 select coalesce(jsonb_agg(baya_private.progress_summary(m.learner_profile_id,m.last_synced_at) order by m.joined_at,m.membership_id),'[]'::jsonb)
 into learners from (select * from public.workspace_memberships where workspace_id=p_workspace_id and is_active order by joined_at,membership_id limit 50 offset p_offset) m;
 return jsonb_build_object('workspace',to_jsonb(w),'learnerCount',total,'lastSyncedAt',latest,'learners',learners,'nextOffset',case when p_offset+50<total then p_offset+50 else null end);
end $$;

create function public.get_learner_progress(p_workspace_id uuid,p_profile_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare synced timestamptz; topics jsonb;
begin
 if not baya_private.owns_workspace(p_workspace_id) then raise exception 'unauthorized' using errcode='42501'; end if;
 select m.last_synced_at into synced from public.workspace_memberships m join public.workspaces w using(workspace_id)
 where m.workspace_id=p_workspace_id and m.learner_profile_id=p_profile_id and m.is_active and w.status='active';
 if not found then raise exception 'unauthorized' using errcode='42501'; end if;
 select jsonb_agg(jsonb_build_object('topicKey',a.source_key,'title',a.title,'moduleTitle',l.title,'completedAt',case when synced is null then null else done.attempted_at end) order by l.stage_number,a.sequence_no)
 into topics from public.activities a join public.lessons l using(lesson_id) join public.content_versions v using(content_version_id)
 left join public.activity_attempts done on done.activity_id=a.activity_id and done.learner_profile_id=p_profile_id and done.result_status='completed'
 where v.version_label='version-baya-modules-1-to-3-v1';
 return jsonb_build_object('learner',baya_private.progress_summary(p_profile_id,synced),'topics',topics);
end $$;
revoke all on function public.sync_learning_progress(text,text,jsonb),public.get_progress_dashboard(uuid,integer),public.get_learner_progress(uuid,uuid) from public,anon;
grant execute on function public.sync_learning_progress(text,text,jsonb),public.get_progress_dashboard(uuid,integer),public.get_learner_progress(uuid,uuid) to authenticated;
commit;
