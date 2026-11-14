import { withSupabase } from 'jsr:@supabase/server@^1';
import { validateBillDecision } from '../_shared/validateBillDecision.js';

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

		const result = validateBillDecision(body);
		if (!result.ok) {
			return Response.json({ error: result.error }, { status: 400 });
		}

		const { data, error } = await supabase.rpc('decide_bill', {
			p_bill_id: result.value.billId,
			p_decision: result.value.decision,
			p_note: result.value.note,
		});

		// The bill table's CHECK (DC-93) refused: approving would leave a
		// pending/approved bill without its account, amount or dates
		if (error?.code === '23514') {
			return Response.json(
				{
					error:
						"This bill is missing details (vendor account, invoice number, amount or dates). Fix it before approving.",
				},
				{ status: 409 },
			);
		}

		if (error) {
			const status =
				error.code === '42501'
					? 403
					: error.code === 'P0002'
						? 404
						: error.code === '22023'
							? 400
							: 500;
			return Response.json(
				{ error: error.message || 'Could not save the bill decision' },
				{ status },
			);
		}

		return Response.json({ data });
	}),
};
