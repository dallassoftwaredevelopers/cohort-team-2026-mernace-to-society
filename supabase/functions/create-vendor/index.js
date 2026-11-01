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

		// Vendors are shared across users (no user_id column), so only status is added here
		const { data, error } = await supabase
			.from('vendor')
			.insert({
				...result.value,
				status: 'active',
			})
			.select()
			.single();

		if (error) {
			return Response.json({ error: error.message }, { status: 500 });
		}

		return Response.json({ data }, { status: 201 });
	}),
};
