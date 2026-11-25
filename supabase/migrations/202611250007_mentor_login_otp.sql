begin;
create or replace function baya_private.own_mentor() returns uuid language sql stable security definer set search_path = '' as $$
 select m.mentor_profile_id from public.mentor_profiles m join public.profiles p on p.profile_id=m.profile_id
 join auth.users u on u.id=p.auth_user_id
 where p.auth_user_id=(select auth.uid()) and p.role='mentor' and u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
 and exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) a where a->>'method'='otp')
$$;
commit;
