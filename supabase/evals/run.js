// Measures how well extractBillData reads our sample bills.
//
// Each bill in bills/ has an answer key in expected/ with the same name
// (bills/sunmeadow.pdf -> expected/sunmeadow.json). The script sends every
// bill through the same code process-bill uses and compares field by field.
//
// Run from the supabase/ folder:
//   deno run -A --env-file=functions/.env evals/run.js           score every bill
//   deno run -A --env-file=functions/.env evals/run.js --draft   write starter answer keys
//   deno run -A --env-file=functions/.env evals/run.js --only=sunmeadow
//
// It calls the real AI, so each run costs a little. It isn't part of `deno test`.

import { extractBillData, MIME_BY_EXTENSION } from '../functions/_shared/openrouter.js';
import { normalize } from '../functions/_shared/matching.js';

const HERE = new URL('.', import.meta.url);
const BILLS = new URL('bills/', HERE);
const EXPECTED = new URL('expected/', HERE);
const RESULTS = new URL('results/', HERE);

// A draft answer key keeps this field until a person has checked it
const REVIEW_KEY = '_review';
const REVIEW_NOTE =
	'Draft written by the AI. Check every value against the PDF, fix it, then delete this line.';

const args = {
	draft: Deno.args.includes('--draft'),
	only: Deno.args.find((arg) => arg.startsWith('--only='))?.slice('--only='.length),
};

// ---------- How each field is compared ----------

