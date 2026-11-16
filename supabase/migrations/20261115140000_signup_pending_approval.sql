begin;

-- Do not silently duplicate profile creation configured outside this repository.
do $$
begin
	if exists (
		select 1
		from pg_catalog.pg_trigger as trigger
		join pg_catalog.pg_proc as proc on proc.oid = trigger.tgfoid
		join pg_catalog.pg_namespace as namespace on namespace.oid = proc.pronamespace
		where trigger.tgrelid = 'auth.users'::regclass
			and not trigger.tgisinternal
			and (trigger.tgtype & 4) <> 0
			and namespace.nspname = 'public'
	) then
		raise exception 'An Auth user insert trigger already exists in public. Review it before installing signup profile creation.';
	end if;
end;
$$;

create function public.create_pending_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
	organization_id uuid;
	organization_count bigint;
	clean_name text := nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'name'), '');
begin
	select count(*), (pg_catalog.array_agg(id))[1]
	into organization_count, organization_id
	from public.organization;

	if organization_count <> 1 then
		raise exception 'Signup requires exactly one organization.';
	end if;
	if new.email is null or clean_name is null or pg_catalog.length(clean_name) > 150 then
		raise exception 'A valid email and name are required for signup.';
	end if;

	insert into public."user" (id, name, email, role, status, org_id)
	values (new.id, clean_name, new.email, 'staff', 'inactive', organization_id);
	return new;
end;
$$;

revoke all on function public.create_pending_user_profile() from public, anon, authenticated;

create trigger create_pending_user_profile
	after insert on auth.users
	for each row execute function public.create_pending_user_profile();

create function public.is_current_user_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select exists (
		select 1 from public."user" as app_user
		where app_user.id = auth.uid() and app_user.status = 'active'
	);
$$;

revoke all on function public.is_current_user_active() from public, anon;
grant execute on function public.is_current_user_active() to authenticated;

-- Restrictive policies are combined with existing policies using AND.
do $$
declare
	app_table record;
begin
	for app_table in
		select class.relname, class.relrowsecurity
		from pg_catalog.pg_class as class
		join pg_catalog.pg_namespace as namespace on namespace.oid = class.relnamespace
		where namespace.nspname = 'public'
			and class.relkind in ('r', 'p')
	loop
		if not app_table.relrowsecurity then
			raise exception 'Enable and review row level security on public.% before installing inactive-account protection.', app_table.relname;
		end if;
		execute pg_catalog.format(
			'create policy active_account_required on public.%I as restrictive for all to authenticated using (public.is_current_user_active()) with check (public.is_current_user_active())',
			app_table.relname
		);
	end loop;
end;
$$;

create policy active_account_required on storage.objects
	as restrictive for all to authenticated
	using (bucket_id <> 'invoices' or public.is_current_user_active())
	with check (bucket_id <> 'invoices' or public.is_current_user_active());

-- These functions use SECURITY DEFINER and therefore bypass table policies.
create or replace function public.update_current_user_name(p_name text)
returns table (id uuid, name text, email text, role text)
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
	where app_user.id = current_user_id and app_user.status = 'active'
	returning app_user.id, app_user.name, app_user.email, app_user.role
	into updated_id, updated_name, updated_email, updated_role;
	if not found then
		raise exception 'No active app profile is linked to this account.';
	end if;

	return query select updated_id, updated_name, updated_email, updated_role;
end;
$$;

create or replace function public.can_approve_bills()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select exists (
		select 1 from public."user" as app_user
		where app_user.id = auth.uid()
			and app_user.status = 'active'
			and app_user.role in ('manager', 'admin')
	);
$$;

create or replace function public.get_approval_history()
returns table (
	id uuid, bill_id uuid, invoice_number text, action text,
	from_status text, to_status text, note text, created_at timestamptz,
	actor_name text, amount numeric
)
language sql
stable
security definer
set search_path = ''
as $$
	select history.id, history.bill_id, bill.invoice_number, history.action,
		history.from_status, history.to_status, history.note, history.created_at,
		app_user.name as actor_name, bill.amount
	from public.audit_trail as history
	join public.bill as bill on bill.id = history.bill_id
	left join public."user" as app_user on app_user.id = history.user_id
	where public.is_current_user_active()
	order by history.created_at desc;
$$;

