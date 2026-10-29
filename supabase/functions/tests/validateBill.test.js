import { assertEquals } from 'jsr:@std/assert';
import { validateBill } from '../_shared/validateBill.js';

const valid = { name: 'Electric', amount: 120.5, due_date: '2026-11-01' };

Deno.test('accepts a valid bill', () => {
	assertEquals(validateBill(valid), { ok: true, value: valid });
});

Deno.test('trims the name', () => {
	const result = validateBill({ ...valid, name: '  Electric  ' });
	assertEquals(result.value.name, 'Electric');
});

Deno.test('rounds amount to cents', () => {
	const result = validateBill({ ...valid, amount: 10.456 });
	assertEquals(result.value.amount, 10.46);
});

Deno.test("drops fields the user shouldn't control", () => {
	const result = validateBill({
		...valid,
		user_id: 'someone-else',
		status: 'paid',
	});
	assertEquals(result, { ok: true, value: valid });
});

const invalidCases = [
	['null body', null],
	['array body', [valid]],
	['missing name', { ...valid, name: undefined }],
	['blank name', { ...valid, name: '   ' }],
	['name too long', { ...valid, name: 'x'.repeat(101) }],
	['amount as string', { ...valid, amount: '120.50' }],
	['zero amount', { ...valid, amount: 0 }],
	['negative amount', { ...valid, amount: -50 }],
	['amount rounds to zero', { ...valid, amount: 0.004 }],
	['NaN amount', { ...valid, amount: NaN }],
	['Infinity amount', { ...valid, amount: Infinity }],
	['huge amount', { ...valid, amount: 5_000_000 }],
	['wrong date format', { ...valid, due_date: '11/01/2026' }],
	['date words', { ...valid, due_date: 'November 1' }],
	['impossible date', { ...valid, due_date: '2026-02-30' }],
	['date as number', { ...valid, due_date: 20261101 }],
];

for (const [label, input] of invalidCases) {
	Deno.test(`rejects: ${label}`, () => {
		assertEquals(validateBill(input).ok, false);
	});
}
