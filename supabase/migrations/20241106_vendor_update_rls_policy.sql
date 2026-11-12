-- Add UPDATE RLS policy for authenticated users on the vendor table
-- This allows authenticated users to update vendor records through Edge Functions
-- The Edge Function handles field-level validation (name, aliases, portal_url)
-- Server-controlled fields (id, created_at, status) are protected by the application logic

CREATE POLICY "authenticated_users_can_update_vendor"
ON vendor
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);