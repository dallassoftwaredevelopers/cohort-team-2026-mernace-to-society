-- let the bill table hold uploaded bills that aren't finished yet
-- (no matched account, or missing fields), without letting an unfinished
-- bill reach approval or payment.
--
-- Runs as one transaction: if any existing row breaks a new rule, the whole
-- migration fails and nothing changes.

begin;

-- 1. Unfinished bills may not have an account or property yet.
--    vendor_account_id defaulted to a random uuid, which the foreign key would
--    reject, so the default has to go for null to work.
alter table public.bill
	alter column vendor_account_id drop default,
	alter column vendor_account_id drop not null,
	alter column property_id drop not null;

-- 2. duplicate_bill_id also defaulted to a random uuid, so most bills pointed
--    at a "duplicate" that doesn't exist. Clear those and only allow real bills.
alter table public.bill
	alter column duplicate_bill_id drop default;

update public.bill as bill
set duplicate_bill_id = null
where bill.duplicate_bill_id is not null
	and not exists (
		select 1 from public.bill as other where other.id = bill.duplicate_bill_id
	);

alter table public.bill
	add constraint bill_duplicate_bill_id_fkey
	foreign key (duplicate_bill_id) references public.bill (id)
	on delete set null;

-- 3. Every bill has a known status.
--    processing        = uploaded, AI still reading it
--    extraction_failed = the AI couldn't read it
--    needs_review      = saved, but a person has to check or finish it
--    pending           = complete, waiting for a manager
--    approved / rejected / paid = decided
alter table public.bill
	alter column status set not null,
	add constraint bill_status_check check (
		status in (
			'processing',
			'extraction_failed',
			'needs_review',
			'pending',
			'approved',
			'rejected',
			'paid'
		)
	);

-- 4. The rule that matters: a bill can only be pending, approved or paid when
--    every field is filled in. This holds no matter which code path writes the
--    row (edge function, decide_bill, Table Editor).
--    'rejected' is left out on purpose: a manager must be able to reject an
--    incomplete or junk upload that's sitting in needs_review.
alter table public.bill
	add constraint bill_complete_when_submitted check (
		status not in ('pending', 'approved', 'paid')
		or (
			vendor_account_id is not null
			and property_id is not null
			and invoice_number is not null
			and amount is not null
			and issue_date is not null
			and due_date is not null
		)
	);

-- 5. Users can also edit bills that are still processing or failed, so they
--    can fix them by hand. Decided bills stay locked.
drop policy if exists "Users can update pending bills" on public.bill;

create policy "Users can update pending bills"
on public.bill for update
to authenticated
using (status in ('processing', 'extraction_failed', 'needs_review', 'pending'))
with check (status in ('processing', 'extraction_failed', 'needs_review', 'pending'));

commit;
