const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PAYMENT_TYPES = ['ach', 'card', 'check'];

export function validateVendorAccount(body) {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		return { ok: false, error: 'Body must be an object' };
	}

	const { vendor_id, property_id, account_number, service, payment_type } =
		body;

	if (typeof vendor_id !== 'string' || !UUID_RE.test(vendor_id)) {
		return { ok: false, error: 'Vendor is required' };
	}
	if (typeof property_id !== 'string' || !UUID_RE.test(property_id)) {
		return { ok: false, error: 'Property is required' };
	}

	// match-bill compares letters and digits only, so an account number needs at least one
	if (typeof account_number !== 'string' || !/[a-z0-9]/i.test(account_number)) {
		return { ok: false, error: 'Account number is required' };
	}
	if (account_number.trim().length > 50) {
		return { ok: false, error: 'Account number must be 50 characters or less' };
	}

	if (typeof service !== 'string' || service.trim().length === 0) {
		return { ok: false, error: 'Service is required' };
	}
	if (service.trim().length > 50) {
		return { ok: false, error: 'Service must be 50 characters or less' };
	}

	// payment_type is optional; missing or empty string becomes null
	const paymentType =
		payment_type === undefined || payment_type === null || payment_type === ''
			? null
			: payment_type;
	if (paymentType !== null && !PAYMENT_TYPES.includes(paymentType)) {
		return { ok: false, error: 'Payment type must be ach, card or check' };
	}

	return {
		ok: true,
		value: {
			vendor_id,
			property_id,
			account_number: account_number.trim(),
			service: service.trim(),
			payment_type: paymentType,
		},
	};
}
