import { withSupabase } from 'jsr:@supabase/server@^1';
import { validateBill } from '../_shared/validateBill.js';

export default {
	fetch: withSupabase({ auth: 'user' }, async (req, { supabase }) => {
		if (req.method !== 'POST') {
			return Response.json({ error: 'Method not allowed' }, { status: 405 });
		}

		// Who's calling, according to their verified token (never the body)
		const {
			data: { user },
		} = await supabase.auth.getUser();

		let body;
		try {
			body = await req.json();
		} catch {
			return Response.json({ error: 'Invalid JSON' }, { status: 400 });
		}

		const result = validateBill(body);
		if (!result.ok) {
			return Response.json({ error: result.error }, { status: 400 });
		}

		// property_id comes from the vendor account, so the two can never disagree
		const { data: account, error: accountError } = await supabase
			.from('vendor_account')
			.select('property_id')
			.eq('id', result.value.vendor_account_id)
			.maybeSingle();

		if (accountError) {
			return Response.json({ error: accountError.message }, { status: 500 });
		}
		if (!account) {
			return Response.json(
				{ error: 'Vendor account not found' },
				{ status: 400 },
			);
		}

		// org_id is left null for the MVP (single organization)
		const { data, error } = await supabase
			.from('bill')
			.insert({
				...result.value,
				property_id: account.property_id,
				created_by: user.id,
				status: 'pending',
				source: 'manual',
			})
			.select()
			.single();

		if (error) {
			return Response.json({ error: error.message }, { status: 500 });
		}

		return Response.json({ data }, { status: 201 });
	}),
};
