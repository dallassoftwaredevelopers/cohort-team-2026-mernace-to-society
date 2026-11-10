// Try the bill extraction model on PDFs/images from your own computer.
// No Supabase, no login, no deploy: it calls the same helper extract-bill uses.
//
// Usage (from the repo root):
//   deno run --allow-read --allow-net --allow-env \
//     --env-file=supabase/functions/.env \
//     supabase/scripts/try-extract.js path/to/bill.pdf [more files...]

import {
	extractBillData,
	MIME_BY_EXTENSION,
} from '../functions/_shared/openrouter.js';

const files = Deno.args;
if (files.length === 0) {
	console.error('Give at least one file: try-extract.js bill.pdf');
	Deno.exit(1);
}
if (!Deno.env.get('OPENROUTER_API_KEY')) {
	console.error('OPENROUTER_API_KEY is missing. Put it in supabase/functions/.env');
	Deno.exit(1);
}

console.log(`Model: ${Deno.env.get('OPENROUTER_MODEL') || '(default)'}\n`);

for (const file of files) {
	const extension = file.split('.').pop().toLowerCase();
	const mimeType = MIME_BY_EXTENSION[extension];
	if (!mimeType) {
		console.log(`--- ${file}: skipped, must be PDF, JPG, or PNG\n`);
		continue;
	}

	const started = Date.now();
	try {
		const result = await extractBillData({
			bytes: await Deno.readFile(file),
			mimeType,
			filename: file.split('/').pop(),
		});
		const seconds = ((Date.now() - started) / 1000).toFixed(1);
		console.log(`--- ${file} (${seconds}s)`);
		console.log(JSON.stringify(result, null, 2), '\n');
	} catch (err) {
		console.log(`--- ${file}: FAILED`);
		console.log(err.message, '\n');
	}
}
