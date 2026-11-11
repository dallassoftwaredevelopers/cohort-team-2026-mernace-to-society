// "123-456 789" → "123456789", so formatting differences don't block a match
export function normalize(value) {
	return String(value ?? '')
		.replace(/[^a-z0-9]/gi, '')
		.toUpperCase();
}

// Finds the vendor account a bill's account number belongs to.
// kind 'one' = a single match, 'many' = several accounts share the number
// (so a person must choose), 'none' = no account or no readable number.
export function matchAccount(accounts, accountNumber) {
	const target = normalize(accountNumber);
	const matches = target
		? accounts.filter((account) => normalize(account.account_number) === target)
		: [];

	if (matches.length === 1) return { kind: 'one', account: matches[0] };
	return { kind: matches.length > 1 ? 'many' : 'none', account: null };
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
