-- Run against an isolated, migrated test database; all fixture changes roll back.
begin;

insert into auth.users (id, email, raw_user_meta_data)
values (
	'c57f7550-b088-43f9-a300-901d36cc3c9b',
	'pending-signup-test@example.invalid',
	'{"name":" Pending Test ", "role":"admin", "status":"active"}'::jsonb
);

do $$
begin
	if not exists (
		select 1 from public."user" as app_user
		join public.organization as organization on organization.id = app_user.org_id
		where app_user.id = 'c57f7550-b088-43f9-a300-901d36cc3c9b'
			and app_user.name = 'Pending Test'
			and app_user.role = 'staff'
			and app_user.status = 'inactive'
	) then
		raise exception 'Signup did not create the expected inactive staff profile.';
	end if;

	begin
		insert into auth.users (id, email, raw_user_meta_data)
		values (
			'6a91a19a-88b6-404b-9eaa-fe66b6c17721',
			'pending-signup-test@example.invalid',
			'{"name":"Duplicate"}'::jsonb
		);
		raise exception 'Duplicate email was accepted.';
	exception when unique_violation then
		null;
	end;
end;
$$;

set local role authenticated;
select pg_catalog.set_config('request.jwt.claim.sub', 'c57f7550-b088-43f9-a300-901d36cc3c9b', true);

do $$
begin
	if public.get_current_user_status() <> 'inactive' then
		raise exception 'Pending user status is incorrect.';
	end if;
	if exists (select 1 from public.organization)
		or exists (select 1 from public."user")
		or exists (select 1 from storage.objects where bucket_id = 'invoices')
		or exists (select 1 from public.get_approval_history())
		or exists (select 1 from public.get_current_organization())
		or public.can_approve_bills()
	then
		raise exception 'An inactive user could access protected data.';
	end if;

	begin
		perform public.update_current_user_name('Blocked change');
		raise exception 'An inactive user could change their profile.';
	exception when raise_exception then
		if sqlerrm = 'An inactive user could change their profile.' then
			raise;
		end if;
	end;
end;
$$;

reset role;
do $$
begin
	begin
		update public."user" set status = 'active'
		where id = 'c57f7550-b088-43f9-a300-901d36cc3c9b';
		raise exception 'An unverified user was activated.';
	exception when check_violation then
		null;
	end;
end;
$$;

update auth.users set email_confirmed_at = pg_catalog.now()
where id = 'c57f7550-b088-43f9-a300-901d36cc3c9b';
update public."user" set status = 'active'
where id = 'c57f7550-b088-43f9-a300-901d36cc3c9b';
set local role authenticated;

do $$
begin
	if public.get_current_user_status() <> 'active'
		or not exists (select 1 from public.organization)
	then
		raise exception 'Approved user cannot access their organization.';
	end if;
end;
$$;

rollback;
