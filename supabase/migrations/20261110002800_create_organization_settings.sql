begin;

create table public.organization (
	id uuid primary key default gen_random_uuid(),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	name text not null,
	street text,
	city text,
	state text,
	zip text,
	phone text
);

alter table public.organization enable row level security;
revoke all on table public.organization from public, anon, authenticated;
grant select on table public.organization to authenticated;
grant update (name, street, city, state, zip, phone)
	on table public.organization to authenticated;

create or replace function public.is_current_user_organization_member(
	p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select exists (
		select 1
		from public."user" as app_user
		where app_user.id = auth.uid()
			and app_user.org_id = p_organization_id
	);
$$;

create or replace function public.is_current_user_organization_admin(
	p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select exists (
		select 1
		from public."user" as app_user
		where app_user.id = auth.uid()
			and app_user.org_id = p_organization_id
			and app_user.role = 'admin'
	);
$$;

revoke all on function public.is_current_user_organization_member(uuid)
	from public, anon;
revoke all on function public.is_current_user_organization_admin(uuid)
	from public, anon;
grant execute on function public.is_current_user_organization_member(uuid)
	to authenticated;
grant execute on function public.is_current_user_organization_admin(uuid)
	to authenticated;

create policy "Organization members can view their organization"
	on public.organization
	for select
	to authenticated
	using (public.is_current_user_organization_member(id));

create policy "Organization admins can update their organization"
	on public.organization
	for update
	to authenticated
	using (public.is_current_user_organization_admin(id))
	with check (public.is_current_user_organization_admin(id));

create or replace function public.set_organization_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	new.updated_at := pg_catalog.now();
	return new;
end;
$$;

revoke all on function public.set_organization_updated_at()
	from public, anon, authenticated;

create trigger set_organization_updated_at
	before update on public.organization
	for each row
	execute function public.set_organization_updated_at();

do $$
declare
	shared_org_id uuid;
begin
	insert into public.organization (name)
	values ('My Organization')
	returning id into shared_org_id;

	-- Existing app users belong to the same organization for the current MVP.
	update public."user"
	set org_id = shared_org_id;
end;
$$;

do $$
begin
	if not exists (
		select 1
		from pg_catalog.pg_constraint
		where conrelid = 'public."user"'::regclass
			and conname = 'user_org_id_fkey'
	) then
		alter table public."user"
			add constraint user_org_id_fkey
			foreign key (org_id)
			references public.organization (id)
			on delete restrict;
	end if;
end;
$$;

create or replace function public.get_current_organization()
returns table (
	id uuid,
	name text,
	street text,
	city text,
	state text,
	zip text,
	phone text
)
language sql
stable
security definer
set search_path = ''
as $$
	select organization.id, organization.name, organization.street,
		organization.city, organization.state, organization.zip, organization.phone
	from public.organization as organization
	join public."user" as app_user on app_user.org_id = organization.id
	where app_user.id = auth.uid();
$$;

revoke all on function public.get_current_organization() from public, anon;
grant execute on function public.get_current_organization() to authenticated;

create or replace function public.update_current_organization(
	p_name text,
	p_street text,
	p_city text,
	p_state text,
	p_zip text,
	p_phone text
)
returns table (
	id uuid,
	name text,
	street text,
	city text,
	state text,
	zip text,
	phone text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
	current_user_id uuid := auth.uid();
	current_org_id uuid;
	clean_name text := nullif(pg_catalog.btrim(p_name), '');
	updated_organization public.organization%rowtype;
begin
	if current_user_id is null then
		raise exception using
			errcode = '42501',
			message = 'You must be signed in to update organization settings.';
	end if;

	select app_user.org_id
	into current_org_id
	from public."user" as app_user
	where app_user.id = current_user_id
		and app_user.role = 'admin';

	if not found then
		raise exception using
			errcode = '42501',
			message = 'Only organization admins can update organization settings.';
	end if;

	if current_org_id is null then
		raise exception 'Your account is not linked to an organization.';
	end if;

	if clean_name is null then
		raise exception 'Organization name cannot be empty.';
	end if;

	update public.organization as organization
	set
		name = clean_name,
		street = nullif(pg_catalog.btrim(p_street), ''),
		city = nullif(pg_catalog.btrim(p_city), ''),
		state = nullif(pg_catalog.btrim(p_state), ''),
		zip = nullif(pg_catalog.btrim(p_zip), ''),
		phone = nullif(pg_catalog.btrim(p_phone), ''),
		updated_at = pg_catalog.now()
	where organization.id = current_org_id
	returning organization.*
	into updated_organization;

	if not found then
		raise exception 'The organization record could not be found.';
	end if;

	return query
	select updated_organization.id, updated_organization.name,
		updated_organization.street, updated_organization.city,
		updated_organization.state, updated_organization.zip,
		updated_organization.phone;
end;
$$;

revoke all on function public.update_current_organization(
	text, text, text, text, text, text
) from public, anon;
grant execute on function public.update_current_organization(
	text, text, text, text, text, text
) to authenticated;

commit;
