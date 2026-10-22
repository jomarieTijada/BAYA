import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Real PostgreSQL engine; minimal Auth stubs only. No network or project credentials.
const db = new PGlite();
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const scalar = async sql => (await db.query(sql)).rows[0].value;
const denied = async (sql, code = '42501') => {
  await assert.rejects(() => db.query(sql), error => error.code === code); checks++;
};
const asUser = async (id, role = 'authenticated') => {
  await db.exec(`reset role; set request.jwt.claim.sub = '${id}'; set role ${role};`);
};
try {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}', is_anonymous boolean default false, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema public,auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
  `);
  await db.exec(await readFile(new URL('../supabase/migrations/202610210001_baya_cloud.sql', import.meta.url), 'utf8'));
  const ids = Array.from({ length: 5 }, (_, i) => `00000000-0000-4000-8000-00000000000${i + 1}`);
  await db.exec(`insert into auth.users(id,is_anonymous,email_confirmed_at,raw_user_meta_data) values
    ('${ids[0]}',false,now(),'{"display_name":"Mentor A"}'),
    ('${ids[1]}',false,now(),'{"display_name":"Mentor B"}'),
    ('${ids[2]}',true,null,'{"display_name":"Learner A","role":"mentor"}'),
    ('${ids[3]}',true,null,'{"display_name":"Learner B"}'),
    ('${ids[4]}',false,null,'{}');`);
  check(await scalar(`select count(*)::integer as value from public.profiles`) === 5, 'Auth trigger creates profiles');
  check(await scalar(`select role as value from public.profiles where auth_user_id='${ids[2]}'`) === 'learner', 'Role metadata cannot grant mentor access');
  check(await scalar(`select count(*)::integer as value from public.mentor_profiles`) === 3, 'Only permanent accounts have mentor profiles');
  await asUser(ids[4]);
  await denied(`select public.create_workspace('Unverified')`);
  await asUser(ids[0]);
  const workspace = await scalar(`select public.create_workspace('  Workshop A  ') as value`);
  check(workspace.workspace_name === 'Workshop A' && /^BAYA-[A-F0-9]{12}$/.test(workspace.workspace_code), 'Server trims name and generates code');
  check(workspace.learnerCount === 0, 'New workspace has no learners');
  await denied(`select public.create_workspace(' ')`, '22023');
  await denied(`update public.profiles set role='learner'`);
  await denied(`insert into public.workspaces(mentor_profile_id,workspace_name,workspace_code) values('${workspace.mentor_profile_id}','Forged','BAYA-000000000000')`);
  check((await scalar(`select public.list_owned_workspaces() as value`)).length === 1, 'Owner lists own workspace');
  await asUser(ids[1]);
  check((await scalar(`select public.list_owned_workspaces() as value`)).length === 0, 'Other mentor has empty list');
  check(await scalar(`select count(*)::integer as value from public.workspaces`) === 0, 'RLS hides other workspace');
  await denied(`select public.get_workspace_details('${workspace.workspace_id}')`);
  await denied(`select public.join_workspace('${workspace.workspace_code}')`);
  await asUser(ids[2]);
  await denied(`select public.create_workspace('Learner attack')`);
  check(await scalar(`select count(*)::integer as value from public.workspaces`) === 0, 'Learner cannot list workspace before join');
  await denied(`select public.join_workspace('BAD')`, '22023');
  await denied(`select public.join_workspace('BAYA-000000000000')`, 'P0002');
  const membership = await scalar(`select public.join_workspace(' ${workspace.workspace_code.toLowerCase()} ') as value`);
  check(!membership.alreadyJoined && membership.membership.is_active, 'Join creates active membership');
  check((await scalar(`select public.join_workspace('${workspace.workspace_code}') as value`)).alreadyJoined, 'Duplicate join is idempotent');
  check((await scalar(`select public.list_my_memberships() as value`)).length === 1, 'Learner sees membership');
  check(await scalar(`select count(*)::integer as value from public.workspaces`) === 1, 'Joined learner sees workspace');
  await denied(`select public.get_workspace_details('${workspace.workspace_id}')`);
  await denied(`update public.workspace_memberships set learner_profile_id=gen_random_uuid()`);
  await asUser(ids[3]);
  check((await scalar(`select public.list_my_memberships() as value`)).length === 0, 'Other learner cannot see membership');
  check(await scalar(`select count(*)::integer as value from public.profiles`) === 1, 'Other learner only sees own profile');
  await asUser(ids[0]);
  check((await scalar(`select public.get_workspace_details('${workspace.workspace_id}') as value`)).learnerCount === 1, 'Owner count uses real active membership');
  check(await scalar(`select count(*)::integer as value from public.profiles`) === 2, 'Owner sees own and joined learner profile');
  await db.exec(`reset role;
    insert into public.content_versions(version_label,validation_status,activated_at) values ('draft','draft',now()),('approved','validated',now());
    insert into public.lessons(content_version_id,stage_number,title) select content_version_id,1,version_label from public.content_versions;
    insert into public.activities(lesson_id,activity_type,title,sequence_no) select lesson_id,'writing',title,1 from public.lessons;
    insert into public.learner_progress(learner_profile_id,lesson_id,status) select '${membership.membership.learner_profile_id}',lesson_id,'complete' from public.lessons;
  `);
  await asUser(ids[0]);
  check(await scalar(`select count(*)::integer as value from public.learner_progress`) === 2, 'Owner can read joined learner progress');
  await asUser(ids[1]);
  check(await scalar(`select count(*)::integer as value from public.learner_progress`) === 0, 'Other mentor cannot read learner progress');
  await asUser(ids[2]);
  await denied(`delete from public.learner_progress`);
  await db.exec(`reset role; update public.workspace_memberships set is_active=false;`);
  await asUser(ids[2]);
  await denied(`select public.join_workspace('${workspace.workspace_code}')`);
  check(await scalar(`select count(*)::integer as value from public.workspaces`) === 0, 'Removed membership loses direct workspace access');
  await asUser(ids[0]);
  check(await scalar(`select count(*)::integer as value from public.learner_progress`) === 0, 'Removed membership revokes mentor progress access');
  await db.exec(`reset role; update public.workspaces set status='archived';`);
  await asUser(ids[3]);
  await denied(`select public.join_workspace('${workspace.workspace_code}')`, 'P0001');
  await asUser('', 'anon');
  await denied(`select public.list_owned_workspaces()`);
  await denied(`select * from public.profiles`);
  check(await scalar(`select count(*)::integer as value from public.content_versions`) === 1, 'Public sees only activated validated content');
  check(await scalar(`select count(*)::integer as value from public.lessons`) === 1, 'Draft lessons hidden');
  check(await scalar(`select count(*)::integer as value from public.activities`) === 1, 'Draft activities hidden');
  console.log(`PASS: ${checks} PostgreSQL migration, RLS, identity and workspace assertions.`);
} finally { await db.close(); }
