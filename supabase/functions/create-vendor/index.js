import { withSupabase } from 'jsr:@supabase/server@^1';
import { validateVendor } from '../_shared/validateVendor.js';

export default {
	fetch: withSupabase({ auth: 'user' }, async (req, { supabase }) => {
		if (req.method !== 'POST') {
			return Response.json({ error: 'Method not allowed' }, { status: 405 });
		}

		let body;
		try {
			body = await req.json();
		} catch {
			return Response.json({ error: 'Invalid JSON' }, { status: 400 });
		}

		const result = validateVendor(body);
		if (!result.ok) {
			return Response.json({ error: result.error }, { status: 400 });
		}

		const { account, ...vendorFields } = result.value;

		// Vendors are shared across users (no user_id column), so only status is added here
		const { data: vendor, error } = await supabase
			.from('vendor')
			.insert({
				...vendorFields,
				status: 'active',
			})
			.select()
			.single();

		if (error) {
			return Response.json({ error: error.message }, { status: 500 });
		}

		if (account) {
			const { error: accountError } = await supabase
				.from('vendor_account')
				.insert({
					...account,
					vendor_id: vendor.id,
					status: 'active',
				});

			if (accountError) {
				const { data: removedVendor, error: cleanupError } = await supabase
					.from('vendor')
					.delete()
					.eq('id', vendor.id)
					.select('id');

				if (cleanupError || !removedVendor?.length) {
					console.error(
						'Could not remove vendor after account creation failed:',
						cleanupError || 'Vendor was not deleted',
					);
				}

				return Response.json(
					{
						error: cleanupError || !removedVendor?.length
							? `Vendor account creation failed: ${accountError.message}. Vendor cleanup also failed${cleanupError ? `: ${cleanupError.message}` : ''}.`
							: `Vendor account creation failed: ${accountError.message}`,
					},
					{ status: 500 },
				);
			}
		}

		return Response.json({ data: vendor }, { status: 201 });
	}),
};
