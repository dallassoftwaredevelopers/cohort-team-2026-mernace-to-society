-- Let logged-in users edit bills that are still pending.
-- 'with check' stops an edit from changing the status away from pending.
drop policy if exists "Users can update pending bills" on public.bill;

create policy "Users can update pending bills"
on public.bill for update
to authenticated
using (status = 'pending')
with check (status = 'pending');
