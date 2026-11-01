const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateBill(body) {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		return { ok: false, error: 'Body must be an object' };
	}

	// Only name, amount, due_date fields are read. Anything else in the body is ignored. We can always add more!
	const { name, amount, due_date } = body;

	if (typeof name !== 'string' || name.trim().length === 0) {
		return { ok: false, error: 'Name is required' };
	}
	if (name.trim().length > 100) {
		return { ok: false, error: 'Name must be 100 characters or less' };
	}

	if (typeof amount !== 'number' || !Number.isFinite(amount)) {
		return { ok: false, error: 'Amount must be a number' };
	}
	const rounded = Math.round(amount * 100) / 100;
	if (rounded <= 0) {
		return { ok: false, error: 'Amount must be greater than 0' };
	}
	if (rounded > 1000000) {
		return { ok: false, error: 'Amount is too large' };
	}

	if (typeof due_date !== 'string' || !DATE_RE.test(due_date)) {
		return { ok: false, error: 'Due date must be YYYY-MM-DD' };
	}
	// Catches dates that match the pattern but don't exist, like 2026-02-30
	const parsed = new Date(`${due_date}T00:00:00Z`);
	if (
		isNaN(parsed.getTime()) ||
		parsed.toISOString().slice(0, 10) !== due_date
	) {
		return { ok: false, error: 'Due date is not a real date' };
	}

	return { ok: true, value: { name: name.trim(), amount: rounded, due_date } };
}
