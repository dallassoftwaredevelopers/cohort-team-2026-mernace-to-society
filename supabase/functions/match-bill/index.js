import { withSupabase } from 'jsr:@supabase/server@^1';
import { validateBill } from '../_shared/validateBill.js';

// "123-456 789" → "123456789", so formatting differences don't block a match
function normalize(value) {
	return String(value ?? '')
		.replace(/[^a-z0-9]/gi, '')
		.toUpperCase();
}

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

		const target = normalize(extracted?.account_number);
		if (!target) {
			return Response.json({ data: null }, { status: 200 }); // nothing to match on
		}

		// Read-only: this function never inserts or updates anything
		const { data: accounts, error } = await supabase
			.from('vendor_account')
			.select('id, property_id, account_number');

		if (error) {
			return Response.json({ error: error.message }, { status: 500 });
		}

		const matches = accounts.filter(
			(account) => normalize(account.account_number) === target,
		);

		// Zero or several matches → let the person choose
		if (matches.length !== 1) {
			return Response.json({ data: null }, { status: 200 });
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
