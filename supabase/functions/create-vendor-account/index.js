import { withSupabase } from "jsr:@supabase/server@^1";

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

		if (typeof body !== "object" || body === null || Array.isArray(body)) {
			return Response.json(
				{ error: "Body must be an object" },
				{ status: 400 },
			);
		}

		const { vendor_id, account_number, service, property_id } = body;
		if (typeof vendor_id !== "string" || !UUID_RE.test(vendor_id)) {
			return Response.json(
				{ error: "Vendor ID is required and must be a valid UUID" },
				{ status: 400 },
			);
		}

		if (
			typeof account_number !== "string" ||
			account_number.trim().length === 0 ||
			typeof service !== "string" ||
			service.trim().length === 0 ||
			typeof property_id !== "string" ||
			!UUID_RE.test(property_id)
		) {
			return Response.json(
				{
					error:
						"Account number, service, and a valid property ID are required",
				},
				{ status: 400 },
			);
		}

		const { data: vendor, error: vendorError } = await supabase
			.from("vendor")
			.select("id")
			.eq("id", vendor_id)
			.maybeSingle();

		if (vendorError) {
			return Response.json(
				{ error: vendorError.message },
				{ status: 500 },
			);
		}

		if (!vendor) {
			return Response.json(
				{ error: "Vendor not found" },
				{ status: 404 },
			);
		}

		const { data: account, error: accountError } = await supabase
			.from("vendor_account")
			.insert({
				vendor_id,
				account_number: account_number.trim(),
				service: service.trim(),
				property_id,
				status: "active",
			})
			.select()
			.single();

		if (accountError) {
			return Response.json(
				{ error: accountError.message },
				{ status: 500 },
			);
		}

		return Response.json({ data: account }, { status: 201 });
	}),
};
