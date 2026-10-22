-- Role is chosen at account creation, then remains server-owned.
-- A learner request may only reduce the default self-registered mentor role.
begin;
create or replace function baya_private.create_auth_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare p uuid; learner boolean := coalesce(new.is_anonymous,false) or new.raw_user_meta_data->>'account_type'='learner';
begin
 insert into public.profiles(auth_user_id,display_name,role)
 values(new.id,left(coalesce(nullif(btrim(new.raw_user_meta_data->>'display_name'),''),case when learner then 'Learner' else 'Mentor' end),100),case when learner then 'learner' else 'mentor' end)
 returning profile_id into p;
 if not coalesce(learner,false) then insert into public.mentor_profiles(profile_id) values(p); end if;
 return new;
end $$;
create or replace function baya_private.own_profile() returns uuid language sql stable security definer set search_path='' as $$
 select p.profile_id from public.profiles p join auth.users u on u.id=p.auth_user_id
 where p.auth_user_id=(select auth.uid()) and (u.email_confirmed_at is not null or coalesce(u.is_anonymous,false))
$$;
commit;
