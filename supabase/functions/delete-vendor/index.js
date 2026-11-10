import { withSupabase } from "jsr:@supabase/server@^1";

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

		const ids = body.ids;
		if (!Array.isArray(ids) || ids.length === 0) {
			return Response.json(
				{ error: "ids must be a non-empty array" },
				{ status: 400 },
			);
		}

		// Validate all IDs are valid UUIDs
		for (const id of ids) {
			if (typeof id !== "string" || !UUID_RE.test(id)) {
				return Response.json(
					{ error: "All vendor IDs must be valid UUIDs" },
					{ status: 400 },
				);
			}
		}

		// FIRST: Verify ALL selected vendor IDs exist in the vendor table.
		// If even one is missing, reject the entire batch without deleting anything.
		const { data: existingVendors, error: vendorsError } = await supabase
			.from("vendor")
			.select("id")
			.in("id", ids);

		if (vendorsError) {
			return Response.json(
				{ error: vendorsError.message },
				{ status: 500 },
			);
		}

		// Check if the number of existing vendors matches the number of requested IDs.
		// We compare by string identity since all IDs are validated as UUIDs.
		const existingIdSet = new Set(existingVendors.map((v) => v.id));
		const requestedIdSet = new Set(ids);

		if (existingIdSet.size !== requestedIdSet.size) {
			// At least one requested ID was not found in the vendor table.
			return Response.json(
				{ error: "One or more vendor IDs were not found." },
				{ status: 404 },
			);
		}

		// At this point we know all IDs exist. Now check for associated vendor accounts.
		const { data: accounts, error: accountsError } = await supabase
			.from("vendor_account")
			.select("vendor_id")
			.in("vendor_id", ids);

		if (accountsError) {
			return Response.json(
				{ error: accountsError.message },
				{ status: 500 },
			);
		}

		if (accounts && accounts.length > 0) {
			return Response.json(
				{
					error:
						"Cannot delete vendors: some have associated vendor accounts.",
				},
				{ status: 400 },
			);
		}

		// Delete all selected vendors
		const { data, error } = await supabase
			.from("vendor")
			.delete()
			.in("id", ids)
			.select("id");

		if (error) {
			// Handle foreign key violation gracefully (should be rare since we pre-checked)
			if (
				error.code === "23503" ||
				error.message.includes("foreign key")
			) {
				return Response.json(
					{
						error:
							"Cannot delete vendors: some have associated vendor accounts.",
					},
					{ status: 400 },
				);
			}
			return Response.json(
				{ error: error.message },
				{ status: 500 },
			);
		}

		const deletedIds = data ? data.map((row) => row.id) : [];
if (deletedIds.length !== ids.length) {
		const notDeleted = ids.filter((id) => !deletedIds.includes(id));
		return Response.json(
			{
				error:
					"Could not delete all requested vendors. Some may have been concurrently deleted.",
				notDeleted,
			},
			{ status: 400 },
		);
	}
if (deletedIds.length === 0) {
		// Should not happen since we verified all IDs exist, but safety check
		return Response.json(
			{ error: "No vendors were deleted." },
			{ status: 500 },
		);
	}

	return Response.json({
		success: true,
		deletedIds,
	});

	return Response.json({
		success: true,
		deletedIds,
	});

		if (deletedIds.length === 0) {
			// Should not happen since we verified all IDs exist, but safety check
			return Response.json(
				{ error: "No vendors were deleted." },
				{ status: 500 },
			);
		}

		return Response.json({
			success: true,
			deletedIds,
		});
	}),
};
