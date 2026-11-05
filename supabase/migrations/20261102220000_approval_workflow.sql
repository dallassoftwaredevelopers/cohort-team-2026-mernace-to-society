-- Keep this migration all-or-nothing: if any statement fails, none of its changes persist.
begin;

-- Check whether the signed-in user is a manager or admin.
create or replace function public.can_approve_bills()
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
			and app_user.role in ('manager', 'admin')
	);
$$;

revoke all on function public.can_approve_bills() from public, anon;
grant execute on function public.can_approve_bills() to authenticated;

-- Return bill decision history with invoice and actor details.
create or replace function public.get_approval_history()
returns table (
	id uuid,
	bill_id uuid,
	invoice_number text,
	action text,
	from_status text,
	to_status text,
	note text,
	created_at timestamptz,
	actor_name text,
	amount numeric
)
language sql
stable
security definer
set search_path = ''
as $$
	select
		history.id,
		history.bill_id,
		bill.invoice_number,
		history.action,
		history.from_status,
		history.to_status,
		history.note,
		history.created_at,
		app_user.name as actor_name,
		bill.amount
	from public.audit_trail as history
	join public.bill as bill on bill.id = history.bill_id
	left join public."user" as app_user on app_user.id = history.user_id
	where auth.uid() is not null
	order by history.created_at desc;
$$;

revoke all on function public.get_approval_history() from public, anon;
grant execute on function public.get_approval_history() to authenticated;

-- Change a pending bill and insert its audit row in the same transaction.
create or replace function public.decide_bill(
	p_bill_id uuid,
	p_decision text,
	p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
	actor_id uuid := auth.uid();
	decision_note text := nullif(pg_catalog.btrim(p_note), '');
	updated_bill_id uuid;
begin
	if actor_id is null then
		raise exception using
			errcode = '42501',
			message = 'Authentication is required';
	end if;

	if not public.can_approve_bills() then
		raise exception using
			errcode = '42501',
			message = 'Only managers and admins can decide bills';
	end if;

	if p_decision is null or p_decision not in ('approved', 'rejected') then
		raise exception using
			errcode = '22023',
			message = 'Decision must be approved or rejected';
	end if;

	if p_decision = 'rejected' and decision_note is null then
		raise exception using
			errcode = '22023',
			message = 'A reason is required to reject a bill';
	end if;

	if decision_note is not null and pg_catalog.length(decision_note) > 2000 then
		raise exception using
			errcode = '22023',
			message = 'Decision note must be 2000 characters or less';
	end if;

	update public.bill as bill
	set
		status = p_decision,
		approved_by = case when p_decision = 'approved' then actor_id else null end,
		approved_on = case when p_decision = 'approved' then current_date else null end,
		rejection_reason = case when p_decision = 'rejected' then decision_note else null end
	where bill.id = p_bill_id
		and bill.status = 'pending'
	returning bill.id into updated_bill_id;

	if updated_bill_id is null then
		raise exception using
			errcode = 'P0002',
			message = 'Bill was not found or is no longer pending';
	end if;

	insert into public.audit_trail (
		bill_id,
		user_id,
		action,
		from_status,
		to_status,
		note
	)
	values (
		updated_bill_id,
		actor_id,
		p_decision,
		'pending',
		p_decision,
		decision_note
	);

	return updated_bill_id;
end;
$$;

revoke all on function public.decide_bill(uuid, text, text) from public, anon;
grant execute on function public.decide_bill(uuid, text, text) to authenticated;

commit;
