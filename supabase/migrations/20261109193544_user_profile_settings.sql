begin;

create or replace function public.get_current_user_profile()
returns table (
	id uuid,
	name text,
	email text,
	role text
)
language sql
stable
security definer
set search_path = ''
as $$
	select app_user.id, app_user.name, app_user.email, app_user.role
	from public."user" as app_user
	where app_user.id = auth.uid();
$$;

revoke all on function public.get_current_user_profile() from public, anon;
grant execute on function public.get_current_user_profile() to authenticated;

create or replace function public.update_current_user_name(p_name text)
returns table (
	id uuid,
	name text,
	email text,
	role text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
	current_user_id uuid := auth.uid();
	clean_name text := nullif(pg_catalog.btrim(p_name), '');
	updated_id uuid;
	updated_name text;
	updated_email text;
	updated_role text;
begin
	if current_user_id is null then
		raise exception 'You must be signed in to update your profile.';
	end if;

	if clean_name is null then
		raise exception 'Your name cannot be empty.';
	end if;

	update public."user" as app_user
	set name = clean_name
	where app_user.id = current_user_id
	returning app_user.id, app_user.name, app_user.email, app_user.role
	into updated_id, updated_name, updated_email, updated_role;

	if not found then
		raise exception 'No app profile is linked to this account.';
	end if;

	return query
	select updated_id, updated_name, updated_email, updated_role;
end;
$$;

revoke all on function public.update_current_user_name(text) from public, anon;
grant execute on function public.update_current_user_name(text) to authenticated;

commit;
