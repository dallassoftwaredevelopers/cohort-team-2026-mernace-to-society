import { assertEquals } from 'jsr:@std/assert';
import { findVendorId, normalize } from '../_shared/matching.js';

const vendors = [
	{ id: 'alder', name: 'Alder Creek Landscaping', aliases: [] },
	{ id: 'fpl', name: 'Florida Power & Light', aliases: ['FPL', 'FP&L'] },
	{ id: 'no-aliases', name: 'City Water', aliases: null },
];

Deno.test('normalize keeps only letters and digits, uppercased', () => {
	assertEquals(normalize('2000-456 700'), '2000456700');
	assertEquals(normalize('ab-12'), 'AB12');
	assertEquals(normalize(null), '');
});

Deno.test('finds a vendor by its name', () => {
	assertEquals(findVendorId(vendors, 'Alder Creek Landscaping'), 'alder');
});

Deno.test('ignores case and punctuation in the name', () => {
	assertEquals(findVendorId(vendors, 'alder creek landscaping.'), 'alder');
	assertEquals(findVendorId(vendors, 'FLORIDA POWER AND LIGHT'), null);
	assertEquals(findVendorId(vendors, 'florida power & light'), 'fpl');
});

Deno.test('finds a vendor by an alias', () => {
	assertEquals(findVendorId(vendors, 'FPL'), 'fpl');
	assertEquals(findVendorId(vendors, 'fp&l'), 'fpl');
});

Deno.test('handles a vendor with null aliases', () => {
	assertEquals(findVendorId(vendors, 'City Water'), 'no-aliases');
});

Deno.test('returns null for an unknown vendor', () => {
	assertEquals(findVendorId(vendors, 'Some New Company'), null);
});

Deno.test('does not match on part of a name', () => {
	assertEquals(findVendorId(vendors, 'Alder Creek'), null);
});

Deno.test('returns null for a missing or punctuation-only name', () => {
	for (const name of [undefined, null, '', '   ', '&']) {
		assertEquals(findVendorId(vendors, name), null);
	}
});

Deno.test('returns null rather than guessing between two vendors', () => {
	const shared = [
		{ id: 'a', name: 'Acme Water', aliases: ['Acme'] },
		{ id: 'b', name: 'Acme Power', aliases: ['Acme'] },
	];
	assertEquals(findVendorId(shared, 'Acme'), null);
});
