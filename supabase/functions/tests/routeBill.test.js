import { assertEquals, assertStringIncludes } from 'jsr:@std/assert';
import { routeBill } from '../_shared/routeBill.js';
import { matchAccount } from '../_shared/matching.js';

const account = {
	id: '11111111-1111-4111-8111-111111111111',
	property_id: '22222222-2222-4222-8222-222222222222',
	account_number: '2000-456-700',
};
const one = { kind: 'one', account };

const cleanBill = {
	vendor_name: 'City Water',
	account_number: '2000 456 700',
	invoice_number: ' INV-1001 ',
	amount: 125.5,
	issue_date: '2026-11-01',
	due_date: '2026-11-20',
	line_items: [
		{ description: 'Water', amount: 100 },
		{ description: 'Sewer', amount: 25.5 },
	],
};

Deno.test('clean bill with one matching account goes to pending', () => {
	const route = routeBill(cleanBill, one);
	assertEquals(route.status, 'pending');
	assertEquals(route.review_reason, null);
	assertEquals(route.fields, {
		vendor_account_id: account.id,
		property_id: account.property_id,
		invoice_number: 'INV-1001',
		amount: 125.5,
		issue_date: '2026-11-01',
		due_date: '2026-11-20',
	});
});

Deno.test('no matching account goes to needs_review and says which account', () => {
	const route = routeBill(cleanBill, { kind: 'none', account: null });
	assertEquals(route.status, 'needs_review');
	assertStringIncludes(route.review_reason, 'No vendor account matches City Water');
	assertStringIncludes(route.review_reason, '2000 456 700');
	assertEquals(route.fields.vendor_account_id, null);
	assertEquals(route.fields.property_id, null);
	// Everything else the AI read is still saved for the person to check
	assertEquals(route.fields.amount, 125.5);
});

Deno.test('several accounts with the same number go to needs_review', () => {
	const route = routeBill(cleanBill, { kind: 'many', account: null });
	assertEquals(route.status, 'needs_review');
	assertStringIncludes(route.review_reason, 'More than one vendor account');
});

Deno.test('missing account number gets its own reason', () => {
	const route = routeBill({ ...cleanBill, account_number: null }, {
		kind: 'none',
		account: null,
	});
	assertStringIncludes(route.review_reason, "Couldn't read an account number");
});

Deno.test('failing the normal bill rules goes to needs_review', () => {
	const route = routeBill({ ...cleanBill, due_date: '2026-10-01' }, one);
	assertEquals(route.status, 'needs_review');
	assertStringIncludes(route.review_reason, 'Due date cannot be before issue date');
});

Deno.test('a zero or missing amount is never sent to approval', () => {
	assertEquals(routeBill({ ...cleanBill, amount: 0, line_items: [] }, one).status, 'needs_review');
	const missing = routeBill({ ...cleanBill, amount: null }, one);
	assertEquals(missing.status, 'needs_review');
	assertEquals(missing.fields.amount, null);
});

Deno.test('line items that do not add up go to needs_review, not rejected', () => {
	const route = routeBill({ ...cleanBill, amount: 175.5 }, one);
	assertEquals(route.status, 'needs_review');
	assertStringIncludes(route.review_reason, 'Line items add up to $125.50, but the total due is $175.50');
});

Deno.test('a cent of rounding in line items is fine', () => {
	const route = routeBill({
		...cleanBill,
		amount: 0.3,
		line_items: [
			{ description: 'a', amount: 0.1 },
			{ description: 'b', amount: 0.2 },
		],
	}, one);
	assertEquals(route.status, 'pending');
});

Deno.test('no line items skips that check', () => {
	assertEquals(routeBill({ ...cleanBill, line_items: [] }, one).status, 'pending');
});

Deno.test('unreadable values are saved as null, not guessed', () => {
	const route = routeBill({
		...cleanBill,
		invoice_number: '   ',
		issue_date: '2026-02-30',
		due_date: 'Nov 20',
		amount: '125.50',
	}, one);
	assertEquals(route.status, 'needs_review');
	assertEquals(route.fields.invoice_number, null);
	assertEquals(route.fields.issue_date, null);
	assertEquals(route.fields.due_date, null);
	assertEquals(route.fields.amount, null);
});

Deno.test('several problems are all listed', () => {
	const route = routeBill({ ...cleanBill, amount: 175.5 }, { kind: 'none', account: null });
	assertStringIncludes(route.review_reason, 'No vendor account matches');
	assertStringIncludes(route.review_reason, 'Line items add up');
});

Deno.test('handles a null extraction without throwing', () => {
	const route = routeBill(null, { kind: 'none', account: null });
	assertEquals(route.status, 'needs_review');
});

Deno.test('matchAccount ignores formatting and reports one, many or none', () => {
	const accounts = [
		account,
		{ id: 'b', property_id: 'p', account_number: '555' },
		{ id: 'c', property_id: 'p', account_number: '5-5-5' },
	];
	assertEquals(matchAccount(accounts, '2000456700'), { kind: 'one', account });
	assertEquals(matchAccount(accounts, '555').kind, 'many');
	assertEquals(matchAccount(accounts, '999'), { kind: 'none', account: null });
	assertEquals(matchAccount(accounts, null), { kind: 'none', account: null });
});