// Lowercase, no punctuation, single spaces: "Sun Meadow Cleaning, LLC" -> "sun meadow cleaning llc"
function cleanText(value) {
	return String(value ?? '')
		.toLowerCase()
		.replace(/[^a-z0-9 ]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

// Each check gets the expected and actual value and returns true when they agree.
// null on both sides counts as correct: the bill doesn't show it and the model
// didn't guess.
const same = (compare) => (expected, actual) =>
	expected == null || actual == null ? expected == null && actual == null : compare(expected, actual);

const text = same((a, b) => cleanText(a) === cleanText(b));
const exact = same((a, b) => String(a).trim() === String(b).trim());
// Same rule the app uses to match accounts, so a dash or space isn't a miss
const accountNumber = same((a, b) => normalize(a) === normalize(b));
const money = same((a, b) => Math.abs(Number(a) - Number(b)) < 0.01);
const upper = same((a, b) => String(a).trim().toUpperCase() === String(b).trim().toUpperCase());

// "https://www.Example.com/" and "example.com" are the same site
const site = (value) =>
	String(value).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
const url = same((a, b) => site(a) === site(b));

// Same number of line items, with the same amounts (order doesn't matter)
function lineItems(expected = [], actual = []) {
	if (expected.length !== actual.length) return false;
	const sorted = (items) => items.map((item) => Number(item.amount)).sort((a, b) => a - b);
	const [a, b] = [sorted(expected), sorted(actual)];
	return a.every((amount, i) => Math.abs(amount - b[i]) < 0.01);
}

// The fields we score, how to read each one, and how to compare it
const FIELDS = [
	['vendor_name', (bill) => bill.vendor_name, text],
	['account_number', (bill) => bill.account_number, accountNumber],
	['invoice_number', (bill) => bill.invoice_number, exact],
	['amount', (bill) => bill.amount, money],
	['issue_date', (bill) => bill.issue_date, exact],
	['due_date', (bill) => bill.due_date, exact],
	['customer_name', (bill) => bill.customer_name, text],
	['address.street', (bill) => bill.service_address?.street, text],
	['address.city', (bill) => bill.service_address?.city, text],
	['address.state', (bill) => bill.service_address?.state, upper],
	['address.zip', (bill) => bill.service_address?.zip, exact],
	['portal_url', (bill) => bill.portal_url, url],
	['line_items', (bill) => bill.line_items, lineItems],
];

// ---------- Files ----------

async function listBills() {
	const bills = [];
	for await (const entry of Deno.readDir(BILLS)) {
		const extension = entry.name.split('.').pop().toLowerCase();
		if (!entry.isFile || !MIME_BY_EXTENSION[extension]) continue;

		const name = entry.name.slice(0, -(extension.length + 1));
		if (args.only && !name.includes(args.only)) continue;
		bills.push({ name, file: entry.name, mimeType: MIME_BY_EXTENSION[extension] });
	}
	return bills.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

async function readExpected(name) {
	try {
		return JSON.parse(await Deno.readTextFile(new URL(`${name}.json`, EXPECTED)));
	} catch (err) {
		if (err instanceof Deno.errors.NotFound) return null;
		throw new Error(`expected/${name}.json isn't valid JSON: ${err.message}`);
	}
}

async function extract(bill) {
	const bytes = await Deno.readFile(new URL(bill.file, BILLS));
	return extractBillData({ bytes, mimeType: bill.mimeType, filename: bill.file });
}

const show = (value) => (value === undefined ? 'missing' : JSON.stringify(value));

// ---------- --draft: write starter answer keys ----------

async function draft(bills) {
	for (const bill of bills) {
		if (await readExpected(bill.name)) {
			console.log(`skip   ${bill.name} (answer key already exists)`);
			continue;
		}
		const extracted = await extract(bill);
		const key = { [REVIEW_KEY]: REVIEW_NOTE, ...extracted };
		await Deno.writeTextFile(
			new URL(`${bill.name}.json`, EXPECTED),
			JSON.stringify(key, null, 2) + '\n',
		);
		console.log(`wrote  expected/${bill.name}.json`);
	}
	console.log(`\nNow open each file, check it against its PDF, and delete the "${REVIEW_KEY}" line.`);
}

// ---------- Default: score the model ----------

async function score(bills) {
	const tally = Object.fromEntries(FIELDS.map(([field]) => [field, { right: 0, total: 0 }]));
	const report = [];
	const skipped = [];

	for (const bill of bills) {
		const expected = await readExpected(bill.name);
		// An unchecked draft would grade the model against its own answers
		if (!expected || expected[REVIEW_KEY]) {
			skipped.push(`${bill.name} (${expected ? 'draft not reviewed yet' : 'no answer key'})`);
			continue;
		}

		let actual = {};
		let failed = false;
		try {
			actual = await extract(bill);
		} catch (err) {
			// A failed read counts every field as wrong
			console.log(`FAIL   ${bill.name}: ${err.message}`);
			failed = true;
		}

		const misses = [];
		for (const [field, read, compare] of FIELDS) {
			const ok = !failed && compare(read(expected), read(actual));
			tally[field].total++;
			if (ok) tally[field].right++;
			else misses.push({ field, expected: read(expected), actual: read(actual) });
		}

		report.push({ bill: bill.name, misses });
		console.log(
			misses.length === 0
				? `pass   ${bill.name}`
				: `miss   ${bill.name}\n` +
						misses
							.map((m) => `         ${m.field}: expected ${show(m.expected)}, got ${show(m.actual)}`)
							.join('\n'),
		);
	}

	if (report.length === 0) {
		console.log('\nNothing to score. Run with --draft first, then review the answer keys.');
	} else {
		printSummary(tally, report.length);
		await saveResults(tally, report);
	}
	if (skipped.length) console.log(`\nSkipped:\n  ${skipped.join('\n  ')}`);
}

function percent(right, total) {
	return total ? `${Math.round((right / total) * 100)}%` : '—';
}

function printSummary(tally, billCount) {
	console.log(`\nField accuracy over ${billCount} bill(s):`);
	let right = 0;
	let total = 0;
	for (const [field, counts] of Object.entries(tally)) {
		right += counts.right;
		total += counts.total;
		console.log(
			`  ${field.padEnd(16)} ${`${counts.right}/${counts.total}`.padStart(6)}  ${percent(counts.right, counts.total)}`,
		);
	}
	console.log(`  ${'overall'.padEnd(16)} ${`${right}/${total}`.padStart(6)}  ${percent(right, total)}`);
}

// One file per run, so you can compare before and after a change (e.g. temperature 0)
async function saveResults(tally, report) {
	await Deno.mkdir(RESULTS, { recursive: true });
	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const file = new URL(`${stamp}.json`, RESULTS);
	const model = Deno.env.get('OPENROUTER_MODEL') || 'default model';
	await Deno.writeTextFile(file, JSON.stringify({ model, tally, report }, null, 2) + '\n');
	console.log(`\nSaved evals/results/${stamp}.json`);
}

// ---------- Start ----------

if (!Deno.env.get('OPENROUTER_API_KEY')) {
	console.error('OPENROUTER_API_KEY is not set. Run with --env-file=functions/.env');
	Deno.exit(1);
}

const bills = await listBills();
if (bills.length === 0) {
	console.error('No bills found in evals/bills/.');
	Deno.exit(1);
}

await (args.draft ? draft(bills) : score(bills));
