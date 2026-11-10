import { checkDate, validateBill } from './validateBill.js';

// Decides where an uploaded bill goes, from what the AI read and which vendor
// account it matched. No database or AI calls, so it's easy to test.
//
// Returns { status, review_reason, fields }:
//   pending      → every check passed; it goes to a manager for approval
//   needs_review → something is missing or doesn't add up; review_reason says what
// fields are the bill columns to save. Anything unreadable is null, never a guess.
//
// match is what matchAccount() returns: { kind: 'one' | 'many' | 'none', account }
export function routeBill(extracted, match) {
	const bill = extracted ?? {};
	const account = match?.kind === 'one' ? match.account : null;
	const reasons = [];

	const accountLabel = bill.account_number
		? ` (account ${bill.account_number})`
		: '';
	if (match?.kind === 'many') {
		reasons.push(
			`More than one vendor account has this account number${accountLabel}`,
		);
	} else if (!account) {
		reasons.push(
			bill.account_number
				? `No vendor account matches ${bill.vendor_name || 'this bill'}${accountLabel}`
				: "Couldn't read an account number on this bill",
		);
	}

	// Same rules as a bill typed in by hand. The account was handled above,
	// so its "required" message would only repeat that.
	const check = validateBill({
		...bill,
		review_reason: null,
		vendor_account_id: account?.id,
	});
	if (!check.ok && check.error !== 'Vendor account is required') {
		reasons.push(check.error);
	}

	// Utility bills often add a previous balance, credits or taxes, so a mismatch
	// means "a person should look", not "reject"
	const lineItems = Array.isArray(bill.line_items) ? bill.line_items : [];
	if (lineItems.length > 0 && isNumber(bill.amount)) {
		const total = lineItems.reduce(
			(sum, item) => sum + (isNumber(item?.amount) ? item.amount : 0),
			0,
		);
		if (Math.abs(toCents(total) - toCents(bill.amount)) > 1) {
			reasons.push(
				`Line items add up to ${money(total)}, but the total due is ${money(bill.amount)}`,
			);
		}
	}

	return {
		status: reasons.length === 0 ? 'pending' : 'needs_review',
		review_reason: reasons.length === 0 ? null : reasons.join('. '),
		fields: {
			vendor_account_id: account?.id ?? null,
			// From the account, like create-bill, so the two can never disagree
			property_id: account?.property_id ?? null,
			invoice_number: cleanText(bill.invoice_number),
			amount: isNumber(bill.amount) ? toCents(bill.amount) / 100 : null,
			issue_date: realDateOrNull(bill.issue_date),
			due_date: realDateOrNull(bill.due_date),
		},
	};
}

function isNumber(value) {
	return typeof value === 'number' && Number.isFinite(value);
}

function toCents(value) {
	return Math.round(value * 100);
}

function money(value) {
	return `$${(toCents(value) / 100).toFixed(2)}`;
}

function cleanText(value) {
	return typeof value === 'string' && value.trim() ? value.trim() : null;
}

// The date columns reject anything that isn't a real date, so drop bad ones
function realDateOrNull(value) {
	return checkDate(value, 'date') === null ? value : null;
}
