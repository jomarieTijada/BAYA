-- Read/rollback-only checks against the live request created through the UI.
-- Claims simulate database authorization; browser evidence verifies actual Auth.
begin;
select set_config('request.jwt.claim.sub',p.auth_user_id::text,true)
from public.profiles p join public.workspace_join_requests r on r.learner_profile_id=p.profile_id
where r.request_id='378b1a84-f6bf-4710-9168-b584e5512f8c';
set local role authenticated;
do $$
begin
 if jsonb_array_length(public.list_my_join_requests())<>2 then raise exception 'history missing'; end if;
 if public.request_workspace_join('BAYA-470A561B64D5')->>'kind'<>'already_member' then raise exception 'membership retry failed'; end if;
 begin
  update public.workspace_join_requests set status='approved' where request_id='5187a252-2083-4a1f-87f6-dc44ba1de275';
  raise exception 'direct update was allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.workspace_memberships(learner_profile_id,workspace_id) values(baya_private.own_profile(),'de32cf40-c58c-455b-b571-af6903e69cd5');
  raise exception 'direct membership insert was allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform public.review_workspace_join_request('378b1a84-f6bf-4710-9168-b584e5512f8c','approved');
  raise exception 'learner review was allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform public.list_workspace_join_requests('de32cf40-c58c-455b-b571-af6903e69cd5');
  raise exception 'learner owner-list was allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform public.join_workspace('BAYA-216801732D41');
  raise exception 'legacy instant join was allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000099',true);
set local role authenticated;
do $$
begin
 if exists(select 1 from public.workspace_join_requests) then raise exception 'unrelated identity could read requests'; end if;
 begin
  perform public.review_workspace_join_request('378b1a84-f6bf-4710-9168-b584e5512f8c','approved');
  raise exception 'unrelated review was allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$
begin
 begin
  perform public.request_workspace_join('BAYA-470A561B64D5');
  raise exception 'unauthenticated join was allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: 10 live database authorization checks; transaction rolled back' as result;
rollback;
