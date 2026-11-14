import { withSupabase } from "jsr:@supabase/server@^1";

export default {
	fetch: withSupabase({ auth: "user" }, async (req, { supabase }) => {
		if (req.method !== "GET") {
			return Response.json(
				{ error: "Method not allowed" },
				{ status: 405 },
			);
		}

		const { data, error } = await supabase
			.from("vendor")
			.select(
				"id, name, aliases, portal_url, status, vendor_account(service, account_number)",
			)
			.order("created_at", { ascending: false });

		if (error) {
			return Response.json(
				{ error: error.message },
				{ status: 500 },
			);
		}

		return Response.json({ data });
	}),
};