create or replace function public.is_current_user_organization_member(p_organization_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
	select exists (
		select 1 from public."user" as app_user
		where app_user.id = auth.uid() and app_user.status = 'active'
			and app_user.org_id = p_organization_id
	);
$$;

create or replace function public.is_current_user_organization_admin(p_organization_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
	select exists (
		select 1 from public."user" as app_user
		where app_user.id = auth.uid() and app_user.status = 'active'
			and app_user.org_id = p_organization_id and app_user.role = 'admin'
	);
$$;

create or replace function public.get_current_organization()
returns table (id uuid, name text, street text, city text, state text, zip text, phone text)
language sql stable security definer set search_path = ''
as $$
	select organization.id, organization.name, organization.street,
		organization.city, organization.state, organization.zip, organization.phone
	from public.organization as organization
	join public."user" as app_user on app_user.org_id = organization.id
	where app_user.id = auth.uid() and app_user.status = 'active';
$$;

create or replace function public.update_current_organization(
	p_name text, p_street text, p_city text, p_state text, p_zip text, p_phone text
)
returns table (id uuid, name text, street text, city text, state text, zip text, phone text)
language plpgsql security definer set search_path = ''
as $$
declare
	current_user_id uuid := auth.uid();
	current_org_id uuid;
	clean_name text := nullif(pg_catalog.btrim(p_name), '');
	updated_organization public.organization%rowtype;
begin
	if current_user_id is null then
		raise exception using errcode = '42501', message = 'You must be signed in to update organization settings.';
	end if;

	select app_user.org_id into current_org_id
	from public."user" as app_user
	where app_user.id = current_user_id and app_user.role = 'admin'
		and app_user.status = 'active';
	if not found then
		raise exception using errcode = '42501', message = 'Only active organization admins can update organization settings.';
	end if;
	if current_org_id is null then
		raise exception 'Your account is not linked to an organization.';
	end if;
	if clean_name is null then
		raise exception 'Organization name cannot be empty.';
	end if;

	update public.organization as organization
	set name = clean_name,
		street = nullif(pg_catalog.btrim(p_street), ''),
		city = nullif(pg_catalog.btrim(p_city), ''),
		state = nullif(pg_catalog.btrim(p_state), ''),
		zip = nullif(pg_catalog.btrim(p_zip), ''),
		phone = nullif(pg_catalog.btrim(p_phone), ''),
		updated_at = pg_catalog.now()
	where organization.id = current_org_id
	returning organization.* into updated_organization;

	if not found then
		raise exception 'The organization record could not be found.';
	end if;

	return query select updated_organization.id, updated_organization.name,
		updated_organization.street, updated_organization.city, updated_organization.state,
		updated_organization.zip, updated_organization.phone;
end;
$$;

-- A definer function or owner-executed view can bypass the restrictive policies.
-- Stop rather than claim inactive users are protected when an unknown path exists.
do $$
declare
	unguarded_function text;
	unguarded_view text;
begin
	select proc.oid::regprocedure::text into unguarded_function
	from pg_catalog.pg_proc as proc
	join pg_catalog.pg_namespace as namespace on namespace.oid = proc.pronamespace
	where namespace.nspname = 'public'
		and proc.prosecdef
		and pg_catalog.has_function_privilege('authenticated', proc.oid, 'execute')
		and proc.oid not in (
			'public.get_current_user_status()'::regprocedure,
			'public.get_current_user_profile()'::regprocedure,
			'public.update_current_user_name(text)'::regprocedure,
			'public.is_current_user_active()'::regprocedure,
			'public.can_approve_bills()'::regprocedure,
			'public.get_approval_history()'::regprocedure,
			'public.decide_bill(uuid,text,text)'::regprocedure,
			'public.is_current_user_organization_member(uuid)'::regprocedure,
			'public.is_current_user_organization_admin(uuid)'::regprocedure,
			'public.get_current_organization()'::regprocedure,
			'public.update_current_organization(text,text,text,text,text,text)'::regprocedure
		)
	limit 1;
	if unguarded_function is not null then
		raise exception 'Review authenticated SECURITY DEFINER function % before enabling signup.', unguarded_function;
	end if;

	select class.relname into unguarded_view
	from pg_catalog.pg_class as class
	join pg_catalog.pg_namespace as namespace on namespace.oid = class.relnamespace
	where namespace.nspname = 'public'
		and (class.relkind = 'm' or (
			class.relkind = 'v'
			and not coalesce(class.reloptions, array[]::text[]) @> array['security_invoker=true']
		))
	limit 1;
	if unguarded_view is not null then
		raise exception 'Review public view % before enabling signup; it may bypass row level security.', unguarded_view;
	end if;
end;
$$;

commit;
