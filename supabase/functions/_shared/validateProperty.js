
const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_STATUSES = ["active", "inactive"];

export function validateProperty(body, { partial = false } = {}) {
	if (
		typeof body !== "object" ||
		body === null ||
		Array.isArray(body)
	) {
		return { ok: false, error: "Body must be an object" };
	}

	const value = {};

	const stringFields = [
		"name",
		"street",
		"city",
		"state",
		"type",
	];

	for (const field of stringFields) {
		if (!(field in body)) continue;

		const fieldValue = body[field];

		if (fieldValue === null && field !== "name") {
			value[field] = null;
			continue;
		}

		if (typeof fieldValue !== "string") {
			return {
				ok: false,
				error: `${field} must be text`,
			};
		}

		const trimmed = fieldValue.trim();

		if (field === "name" && trimmed.length === 0) {
			return { ok: false, error: "Property name is required" };
		}

		if (trimmed.length > 150) {
			return {
				ok: false,
				error: `${field} must be 150 characters or less`,
			};
		}

		value[field] = trimmed;
	}

	if (!partial && (!value.name || !value.type)) {
		return {
			ok: false,
			error: "Property name and type are required",
		};
	}

	if ("zip" in body) {
		if (body.zip === null || body.zip === "") {
			value.zip = null;
		} else {
			const zip = Number(body.zip);

			if (
				!Number.isInteger(zip) ||
				zip < 0 ||
				zip > 99999
			) {
				return {
					ok: false,
					error: "ZIP code must be a valid five-digit number",
				};
			}

			value.zip = zip;
		}
	}

	if ("status" in body) {
		if (!ALLOWED_STATUSES.includes(body.status)) {
			return {
				ok: false,
				error: "Status must be active or inactive",
			};
		}

		value.status = body.status;
	}

	if (Object.keys(value).length === 0) {
		return {
			ok: false,
			error: "At least one property field is required",
		};
	}

	return { ok: true, value };
}

export function validatePropertyId(id) {
	if (typeof id !== "string" || !UUID_RE.test(id)) {
		return {
			ok: false,
			error: "A valid property ID is required",
		};
	}

	return { ok: true, value: id };
}
