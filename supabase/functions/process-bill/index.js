import { withSupabase } from 'jsr:@supabase/server@^1';
import { encodeHex } from 'jsr:@std/encoding@^1/hex';
import { extractBillData, MIME_BY_EXTENSION } from '../_shared/openrouter.js';
import { findVendorId, matchAccount, normalize } from '../_shared/matching.js';
import { routeBill } from '../_shared/routeBill.js';

// DC-84: turns an uploaded file into a saved bill with no form to fill in.
//   1. Same file uploaded before?   → 409, no model call
//   2. AI reads it                  → fails: saved as extraction_failed
//   3. Match the vendor account and run the same checks as a typed-in bill
//   4. Same invoice for that account already entered? → 409, nothing saved
//   5. Save once, as pending (clean) or needs_review (with the reason)
// Either way the bill still goes through manager approval (decide_bill).
//
// The AI only reads the bill. Whether it's complete enough for approval is
// decided by routeBill here, and enforced again by the bill table's CHECK.

// Bills in these statuses don't count as duplicates, same as the DB's unique indexes
const NOT_DUPLICATES = '(rejected,extraction_failed)';
const UNIQUE_VIOLATION = '23505';

export default {
	fetch: withSupabase({ auth: 'user' }, async (req, { supabase }) => {
		if (req.method !== 'POST') {
			return Response.json({ error: 'Method not allowed' }, { status: 405 });
		}

		let body;
		try {
			body = await req.json();
		} catch {
			return Response.json({ error: 'Invalid JSON' }, { status: 400 });
		}

		// The bucket-relative path UploadDocument.jsx returns, e.g. "<uuid>.pdf"
		const path = body?.path;
		if (typeof path !== 'string' || path.trim().length === 0) {
			return Response.json({ error: 'path is required' }, { status: 400 });
		}

		const mimeType = MIME_BY_EXTENSION[path.split('.').pop().toLowerCase()];
		if (!mimeType) {
			return Response.json(
				{ error: 'File must be a PDF, JPG, or PNG' },
				{ status: 400 },
			);
		}

		// Who's calling, according to their verified token (never the body)
		const {
			data: { user },
		} = await supabase.auth.getUser();

		// Uses the caller's token, so storage policies decide if they may read it
		const { data: blob, error: downloadError } = await supabase.storage
			.from('invoices')
			.download(path);
		if (downloadError) {
			return Response.json({ error: downloadError.message }, { status: 404 });
		}

		const bytes = new Uint8Array(await blob.arrayBuffer());
		const fileHash = encodeHex(await crypto.subtle.digest('SHA-256', bytes));

		// 1. Same file → stop before paying for a model call
		const { data: sameFile, error: sameFileError } = await supabase
			.from('bill')
			.select('id')
			.eq('file_hash', fileHash)
			.not('status', 'in', NOT_DUPLICATES)
			.limit(1)
			.maybeSingle();
		if (sameFileError) return serverError(sameFileError);
		if (sameFile) {
			return duplicate(sameFile.id, 'This file was already uploaded.');
		}

		const upload = {
			file_path: path,
			file_hash: fileHash,
			source: 'upload',
			created_by: user.id,
		};

		// 2. AI reads the file. If it can't, keep the file so a person can finish it.
		let extracted;
		try {
			extracted = await extractBillData({ bytes, mimeType, filename: path });
		} catch (err) {
			console.error('Extraction error:', err);
			return saveBill(supabase, {
				...upload,
				status: 'extraction_failed',
				review_reason: "We couldn't read this bill. Fill in its details by hand.",
			});
		}

		// 3. Match and check
		const { data: accounts, error: accountsError } = await supabase
			.from('vendor_account')
			.select('id, property_id, account_number');
		if (accountsError) return serverError(accountsError);

		const match = matchAccount(accounts, extracted?.account_number);
		const route = routeBill(extracted, match);

		// 4. Same invoice for this account. The unique index from DC-92 would
		// also reject it; checking first lets us point to the existing bill.
		const { vendor_account_id, invoice_number } = route.fields;
		if (vendor_account_id && invoice_number) {
			const { data: accountBills, error: billsError } = await supabase
				.from('bill')
				.select('id, invoice_number')
				.eq('vendor_account_id', vendor_account_id)
				.not('status', 'in', NOT_DUPLICATES);
			if (billsError) return serverError(billsError);

			// normalize() matches the index: letters and digits only, uppercased
			const existing = accountBills.find(
				(bill) => normalize(bill.invoice_number) === normalize(invoice_number),
			);
			if (existing) {
				return duplicate(
					existing.id,
					`Invoice ${invoice_number} was already entered for this account.`,
				);
			}
		}

		// No account: say which vendor it is, if we know, so the page can offer
		// "add an account to this vendor" (DC-79) instead of a duplicate vendor
		let vendorId = null;
		if (match.kind === 'none') {
			const { data: vendors, error: vendorsError } = await supabase
				.from('vendor')
				.select('id, name, aliases');
			if (vendorsError) return serverError(vendorsError);
			vendorId = findVendorId(vendors, extracted?.vendor_name);
		}

		// 5. Save
		return saveBill(
			supabase,
			{
				...upload,
				...route.fields,
				status: route.status,
				review_reason: route.review_reason,
				extracted_data: extracted,
			},
			{ vendor_id: vendorId },
		);
	}),
};

async function saveBill(supabase, row, extra = {}) {
	const { data, error } = await supabase
		.from('bill')
		.insert(row)
		.select()
		.single();

	// Another upload of the same file or invoice slipped in between our
	// checks and this insert; the unique indexes caught it
	if (error?.code === UNIQUE_VIOLATION) {
		return duplicate(null, 'This bill was already uploaded.');
	}
	if (error) return serverError(error);

	return Response.json({ data, ...extra }, { status: 201 });
}

function duplicate(billId, message) {
	return Response.json(
		{ error: message, duplicate_bill_id: billId },
		{ status: 409 },
	);
}

function serverError(error) {
	console.error(error);
	return Response.json({ error: error.message }, { status: 500 });
}
