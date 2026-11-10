import { withSupabase } from 'jsr:@supabase/server@^1';
import { extractBillData, MIME_BY_EXTENSION } from '../_shared/openrouter.js';

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

		const extension = path.split('.').pop().toLowerCase();
		const mimeType = MIME_BY_EXTENSION[extension];
		if (!mimeType) {
			return Response.json(
				{ error: 'File must be a PDF, JPG, or PNG' },
				{ status: 400 },
			);
		}

		// Download the file. This uses the caller's token, so storage policies
		// still decide whether they're allowed to read it.
		const { data: blob, error: downloadError } = await supabase.storage
			.from('invoices')
			.download(path);

		if (downloadError) {
			return Response.json({ error: downloadError.message }, { status: 404 });
		}

		let extracted;
		try {
			extracted = await extractBillData({
				bytes: new Uint8Array(await blob.arrayBuffer()),
				mimeType,
				filename: path,
			});
		} catch (err) {
			console.error('Extraction error:', err);
			return Response.json({ error: 'Extraction failed' }, { status: 502 });
		}

		// TODO (DC-76): save `extracted` on a bill row and mark failures there,
		// once the bill table can hold an uploaded bill (see schema proposal).
		return Response.json({ data: extracted }, { status: 200 });
	}),
};
