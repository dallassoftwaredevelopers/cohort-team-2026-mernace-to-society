import { withSupabase } from "jsr:@supabase/server@^1";
import { validateVendorAccount } from "../_shared/validateVendorAccount.js";

// Postgres error codes for the two mistakes a user can actually make here
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

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

		const result = validateVendorAccount(body);
		if (!result.ok) {
			return Response.json({ error: result.error }, { status: 400 });
		}

		const { data: vendor, error: vendorError } = await supabase
			.from("vendor")
			.select("id")
			.eq("id", result.value.vendor_id)
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
				...result.value,
				status: "active",
			})
			.select()
			.single();

		if (accountError?.code === UNIQUE_VIOLATION) {
			return Response.json(
				{ error: "This vendor already has an account with that number" },
				{ status: 409 },
			);
		}

		if (accountError?.code === FOREIGN_KEY_VIOLATION) {
			return Response.json(
				{ error: "Vendor or property not found" },
				{ status: 400 },
			);
		}

		if (accountError) {
			return Response.json(
				{ error: accountError.message },
				{ status: 500 },
			);
		}

		return Response.json({ data: account }, { status: 201 });
	}),
};
