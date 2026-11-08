import { withSupabase } from "jsr:@supabase/server@^1";
import { validateVendor } from "../_shared/validateVendor.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Fields that the client is allowed to edit on a vendor record
const EDITABLE_FIELDS = ["name", "aliases", "portal_url"];

export default {
	fetch: withSupabase({ auth: "user" }, async (req, { supabase }) => {
		if (req.method !== "PATCH") {
			return Response.json(
				{ error: "Method not allowed" },
				{ status: 405 }
			);
		}

		let body;
		try {
			body = await req.json();
		} catch {
			return Response.json(
				{ error: "Invalid JSON" },
				{ status: 400 }
			);
		}

		if (
			typeof body !== "object" ||
			body === null ||
			Array.isArray(body)
		) {
			return Response.json(
				{ error: "Body must be an object" },
				{ status: 400 }
			);
		}

		// Vendor ID is required to identify which vendor to update
		if (typeof body.id !== "string" || !UUID_RE.test(body.id)) {
			return Response.json(
				{ error: "Vendor ID is required and must be a valid UUID" },
				{ status: 400 }
			);
		}

		// Determine which editable fields are present in the request
		const providedEditableFields = EDITABLE_FIELDS.filter((field) => {
			return body.hasOwnProperty(field);
		});

		// Reject if no editable fields are provided
		if (providedEditableFields.length === 0) {
			return Response.json(
				{
					error:
						"At least one of name, aliases, or portal_url must be provided for update",
				},
				{ status: 400 }
			);
		}

		// Build a partial body for validateVendor containing only the provided editable fields
		// This preserves the existing validateVendor for create-vendor while allowing
		// partial updates in update-vendor
		const partialBody = {};
		for (const field of providedEditableFields) {
			partialBody[field] = body[field];
		}

		// Also include id so validateVendor can reference it (name is always checked)
		partialBody.id = body.id;

		// Validate the provided fields using validateVendor in partial mode
		// validateVendor will still check name if present, aliases structure, portal_url format
		const result = validateVendor(partialBody);
		if (!result.ok) {
			return Response.json(
				{ error: result.error },
				{ status: 400 }
			);
		}

		// Construct the update object with only the validated editable fields
		// that were actually provided by the client
		const updates = {};
		if (providedEditableFields.includes("name")) {
			updates.name = result.value.name;
		}
		if (providedEditableFields.includes("aliases")) {
			updates.aliases = result.value.aliases;
		}
		if (providedEditableFields.includes("portal_url")) {
			updates.portal_url = result.value.portal_url;
		}

		// Security: explicitly ensure server-controlled fields are NOT updated
		// These fields are never included in 'updates', guaranteeing they cannot be
		// changed through this Edge Function, regardless of what the client sends
		const forbiddenFields = ["id", "status", "created_at"];
		for (const field of forbiddenFields) {
			if (field in body) {
				// Field was present in request body - we simply ignore it
				// This is a security measure; we could also return an error
			}
		}

		const { data, error } = await supabase
			.from("vendor")
			.update(updates)
			.eq("id", body.id)
			.select()
			// .single();

		if (error) {
			return Response.json(
				{ error: error.message },
				{ status: 500 }
			);
		}

		if (data.length === 0) {
      return Response.json(
        { error: "Vendor not found or update not permitted" },
        { status: 404 },
      );
    }
		return Response.json({ data });
	}),
};