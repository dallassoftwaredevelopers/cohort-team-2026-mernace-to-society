import { assertEquals } from 'jsr:@std/assert';
import { validateVendor } from '../_shared/validateVendor.js';

const valid = {
	name: 'Consolidated Edison',
	aliases: ['ConEd', 'Con Edison'],
	portal_url: 'https://www.coned.com/',
};

Deno.test('accepts a valid vendor', () => {
	assertEquals(validateVendor(valid), { ok: true, value: valid });
});

Deno.test('only name is required', () => {
	const result = validateVendor({ name: 'ConEd' });
	assertEquals(result, {
		ok: true,
		value: { name: 'ConEd', aliases: [], portal_url: null },
	});
});

Deno.test('trims the name', () => {
	const result = validateVendor({ ...valid, name: '  Consolidated Edison  ' });
	assertEquals(result.value.name, 'Consolidated Edison');
});

Deno.test('empty portal_url becomes null', () => {
	const result = validateVendor({ ...valid, portal_url: '' });
	assertEquals(result.value.portal_url, null);
});

Deno.test('trims aliases', () => {
	const result = validateVendor({ ...valid, aliases: ['  ConEd  '] });
	assertEquals(result.value.aliases, ['ConEd']);
});

Deno.test('removes duplicate aliases ignoring case', () => {
	const result = validateVendor({ ...valid, aliases: ['ConEd', 'coned', 'CONED'] });
	assertEquals(result.value.aliases, ['ConEd']);
});

Deno.test('drops an alias that repeats the name', () => {
	const result = validateVendor({ ...valid, aliases: ['consolidated edison', 'ConEd'] });
	assertEquals(result.value.aliases, ['ConEd']);
});

Deno.test("drops fields the user shouldn't control", () => {
	const result = validateVendor({ ...valid, status: 'inactive', id: 'abc' });
	assertEquals(result, { ok: true, value: valid });
});

const invalidCases = [
	['null body', null],
	['array body', [valid]],
	['missing name', { ...valid, name: undefined }],
	['blank name', { ...valid, name: '   ' }],
	['name not a string', { ...valid, name: 42 }],
	['name too long', { ...valid, name: 'x'.repeat(101) }],
	['aliases not an array', { ...valid, aliases: 'ConEd' }],
	['blank alias', { ...valid, aliases: ['ConEd', '   '] }],
	['alias not a string', { ...valid, aliases: [42] }],
	['alias too long', { ...valid, aliases: ['x'.repeat(101)] }],
	['too many aliases', { ...valid, aliases: Array.from({ length: 21 }, (_, i) => `a${i}`) }],
	['portal_url not a string', { ...valid, portal_url: 123 }],
	['portal_url not a url', { ...valid, portal_url: 'coned dot com' }],
	['portal_url javascript scheme', { ...valid, portal_url: 'javascript:alert(1)' }],
	['portal_url ftp scheme', { ...valid, portal_url: 'ftp://coned.com' }],
];

for (const [label, input] of invalidCases) {
	Deno.test(`rejects: ${label}`, () => {
		assertEquals(validateVendor(input).ok, false);
	});
}
