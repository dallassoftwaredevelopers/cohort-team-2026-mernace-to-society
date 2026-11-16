-- Create payment_method table
CREATE TABLE public.payment_method (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    org_id UUID REFERENCES public.organization(id) ON DELETE CASCADE,
    cardholder_name TEXT,
    card_brand TEXT, -- e.g., 'visa', 'mastercard'
    card_last4 TEXT, -- Last 4 digits for safe UI display
    exp_month INT2,
    exp_year INT2,
    is_default BOOLEAN NOT NULL DEFAULT false,
    -- Store payment gateway tokens (e.g., Stripe payment method ID) instead of raw card numbers/CVVs
    processor_token TEXT UNIQUE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payment_method ENABLE ROW LEVEL SECURITY;

-- RLS Policies (matching your organization-based access patterns)
CREATE POLICY "Organization members can view payment methods"
    ON public.payment_method
    FOR SELECT
    TO authenticated
    USING (is_current_user_organization_member(org_id));

CREATE POLICY "Organization members can insert payment methods"
    ON public.payment_method
    FOR INSERT
    TO authenticated
    WITH CHECK (is_current_user_organization_member(org_id));

CREATE POLICY "Organization members can update payment methods"
    ON public.payment_method
    FOR UPDATE
    TO authenticated
    USING (is_current_user_organization_member(org_id))
    WITH CHECK (is_current_user_organization_member(org_id));

CREATE POLICY "Organization members can delete payment methods"
    ON public.payment_method
    FOR DELETE
    TO authenticated
    USING (is_current_user_organization_member(org_id));