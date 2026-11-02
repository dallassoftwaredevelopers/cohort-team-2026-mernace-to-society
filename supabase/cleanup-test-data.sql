-- Removes everything seed.sql created, plus any bills made against those test accounts.
-- Order matters: delete rows that point at other rows first (audit_trail → bill → vendor_account → vendor/property).
-- Does NOT touch the test user (see bottom).

delete from audit_trail
where bill_id in (
  select id from bill
  where vendor_account_id in (
    'a1a1a1a1-0000-4000-8000-000000000001',
    'a1a1a1a1-0000-4000-8000-000000000002',
    'a1a1a1a1-0000-4000-8000-000000000003',
    'a1a1a1a1-0000-4000-8000-000000000004'
  )
);

delete from bill
where vendor_account_id in (
  'a1a1a1a1-0000-4000-8000-000000000001',
  'a1a1a1a1-0000-4000-8000-000000000002',
  'a1a1a1a1-0000-4000-8000-000000000003',
  'a1a1a1a1-0000-4000-8000-000000000004'
);

delete from vendor_account
where id in (
  'a1a1a1a1-0000-4000-8000-000000000001',
  'a1a1a1a1-0000-4000-8000-000000000002',
  'a1a1a1a1-0000-4000-8000-000000000003',
  'a1a1a1a1-0000-4000-8000-000000000004'
);

delete from vendor
where id in (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
);

delete from property
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
);

-- To also remove the test user's profile row (only once no bills reference it):
-- delete from "user" where email = 'test@example.com';
-- The login itself is removed in the dashboard: Authentication → Users → ⋯ → Delete user.
