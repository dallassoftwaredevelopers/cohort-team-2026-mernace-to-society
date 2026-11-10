import { withSupabase } from 'jsr:@supabase/server@^1';
import { validateBill } from '../_shared/validateBill.js';

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default {
	fetch: withSupabase({ auth: 'user' }, async (req, { supabase }) => {
		if (req.method !== 'PATCH') {
			return Response.json({ error: 'Method not allowed' }, { status: 405 });
		}

		let body;
		try {
			body = await req.json();
		} catch {
			return Response.json({ error: 'Invalid JSON' }, { status: 400 });
		}

		if (typeof body?.id !== 'string' || !UUID_RE.test(body.id)) {
			return Response.json({ error: 'Bill id is required' }, { status: 400 });
		}

		// Same rules as creating a bill, so an edit can't sneak in bad data
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

		// Only bills awaiting review can be edited. Filtering on status here means
		// an approved/rejected bill is left untouched if the page loaded earlier.
		// status, approved_by, created_by and source are never taken from the body.
		const { data, error } = await supabase
			.from('bill')
			.update({
				...result.value,
				property_id: account.property_id,
				status: result.value.review_reason ? 'needs_review' : 'pending',
			})
			.eq('id', body.id)
			// extraction_failed: the AI couldn't read it, so a person fills it in here
			.in('status', ['pending', 'needs_review', 'extraction_failed'])
			.select()
			.maybeSingle();

		if (error) {
			return Response.json({ error: error.message }, { status: 500 });
		}
		if (!data) {
			return Response.json(
				{ error: 'Bill was not found or is no longer pending' },
				{ status: 409 },
			);
		}

		return Response.json({ data });
	}),
};
