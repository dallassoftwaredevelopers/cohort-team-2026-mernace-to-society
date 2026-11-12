import { assertEquals } from 'jsr:@std/assert';
import { validateBillDecision } from '../_shared/validateBillDecision.js';

const valid = {
	billId: '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b',
	decision: 'approved',
};

Deno.test('accepts an approval without a note', () => {
	assertEquals(validateBillDecision(valid), {
		ok: true,
		value: { ...valid, note: null },
	});
});

Deno.test('accepts a rejection with a reason', () => {
	assertEquals(
		validateBillDecision({
			...valid,
			decision: 'rejected',
			note: 'Invoice amount does not match the contract',
		}),
		{
			ok: true,
			value: {
				billId: valid.billId,
				decision: 'rejected',
				note: 'Invoice amount does not match the contract',
			},
		},
	);
});

Deno.test('trims a decision note', () => {
	const result = validateBillDecision({ ...valid, note: '  reviewed  ' });
	assertEquals(result.ok, true);
	assertEquals(result.value.note, 'reviewed');
});

Deno.test('normalizes an empty approval note to null', () => {
	const result = validateBillDecision({ ...valid, note: '   ' });
	assertEquals(result.ok, true);
	assertEquals(result.value.note, null);
});

Deno.test('ignores fields the caller must not control', () => {
	assertEquals(validateBillDecision({ ...valid, actorId: 'other-user' }), {
		ok: true,
		value: { ...valid, note: null },
	});
});

const invalidCases = [
	['null body', null],
	['array body', [valid]],
	['missing bill ID', { ...valid, billId: undefined }],
	['malformed bill ID', { ...valid, billId: 'not-a-uuid' }],
	['bill ID as a number', { ...valid, billId: 42 }],
	['unsupported decision', { ...valid, decision: 'pending' }],
	['missing decision', { ...valid, decision: undefined }],
	['decision as a number', { ...valid, decision: 1 }],
	['note as a number', { ...valid, note: 123 }],
	['rejection without a note', { ...valid, decision: 'rejected' }],
	['rejection with a blank note', { ...valid, decision: 'rejected', note: '   ' }],
	['note longer than 2000 characters', { ...valid, note: 'x'.repeat(2001) }],
];

for (const [label, input] of invalidCases) {
	Deno.test(`rejects: ${label}`, () => {
		const result = validateBillDecision(input);
		assertEquals(result.ok, false);
	});
}
