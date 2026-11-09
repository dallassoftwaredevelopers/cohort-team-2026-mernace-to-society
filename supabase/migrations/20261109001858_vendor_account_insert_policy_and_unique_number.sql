create policy "Logged-in users can add vendor accounts"
on public.vendor_account for insert
to authenticated
with check (true);

create unique index vendor_account_vendor_number_unique
on public.vendor_account (
  vendor_id,
  upper(regexp_replace(account_number, '[^a-zA-Z0-9]', '', 'g'))
);
