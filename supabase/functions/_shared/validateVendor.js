export function validateVendor(body) {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		return { ok: false, error: 'Body must be an object' };
	}

	// Only name, aliases and portal_url are read. status is set by the server, id/created_at by the DB.
	const { name, aliases, portal_url } = body;

	if (typeof name !== 'string' || name.trim().length === 0) {
		return { ok: false, error: 'Name is required' };
	}
	if (name.trim().length > 100) {
		return { ok: false, error: 'Name must be 100 characters or less' };
	}

	// aliases are optional alternate spellings, e.g. "ConEd" for "Consolidated Edison"
	const list = aliases === undefined || aliases === null ? [] : aliases;
	if (!Array.isArray(list)) {
		return { ok: false, error: 'Aliases must be an array' };
	}
	if (list.length > 20) {
		return { ok: false, error: 'No more than 20 aliases' };
	}
	// Seed with the name so an alias that just repeats it gets dropped
	const seen = [name.trim().toLowerCase()];
	const cleaned = [];
	for (const alias of list) {
		if (typeof alias !== 'string' || alias.trim().length === 0) {
			return { ok: false, error: 'Each alias must be a non-empty string' };
		}
		if (alias.trim().length > 100) {
			return { ok: false, error: 'Each alias must be 100 characters or less' };
		}
		// "ConEd" and "coned" are the same vendor, keep the first spelling
		if (!seen.includes(alias.trim().toLowerCase())) {
			seen.push(alias.trim().toLowerCase());
			cleaned.push(alias.trim());
		}
	}

	// portal_url is optional; missing or empty string becomes null
	let url = null;
	if (portal_url !== undefined && portal_url !== null && portal_url !== '') {
		if (typeof portal_url !== 'string' || portal_url.length > 2048) {
			return { ok: false, error: 'Portal URL must be a string' };
		}
		let parsed;
		try {
			parsed = new URL(portal_url.trim());
		} catch {
			return { ok: false, error: 'Portal URL is not a valid URL' };
		}
		if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
			return { ok: false, error: 'Portal URL must start with http:// or https://' };
		}
		url = parsed.href;
	}

	return {
		ok: true,
		value: { name: name.trim(), aliases: cleaned, portal_url: url },
	};
}
