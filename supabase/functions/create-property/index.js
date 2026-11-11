
import { withSupabase } from "jsr:@supabase/server@^1";
import { validateProperty } from "../_shared/validateProperty.js";

export default {
	fetch: withSupabase({ auth: "user" }, async (req, { supabase }) => {
		if (req.method !== "POST") {
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

		const result = validateProperty(body);

		if (!result.ok) {
			return Response.json(
				{ error: result.error },
				{ status: 400 },
			);
		}

		const { data, error } = await supabase
			.from("property")
			.insert(result.value)
			.select()
			.single();

		// property.name is unique (property_name_key)
		if (error?.code === "23505") {
			return Response.json(
				{
					error:
						`A property named "${result.value.name}" already exists. Choose it from the property list instead.`,
				},
				{ status: 409 },
			);
		}

		if (error) {
			return Response.json(
				{ error: error.message },
				{ status: 500 },
			);
		}

		return Response.json({ data }, { status: 201 });
	}),
};
