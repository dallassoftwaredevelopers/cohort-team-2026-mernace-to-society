begin;

create function public.require_verified_email_for_activation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	if new.status = 'active' and old.status is distinct from 'active'
		and not exists (
			select 1 from auth.users as auth_user
			where auth_user.id = new.id
				and auth_user.email_confirmed_at is not null
		)
	then
		raise exception using
			errcode = '23514',
			message = 'The member must verify their email before activation.';
	end if;
	return new;
end;
$$;

revoke all on function public.require_verified_email_for_activation()
	from public, anon, authenticated;

create trigger require_verified_email_for_activation
	before update of status on public."user"
	for each row execute function public.require_verified_email_for_activation();

commit;
