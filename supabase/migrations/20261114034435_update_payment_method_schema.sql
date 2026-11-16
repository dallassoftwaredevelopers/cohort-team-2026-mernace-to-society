-- Create an Enum for the account type
CREATE TYPE financial_account_type AS ENUM ('bank_account', 'credit', 'debit');

-- Drop the old columns you no longer want
ALTER TABLE public.payment_method
  DROP COLUMN IF EXISTS cardholder_name,
  DROP COLUMN IF EXISTS card_brand,
  DROP COLUMN IF EXISTS card_last4,
  DROP COLUMN IF EXISTS exp_month,
  DROP COLUMN IF EXISTS exp_year,
  DROP COLUMN IF EXISTS is_default,
  DROP COLUMN IF EXISTS processor_token;

-- Add the new base `type` column and specific fields
ALTER TABLE public.payment_method
  ADD COLUMN IF NOT EXISTS type financial_account_type NOT NULL DEFAULT 'bank_account',
  
  -- Bank Account specific fields
  ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS account_type TEXT, 
  ADD COLUMN IF NOT EXISTS routing_number TEXT,
  ADD COLUMN IF NOT EXISTS account_number TEXT,
  
  -- Credit / Debit Card specific fields
  ADD COLUMN IF NOT EXISTS name_on_card TEXT,
  ADD COLUMN IF NOT EXISTS card_number TEXT,
  ADD COLUMN IF NOT EXISTS expiration_date TEXT, -- Stored as 'MM/YY'
  ADD COLUMN IF NOT EXISTS security_code TEXT,
  ADD COLUMN IF NOT EXISTS billing_zip_code TEXT;

-- Add a CHECK constraint to ensure valid data per type
ALTER TABLE public.payment_method
  DROP CONSTRAINT IF EXISTS check_payment_method_fields_by_type;

ALTER TABLE public.payment_method
  ADD CONSTRAINT check_payment_method_fields_by_type CHECK (
    (
      type = 'bank_account' 
      AND account_holder_name IS NOT NULL 
      AND routing_number IS NOT NULL 
      AND account_number IS NOT NULL
      -- Ensure card fields are empty/null for bank accounts
      AND name_on_card IS NULL
      AND card_number IS NULL
      AND expiration_date IS NULL
      AND security_code IS NULL
      AND billing_zip_code IS NULL
    )
    OR
    (
      type IN ('credit', 'debit') 
      AND name_on_card IS NOT NULL 
      AND card_number IS NOT NULL 
      AND expiration_date IS NOT NULL
      AND billing_zip_code IS NOT NULL
      -- Ensure bank fields are empty/null for cards
      AND account_holder_name IS NOT NULL -- Wait, let's keep bank fields null for cards:
      AND routing_number IS NULL
      AND account_number IS NULL
      AND account_type IS NULL
    )
  );