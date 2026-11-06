import { encodeBase64 } from 'jsr:@std/encoding@^1/base64';

// A cheap model that reads PDFs and images natively (no OCR step needed).
// Set OPENROUTER_MODEL to try a different one without changing code.
const DEFAULT_MODEL = 'google/gemini-2.5-flash';

// If the main model's provider is down, OpenRouter tries this one next.
// Also reads PDFs natively and supports strict JSON output.
const FALLBACK_MODEL = 'openai/gpt-4o-mini';

// Statuses that mean "busy or down right now", worth one more try
const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];
const RETRY_DELAY_MS = 1500;

// How OpenRouter turns a PDF into something the model can read:
// 'native' = the model reads the PDF itself (needs a model that supports files)
// 'cloudflare-ai' = OpenRouter converts it to text first, free, works with any model
const DEFAULT_PDF_ENGINE = 'native';

export const MIME_BY_EXTENSION = {
	pdf: 'application/pdf',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
};

// The shape we ask the model to return. match-bill (DC-77) validates it for real;
// this schema only tells the model what to produce.
const BILL_SCHEMA = {
	type: 'object',
	properties: {
		vendor_name: { type: ['string', 'null'] },
		account_number: { type: ['string', 'null'] },
		invoice_number: { type: ['string', 'null'] },
		amount: { type: ['number', 'null'], description: 'Total amount due' },
		issue_date: { type: ['string', 'null'], description: 'YYYY-MM-DD' },
		due_date: { type: ['string', 'null'], description: 'YYYY-MM-DD' },
		line_items: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					description: { type: 'string' },
					amount: { type: 'number' },
				},
				required: ['description', 'amount'],
				additionalProperties: false,
			},
		},
	},
	required: [
		'vendor_name',
		'account_number',
		'invoice_number',
		'amount',
		'issue_date',
		'due_date',
		'line_items',
	],
	additionalProperties: false,
};

const PROMPT =
	'Extract the details of this utility bill or invoice. ' +
	'Use null for anything you cannot find. Do not guess. ' +
	'Dates must be YYYY-MM-DD. Amounts are plain numbers with no currency symbols.';

// Sends a file to OpenRouter and returns the extracted bill as an object.
// Throws if the API call fails or the model's answer isn't valid JSON,
// so the caller decides what to do (e.g. mark the bill as failed).
export async function extractBillData({ bytes, mimeType, filename }) {
	const model = Deno.env.get('OPENROUTER_MODEL') || DEFAULT_MODEL;
	const pdfEngine = Deno.env.get('OPENROUTER_PDF_ENGINE') || DEFAULT_PDF_ENGINE;
	const dataUrl = `data:${mimeType};base64,${encodeBase64(bytes)}`;

	// PDFs go in a "file" part, images in an "image_url" part
	const filePart =
		mimeType === 'application/pdf'
			? { type: 'file', file: { filename, file_data: dataUrl } }
			: { type: 'image_url', image_url: { url: dataUrl } };

	const requestBody = JSON.stringify({
		// OpenRouter tries these in order if a provider fails
		models: model === FALLBACK_MODEL ? [model] : [model, FALLBACK_MODEL],
		messages: [
			{ role: 'user', content: [{ type: 'text', text: PROMPT }, filePart] },
		],
		// Set explicitly so OpenRouter never falls back to its paid OCR engine
		plugins: [{ id: 'file-parser', pdf: { engine: pdfEngine } }],
		response_format: {
			type: 'json_schema',
			json_schema: { name: 'bill', strict: true, schema: BILL_SCHEMA },
		},
	});

	// Try up to 2 times: providers sometimes have brief outages (e.g. a 503)
	let response;
	for (let attempt = 1; attempt <= 2; attempt++) {
		response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				// Server-side secret, never shipped to the frontend
				Authorization: `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
				'Content-Type': 'application/json',
			},
			body: requestBody,
		});

		if (response.ok || !RETRYABLE_STATUSES.includes(response.status)) break;
		if (attempt === 1) {
			console.warn(`OpenRouter ${response.status}, retrying once...`);
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
		}
	}

	// fetch doesn't throw on 4xx/5xx, so check the status ourselves
	if (!response.ok) {
		throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
	}

	const data = await response.json();
	// Logged so you can see in the function logs when the fallback model was used
	console.log('Extracted with model:', data.model);
	return JSON.parse(data.choices[0].message.content);
}
