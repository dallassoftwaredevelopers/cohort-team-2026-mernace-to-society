import { assertEquals } from 'jsr:@std/assert';
import { validateBill } from '../_shared/validateBill.js';

const valid = {
	amount: 120.5,
	issue_date: '2026-10-15',
	due_date: '2026-11-01',
	vendor_account_id: '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b',
};

Deno.test('accepts a valid bill', () => {
	assertEquals(validateBill(valid), { ok: true, value: valid });
});

Deno.test('rounds amount to cents', () => {
	const result = validateBill({ ...valid, amount: 10.456 });
	assertEquals(result.value.amount, 10.46);
});

Deno.test('allows due date on the issue date', () => {
	const result = validateBill({ ...valid, due_date: valid.issue_date });
	assertEquals(result.ok, true);
});

Deno.test("drops fields the user shouldn't control", () => {
	const result = validateBill({
		...valid,
		created_by: 'someone-else',
		org_id: 'another-org',
		property_id: 'some-other-property',
		status: 'paid',
	});
	assertEquals(result, { ok: true, value: valid });
});

const invalidCases = [
	['null body', null],
	['array body', [valid]],
	['amount as string', { ...valid, amount: '120.50' }],
	['zero amount', { ...valid, amount: 0 }],
	['negative amount', { ...valid, amount: -50 }],
	['amount rounds to zero', { ...valid, amount: 0.004 }],
	['NaN amount', { ...valid, amount: NaN }],
	['Infinity amount', { ...valid, amount: Infinity }],
	['huge amount', { ...valid, amount: 5_000_000 }],
	['missing issue date', { ...valid, issue_date: undefined }],
	['wrong issue date format', { ...valid, issue_date: '10/15/2026' }],
	['impossible issue date', { ...valid, issue_date: '2026-02-30' }],
	['missing due date', { ...valid, due_date: undefined }],
	['wrong due date format', { ...valid, due_date: '11/01/2026' }],
	['due date words', { ...valid, due_date: 'November 1' }],
	['impossible due date', { ...valid, due_date: '2026-02-30' }],
	['due date as number', { ...valid, due_date: 20261101 }],
	['due date before issue date', { ...valid, due_date: '2026-10-01' }],
	['missing vendor account', { ...valid, vendor_account_id: undefined }],
	['vendor account not a uuid', { ...valid, vendor_account_id: 'FPL' }],
	['vendor account as number', { ...valid, vendor_account_id: 42 }],
];

for (const [label, input] of invalidCases) {
	Deno.test(`rejects: ${label}`, () => {
		assertEquals(validateBill(input).ok, false);
	});
}
