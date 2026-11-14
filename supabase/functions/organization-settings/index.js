import { withSupabase } from "jsr:@supabase/server@^1";

const ORGANIZATION_FIELDS = [
	"name",
	"street",
	"city",
	"state",
	"zip",
	"phone",
];

function validateOrganization(body) {
	if (
		typeof body !== "object" ||
		body === null ||
		Array.isArray(body)
	) {
		return { ok: false, error: "Body must be an object" };
	}

	const allowedFields = new Set(ORGANIZATION_FIELDS);
	const unexpectedField = Object.keys(body).find(
		(field) => !allowedFields.has(field),
	);
	if (unexpectedField) {
		return {
			ok: false,
			error: `Unexpected organization field: ${unexpectedField}`,
		};
	}

	const value = {};
	for (const field of ORGANIZATION_FIELDS) {
		const fieldValue = body[field];
		if (typeof fieldValue !== "string") {
			return { ok: false, error: `${field} must be text` };
		}

		const trimmed = fieldValue.trim();
		if (trimmed.length > (field === "name" ? 150 : 255)) {
			return {
				ok: false,
				error: `${field} is too long`,
			};
		}
		value[field] = trimmed;
	}

	if (!value.name) {
		return { ok: false, error: "Organization name is required" };
	}

	return { ok: true, value };
}

export default {
	fetch: withSupabase({ auth: "user" }, async (req, { supabase }) => {
		if (req.method === "GET") {
			const { data, error } = await supabase.rpc(
				"get_current_organization",
			);

			if (error) {
				return Response.json(
					{ error: error.message },
					{ status: 500 },
				);
			}

			const organization = data?.[0];
			if (!organization) {
				return Response.json(
					{ error: "Your account is not linked to an organization." },
					{ status: 404 },
				);
			}

			return Response.json({ data: organization });
		}

		if (req.method === "PATCH") {
			let body;
			try {
				body = await req.json();
			} catch {
				return Response.json(
					{ error: "Invalid JSON" },
					{ status: 400 },
				);
			}

			const result = validateOrganization(body);
			if (!result.ok) {
				return Response.json(
					{ error: result.error },
					{ status: 400 },
				);
			}

			const { data, error } = await supabase.rpc(
				"update_current_organization",
				{
					p_name: result.value.name,
					p_street: result.value.street,
					p_city: result.value.city,
					p_state: result.value.state,
					p_zip: result.value.zip,
					p_phone: result.value.phone,
				},
			);

			if (error) {
				const status = error.code === "42501" ? 403 : 500;
				return Response.json({ error: error.message }, { status });
			}

			const organization = data?.[0];
			if (!organization) {
				return Response.json(
					{ error: "The server did not return the saved organization." },
					{ status: 500 },
				);
			}

			return Response.json({ data: organization });
		}

		return Response.json(
			{ error: "Method not allowed" },
			{
				status: 405,
				headers: { Allow: "GET, PATCH" },
			},
		);
	}),
};
