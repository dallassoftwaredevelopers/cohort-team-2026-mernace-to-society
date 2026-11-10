alter table public.bill
    add column file_path text unique,
    add column file_hash text,
    add column extracted_data jsonb;

-- same file cannot be uploaded twice
create unique index bill_file_hash_unique
on public.bill (file_hash)
where status not in ('rejected', 'extraction_failed');

-- same invoice cannot be entered twice for one vendor acct
create unique index bill_vendor_account_invoice_unique
on public.bill (
    vendor_account_id,
    upper(regexp_replace(invoice_number, '[^a-zA-Z0-9]', '', 'g'))
)
where status not in ('rejected', 'extraction_failed');
