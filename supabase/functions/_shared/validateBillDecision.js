const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateBillDecision(body) {
	if (typeof body !== 'object' || body === null || Array.isArray(body)) {
		return { ok: false, error: 'Body must be an object' };
	}

	const { billId, decision, note = null } = body;
	if (typeof billId !== 'string' || !UUID_RE.test(billId)) {
		return { ok: false, error: 'A valid bill ID is required' };
	}
	if (decision !== 'approved' && decision !== 'rejected') {
		return {
			ok: false,
			error: 'Decision must be approved or rejected',
		};
	}
	if (note !== null && typeof note !== 'string') {
		return { ok: false, error: 'Note must be text' };
	}

	const normalizedNote = typeof note === 'string' ? note.trim() : null;
	if (decision === 'rejected' && !normalizedNote) {
		return { ok: false, error: 'A reason is required to reject a bill' };
	}
	if (normalizedNote && normalizedNote.length > 2000) {
		return {
			ok: false,
			error: 'Decision note must be 2000 characters or less',
		};
	}

	return {
		ok: true,
		value: {
			billId,
			decision,
			note: normalizedNote || null,
		},
	};
}
