begin;

create or replace function public.get_current_user_status()
returns text
language sql
stable
security definer
set search_path = ''
as $$
	select app_user.status
	from public."user" as app_user
	where app_user.id = auth.uid();
$$;

revoke all on function public.get_current_user_status() from public, anon;
grant execute on function public.get_current_user_status() to authenticated;

commit;
