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

		const { data, error } = await supabase
			.from('bills')
			.insert({
				...result.value,
				user_id: user.id,
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
