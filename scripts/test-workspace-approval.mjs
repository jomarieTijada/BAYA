// Isolated PostgreSQL/WASM security tests; no hosted data or credentials.
// Uses the repository's existing PGlite development dependency.
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; console.log(`PASS ${message}`); };
await db.exec(`create role anon; create role authenticated; create schema auth;
create table auth.users(id uuid primary key,is_anonymous boolean,email_confirmed_at timestamptz,raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema public,auth to authenticated,anon;
grant execute on function auth.uid() to authenticated,anon;`);
const migration = '202610250005_workspace_join_requests.sql';
for (const file of (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql') && f !== migration).sort()) {
  await db.exec(await readFile(`supabase/migrations/${file}`, 'utf8'));
}
const ids = ['10000000-1111-4111-8111-000000000001','10000000-1111-4111-8111-000000000002','10000000-1111-4111-8111-000000000003','10000000-1111-4111-8111-000000000004'];
for (let i = 0; i < ids.length; i++) await db.query('insert into auth.users values($1,$2,$3,$4)', [ids[i], i >= 2, i < 2 ? new Date().toISOString() : null, JSON.stringify({ display_name: `Test ${i}` })]);
const profiles = (await db.query('select auth_user_id,profile_id from public.profiles')).rows;
const profile = i => profiles.find(p => p.auth_user_id === ids[i]).profile_id;
async function as(i, sql, args = []) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [i === null ? '' : ids[i]]);
  await db.exec(`set role ${i === null ? 'anon' : 'authenticated'}`);
  try { return (await db.query(sql, args)).rows; } finally { await db.exec('reset role'); }
}
async function denied(i, sql, args, label, code = '42501') {
  let error; try { await as(i, sql, args); } catch (e) { error = e; }
  check(error?.code === code, `${label} (${error?.code})`);
}
const scalar = rows => rows[0].result;
const legacyWorkspace = scalar(await as(0, "select public.create_workspace('Existing approved workspace') as result"));
const legacyMember = scalar(await as(2, 'select public.join_workspace($1) as result', [legacyWorkspace.workspace_code])).membership;
await db.exec(await readFile(`supabase/migrations/${migration}`, 'utf8'));
check((await db.query('select membership_id from public.workspace_memberships where membership_id=$1', [legacyMember.membership_id])).rows.length === 1, 'Migration preserves existing approved membership');
// Keep this legacy workspace archived so it does not authorize pending-only sync tests.
await as(0, 'select public.update_workspace($1,$2,$3)', [legacyWorkspace.workspace_id, 'Existing approved workspace', 'archived']);
const w = scalar(await as(0, "select public.create_workspace('Approval test') as result"));
const code = w.workspace_code;
await denied(null, 'select public.request_workspace_join($1)', [code], 'Unauthenticated join denied');
await denied(0, 'select public.request_workspace_join($1)', [code], 'Mentor cannot join as learner');
await denied(2, 'select public.request_workspace_join($1)', ['BAYA-000000000000'], 'Unknown code rejected', '22023');
const pending = scalar(await as(2, 'select public.request_workspace_join($1) as result', [` ${code.toLowerCase()} `]));
check(pending.kind === 'request_submitted' && pending.request.status === 'pending', 'Normalized code creates pending request');
const request = pending.request.request_id;
check((await db.query('select * from public.workspace_memberships where workspace_id=$1', [w.workspace_id])).rows.length === 0, 'Pending request creates no membership');
check(scalar(await as(2, 'select public.request_workspace_join($1) as result', [code])).kind === 'already_pending', 'Retry deduplicates pending request');
check((await db.query('select * from public.workspace_join_requests')).rows.length === 1, 'Exactly one pending row');
await denied(2, 'update public.workspace_join_requests set status=$1 where request_id=$2', ['approved', request], 'Learner cannot self-approve');
await denied(2, 'insert into public.workspace_join_requests(workspace_id,learner_profile_id) values($1,$2)', [w.workspace_id, profile(3)], 'Learner cannot impersonate another profile');
await denied(2, 'insert into public.workspace_memberships(workspace_id,learner_profile_id) values($1,$2)', [w.workspace_id, profile(2)], 'Direct active membership insert denied');
await denied(2, 'select public.review_workspace_join_request($1,$2)', [request, 'approved'], 'Learner approval RPC denied');
await denied(1, 'select public.review_workspace_join_request($1,$2)', [request, 'approved'], 'Unrelated mentor approval denied');
await denied(1, 'select public.list_workspace_join_requests($1)', [w.workspace_id], 'Unrelated mentor listing denied');
check((await as(1, 'select * from public.workspace_join_requests')).length === 0, 'Unrelated mentor RLS hides requests');
check((await as(3, 'select * from public.workspace_join_requests')).length === 0, 'Other learner RLS hides requests');
check((await as(3, 'select * from public.profiles where profile_id=$1', [profile(2)])).length === 0, 'Other learner cannot resolve another cloud profile by UUID');
await denied(2, 'update public.profiles set role=$1 where profile_id=$2', ['mentor', profile(2)], 'Learner cannot promote own role');
check((await as(2, 'select * from public.workspaces where workspace_id=$1', [w.workspace_id])).length === 0, 'Pending learner cannot read private workspace');
await denied(2, 'select public.sync_learning_progress($1,$2,$3)', ['version-baya-modules-1-to-3-v1', 'Test learner', '[]'], 'Pending learner cannot sync', 'P0001');
const counts = scalar(await as(0, 'select public.list_owned_workspaces() as result')).find(row => row.workspace_id === w.workspace_id);
check(counts.pendingCount === 1 && counts.learnerCount === 0, 'Pending and active counts separate');
const approved = scalar(await as(0, 'select public.review_workspace_join_request($1,$2) as result', [request, 'approved']));
check(approved.request.status === 'approved' && approved.membership.is_active, 'Owner approval atomically activates membership');
await as(0, 'select public.review_workspace_join_request($1,$2)', [request, 'approved']);
check((await db.query('select * from public.workspace_memberships where workspace_id=$1', [w.workspace_id])).rows.length === 1, 'Approval retry is idempotent');
await denied(0, 'select public.review_workspace_join_request($1,$2)', [request, 'rejected'], 'Conflicting review rejected', '40001');
check(scalar(await as(2, 'select public.request_workspace_join($1) as result', [code])).kind === 'already_member', 'Approved learner receives active receipt');
check(scalar(await as(2, 'select public.list_my_join_requests() as result'))[0].status === 'approved', 'Learner reads authoritative approval');
check(scalar(await as(0, 'select public.list_workspace_members($1) as result', [w.workspace_id])).length === 1, 'Approved member appears in mentor list');
await as(2, 'select public.sync_learning_progress($1,$2,$3)', ['version-baya-modules-1-to-3-v1', 'Test learner', '[]']);
check((await as(1, 'select * from public.profiles where profile_id=$1', [profile(2)])).length === 0, 'Unrelated mentor cannot read approved learner profile');
checks++; console.log('PASS Approved learner sync authorized');
const second = scalar(await as(3, 'select public.request_workspace_join($1) as result', [code])).request;
await as(0, 'select public.review_workspace_join_request($1,$2)', [second.request_id, 'rejected']);
check((await db.query('select * from public.workspace_memberships where learner_profile_id=$1', [profile(3)])).rows.length === 0, 'Rejection creates no membership');
const reapply = scalar(await as(3, 'select public.request_workspace_join($1) as result', [code]));
check(reapply.request.request_id !== second.request_id, 'Reapplication preserves rejected history');
await db.exec(`create function public.fail_test_membership() returns trigger language plpgsql as $$begin raise exception 'injected failure' using errcode='23514'; end$$;
create trigger fail_membership before insert on public.workspace_memberships for each row execute function public.fail_test_membership();`);
await denied(0, 'select public.review_workspace_join_request($1,$2)', [reapply.request.request_id, 'approved'], 'Membership failure aborts approval', '23514');
check((await db.query('select status from public.workspace_join_requests where request_id=$1', [reapply.request.request_id])).rows[0].status === 'pending', 'Approval transaction rolls back request status');
await db.exec('drop trigger fail_membership on public.workspace_memberships; drop function public.fail_test_membership();');
await denied(3, 'select public.join_workspace($1)', [code], 'Legacy instant-join path denied');
await as(0, 'select public.update_workspace($1,$2,$3)', [w.workspace_id, 'Approval test', 'archived']);
await denied(0, 'select public.review_workspace_join_request($1,$2)', [reapply.request.request_id, 'approved'], 'Archived workspace cannot approve', 'P0001');
check((await db.query('select status from public.workspace_join_requests where request_id=$1', [reapply.request.request_id])).rows[0].status === 'pending', 'Failed approval leaves request pending');
console.log(`${checks} database/security checks passed. PGlite serializes calls; concurrent multi-connection race testing remains separate.`);
await db.close();
