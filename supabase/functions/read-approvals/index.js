import { withSupabase } from 'jsr:@supabase/server@^1';

export default {
	fetch: withSupabase({ auth: 'user' }, async (req, { supabase }) => {
		if (req.method !== 'POST') {
			return Response.json({ error: 'Method not allowed' }, { status: 405 });
		}

		const [billResult, historyResult, permissionResult] = await Promise.all([
			supabase
				.from('bill')
				.select(
					'id, invoice_number, issue_date, due_date, amount, status, source, extracted_vendor_name, review_reason, rejection_reason, approved_on, created_at, property(name), vendor_account(service, vendor(name))',
				)
				.order('due_date', { ascending: true }),
			supabase.rpc('get_approval_history'),
			supabase.rpc('can_approve_bills'),
		]);

		const failure = billResult.error || historyResult.error || permissionResult.error;
		if (failure) {
			return Response.json(
				{ error: failure.message || 'Could not load approval data' },
				{ status: 500 },
			);
		}

		return Response.json({
			bills: billResult.data ?? [],
			history: historyResult.data ?? [],
			canApprove: permissionResult.data === true,
		});
	}),
};
