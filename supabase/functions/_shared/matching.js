// "123-456 789" → "123456789", so formatting differences don't block a match
export function normalize(value) {
	return String(value ?? '')
		.replace(/[^a-z0-9]/gi, '')
		.toUpperCase();
}

// Finds the vendor a bill's vendor name refers to, checking each vendor's name
// and aliases. Returns its id, or null when there's no match or more than one,
// because a wrong guess here would attach a new account to the wrong company.
export function findVendorId(vendors, vendorName) {
	const target = normalize(vendorName);
	if (!target) return null;

	const matches = vendors.filter((vendor) =>
		[vendor.name, ...(vendor.aliases ?? [])].some(
			(name) => normalize(name) === target,
		),
	);

	return matches.length === 1 ? matches[0].id : null;
}
