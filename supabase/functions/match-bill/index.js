import { withSupabase } from 'jsr:@supabase/server@^1';
import { validateBill } from '../_shared/validateBill.js';
import { findVendorId, matchAccount } from '../_shared/matching.js';

export default {
	fetch: withSupabase({ auth: 'user' }, async (req, { supabase }) => {
		if (req.method !== 'POST') {
			return Response.json({ error: 'Method not allowed' }, { status: 405 });
		}

		let extracted;
		try {
			extracted = await req.json();
		} catch {
			return Response.json({ error: 'Invalid JSON' }, { status: 400 });
		}

		// Read-only: this function never inserts or updates anything
		const { data: accounts, error } = await supabase
			.from('vendor_account')
			.select('id, property_id, account_number');

		if (error) {
			return Response.json({ error: error.message }, { status: 500 });
		}

		const match = matchAccount(accounts, extracted?.account_number);

		// Several accounts share this number → the account exists, so let the person choose
		if (match.kind === 'many') {
			return Response.json({ data: null }, { status: 200 });
		}

		// No account → report which company it is, if we know it, so the app can
		// offer to add an account to that vendor instead of creating a duplicate
		if (match.kind === 'none') {
			const { data: vendors, error: vendorError } = await supabase
				.from('vendor')
				.select('id, name, aliases');

			if (vendorError) {
				return Response.json({ error: vendorError.message }, { status: 500 });
			}

			return Response.json(
				{ data: { vendor_id: findVendorId(vendors, extracted?.vendor_name) } },
				{ status: 200 },
			);
		}

		const [account] = matches;
		const complete = validateBill({
			...extracted,
			vendor_account_id: account.id,
		}).ok;

		return Response.json(
			{
				data: {
					vendor_account_id: account.id,
					property_id: account.property_id,
					complete,
				},
			},
			{ status: 200 },
		);
	}),
};
