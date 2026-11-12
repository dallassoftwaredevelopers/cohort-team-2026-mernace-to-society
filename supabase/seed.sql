-- Test data for manual bill entry: 2 properties, 3 vendors, 4 vendor accounts.
-- Paste into the Supabase SQL editor and run. Safe to re-run: fixed ids + "on conflict do nothing".
-- org_id is left null (single organization for the MVP).

insert into property (id, created_at, name, street, city, state, zip, status)
values
  ('11111111-1111-4111-8111-111111111111', now(), 'Royal Oaks Apartments', '100 Oak Ln', 'Tampa', 'FL', 33602, 'active'),
  ('22222222-2222-4222-8222-222222222222', now(), 'Bayview Townhomes', '250 Shore Dr', 'St. Petersburg', 'FL', 33701, 'active')
on conflict do nothing;

-- email/phone are made-up test values
insert into vendor (id, created_at, name, aliases, portal_url, status, email, phone_number)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', now(), 'Florida Power & Light', array['FPL', 'Florida Power and Light'], 'https://www.fpl.com', 'active', 'billing@fpl.example.com', '555-0101'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', now(), 'Tampa Water Department', array['City of Tampa Water'], 'https://www.tampa.gov/water', 'active', 'billing@tampawater.example.com', '555-0102'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', now(), 'Waste Management', array['WM'], 'https://www.wm.com', 'active', 'billing@wm.example.com', '555-0103')
on conflict do nothing;

insert into vendor_account (id, created_at, account_number, service, payment_type, status, property_id, vendor_id)
values
  -- Royal Oaks: electric, water, disposal
  ('a1a1a1a1-0000-4000-8000-000000000001', now(), '1001-2345', 'Electric', 'autopay', 'active', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  ('a1a1a1a1-0000-4000-8000-000000000002', now(), 'W-55021',   'Water',    'manual',  'active', '11111111-1111-4111-8111-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('a1a1a1a1-0000-4000-8000-000000000003', now(), 'WM-88310',  'Disposal', 'manual',  'active', '11111111-1111-4111-8111-111111111111', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
  -- Bayview: electric only
  ('a1a1a1a1-0000-4000-8000-000000000004', now(), '1001-9876', 'Electric', 'autopay', 'active', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
on conflict do nothing;
