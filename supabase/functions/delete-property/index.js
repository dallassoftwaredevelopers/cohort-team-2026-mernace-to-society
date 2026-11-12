
import { withSupabase } from "jsr:@supabase/server@^1";
import { validatePropertyId } from "../_shared/validateProperty.js";

export default {
	fetch: withSupabase({ auth: "user" }, async (req, { supabase }) => {
		if (req.method !== "DELETE") {
			return Response.json(
				{ error: "Method not allowed" },
				{ status: 405 },
			);
		}

		let body;

		try {
			body = await req.json();
		} catch {
			return Response.json(
				{ error: "Invalid JSON" },
				{ status: 400 },
			);
		}

        if (
            typeof body !== "object" ||
            body === null ||
            Array.isArray(body)
        ) {
            return Response.json(
                { error: "Body must be an object" },
                { status: 400 },
            );
        }

		const result = validatePropertyId(body.id);

		if (!result.ok) {
			return Response.json(
				{ error: result.error },
				{ status: 400 },
			);
		}

		const { data, error } = await supabase
			.from("property")
			.delete()
			.eq("id", result.value)
			.select("id")
			.single();

		if (error) {
			return Response.json(
				{ error: error.message },
				{ status: 500 },
			);
		}

		return Response.json({
			success: true,
			id: data.id,
		});
	}),
};
