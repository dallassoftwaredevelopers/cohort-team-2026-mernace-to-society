import { assertEquals } from 'jsr:@std/assert';
import { validateVendorAccount } from '../_shared/validateVendorAccount.js';

const valid = {
	vendor_id: '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b',
	property_id: '9c1d7e2a-4b3f-4a8e-9d6c-2f1e3a4b5c6d',
	account_number: '2000-456-700',
	service: 'landscaping',
	payment_type: 'ach',
};

function errorFor(changes) {
	return validateVendorAccount({ ...valid, ...changes }).error;
}

Deno.test('accepts a valid vendor account', () => {
	assertEquals(validateVendorAccount(valid), { ok: true, value: valid });
});

Deno.test('trims account number and service', () => {
	const result = validateVendorAccount({
		...valid,
		account_number: '  2000456700 ',
		service: ' water ',
	});
	assertEquals(result.value.account_number, '2000456700');
	assertEquals(result.value.service, 'water');
});

Deno.test('payment type is optional and becomes null', () => {
	for (const payment_type of [undefined, null, '']) {
		const result = validateVendorAccount({ ...valid, payment_type });
		assertEquals(result.ok, true);
		assertEquals(result.value.payment_type, null);
	}
});

Deno.test('rejects an unknown payment type', () => {
	assertEquals(
		errorFor({ payment_type: 'bitcoin' }),
		'Payment type must be ach, card or check',
	);
});

Deno.test('rejects a missing or malformed vendor or property', () => {
	assertEquals(errorFor({ vendor_id: undefined }), 'Vendor is required');
	assertEquals(errorFor({ vendor_id: 'not-a-uuid' }), 'Vendor is required');
	assertEquals(errorFor({ property_id: undefined }), 'Property is required');
	assertEquals(errorFor({ property_id: 123 }), 'Property is required');
});

Deno.test('rejects an account number with no letters or digits', () => {
	for (const account_number of [undefined, '', '   ', '--- --']) {
		assertEquals(errorFor({ account_number }), 'Account number is required');
	}
});

Deno.test('rejects values that are too long', () => {
	assertEquals(
		errorFor({ account_number: '1'.repeat(51) }),
		'Account number must be 50 characters or less',
	);
	assertEquals(
		errorFor({ service: 'a'.repeat(51) }),
		'Service must be 50 characters or less',
	);
});

Deno.test('rejects a missing service', () => {
	assertEquals(errorFor({ service: '  ' }), 'Service is required');
});

Deno.test("drops fields the user shouldn't control", () => {
	const result = validateVendorAccount({
		...valid,
		id: 'someone-elses-id',
		status: 'inactive',
	});
	assertEquals(result, { ok: true, value: valid });
});

Deno.test('rejects a body that is not an object', () => {
	for (const body of [null, 'text', []]) {
		assertEquals(validateVendorAccount(body).error, 'Body must be an object');
	}
});
