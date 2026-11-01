import { withSupabase } from 'jsr:@supabase/server@^1';

export default {
	fetch: withSupabase({ auth: 'user' }, async (_req, { supabase }) => {
		const { data, error } = await supabase
			.from('bills')
			.select('*')
			.order('due_date', { ascending: true });

		if (error) {
			return Response.json({ error: error.message }, { status: 500 });
		}

		return Response.json({ data });
	}),
};
