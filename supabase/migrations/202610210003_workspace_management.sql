-- Non-destructive workspace lifecycle, restricted to the verified owner.
begin;
create function public.update_workspace(p_workspace_id uuid,p_name text,p_status text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare w public.workspaces;
begin
 if not baya_private.owns_workspace(p_workspace_id) then raise exception 'unauthorized' using errcode='42501'; end if;
 if p_name is null or char_length(btrim(p_name)) not between 1 and 100 or p_status is null or p_status not in ('active','archived') then
  raise exception 'invalid_workspace' using errcode='22023';
 end if;
 update public.workspaces set workspace_name=btrim(p_name),status=p_status where workspace_id=p_workspace_id returning * into w;
 return to_jsonb(w)||jsonb_build_object('learnerCount',(select count(*) from public.workspace_memberships where workspace_id=p_workspace_id and is_active));
end $$;
create function public.set_workspace_member_active(p_workspace_id uuid,p_profile_id uuid,p_active boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not baya_private.owns_workspace(p_workspace_id) then raise exception 'unauthorized' using errcode='42501'; end if;
 if p_active is null then raise exception 'invalid_membership' using errcode='22023'; end if;
 update public.workspace_memberships set is_active=p_active where workspace_id=p_workspace_id and learner_profile_id=p_profile_id;
 if not found then raise exception 'not_found' using errcode='P0002'; end if;
end $$;
create function public.list_workspace_members(p_workspace_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not baya_private.owns_workspace(p_workspace_id) then raise exception 'unauthorized' using errcode='42501'; end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('profileId',p.profile_id,'displayName',p.display_name,'active',m.is_active) order by m.joined_at,m.membership_id),'[]'::jsonb)
 from public.workspace_memberships m join public.profiles p on p.profile_id=m.learner_profile_id where m.workspace_id=p_workspace_id);
end $$;
revoke all on function public.update_workspace(uuid,text,text),public.set_workspace_member_active(uuid,uuid,boolean),public.list_workspace_members(uuid) from public,anon;
grant execute on function public.update_workspace(uuid,text,text),public.set_workspace_member_active(uuid,uuid,boolean),public.list_workspace_members(uuid) to authenticated;
commit;
