begin;

-- Store the review state consistently while accepting the existing display value.
update public.bill
set status = 'needs_review'
where pg_catalog.lower(pg_catalog.btrim(status)) in ('needs review', 'needs_review');

-- Bills in either review state remain editable, but cannot be moved to a final
-- state through the general bill-edit endpoint.
drop policy if exists "Users can update pending bills" on public.bill;

create policy "Users can update pending bills"
on public.bill for update
to authenticated
using (status in ('pending', 'needs_review'))
with check (status in ('pending', 'needs_review'));

-- Approvers can decide bills from either review state and history records the
-- actual state transition.
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
	previous_status text;
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

	select bill.status
	into previous_status
	from public.bill as bill
	where bill.id = p_bill_id
		and bill.status in ('pending', 'needs_review')
	for update;

	if previous_status is null then
		raise exception using
			errcode = 'P0002',
			message = 'Bill was not found or is no longer awaiting review';
	end if;

	update public.bill as bill
	set
		status = p_decision,
		approved_by = case when p_decision = 'approved' then actor_id else null end,
		approved_on = case when p_decision = 'approved' then current_date else null end,
		rejection_reason = case when p_decision = 'rejected' then decision_note else null end
	where bill.id = p_bill_id
		and bill.status = previous_status
	returning bill.id into updated_bill_id;

	if updated_bill_id is null then
		raise exception using
			errcode = 'P0002',
			message = 'Bill was not found or is no longer awaiting review';
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
		previous_status,
		p_decision,
		decision_note
	);

	return updated_bill_id;
end;
$$;

revoke all on function public.decide_bill(uuid, text, text) from public, anon;
grant execute on function public.decide_bill(uuid, text, text) to authenticated;

commit;
