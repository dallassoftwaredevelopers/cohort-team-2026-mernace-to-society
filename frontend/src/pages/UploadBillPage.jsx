import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import BillDetailsForm from '../components/BillDetailsForm';
import UploadDocument from '../components/UploadDocument';

function UploadBillPage() {
	const [uploadedPath, setUploadedPath] = useState('');
	const [extracted, setExtracted] = useState(null);
	const [isExtracting, setIsExtracting] = useState(false);
	const [extractError, setExtractError] = useState('');

	// UploadDocument calls this once the file is in storage
	async function handleUploaded(path) {
		setUploadedPath(path);
		setExtracted(null);
		setExtractError('');
		setIsExtracting(true);

		const { data, error } = await supabase.functions.invoke('extract-bill', {
			body: { path },
		});

		if (error) {
			// The function's { error } message is on the response body
			const details = await error.context?.json?.().catch(() => null);
			setExtractError(
				details?.error ??
					"We couldn't read this bill. Please fill in the details below.",
			);
		} else {
			// invoke puts the response body in `data`; extract-bill's body is { data: {...} }
			setExtracted(data.data);
		}
		setIsExtracting(false);
	}

	function handleRemoved() {
		setUploadedPath('');
		setExtracted(null);
		setExtractError('');
	}

	return (
		<>
			<section className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="font-serif text-2xl font-bold">Upload a bill</h1>
					<p className="mt-2 text-sm text-gray-600">
						Upload a bill document or image, then review and complete its
						details.
					</p>
				</div>
				<Link to="/bills" className="btn-secondary px-4 py-2 text-sm">
					&larr; Return to Bills
				</Link>
			</section>

			<div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
				<section className="card flex min-h-[300px] flex-col items-center">
					<h2 className="text-lg font-bold">Document Upload</h2>
					<p className="mt-1 text-sm text-gray-600">
						Upload your bill or invoice (PDF, JPG, or PNG).
					</p>

					<UploadDocument
						onUploaded={handleUploaded}
						onRemoved={handleRemoved}
					/>
				</section>

				<section className="card">
					<h2 className="text-lg font-bold">Bill details</h2>
					<p className="mt-1 text-sm text-gray-600">
						Review or complete the bill details associated with this file.
					</p>

					{isExtracting && (
						<p role="status" className="mt-4 text-sm text-gray-600">
							Reading bill...
						</p>
					)}
					{extractError && (
						<p role="alert" className="mt-4 text-sm text-red-700">
							{extractError}
						</p>
					)}

					{/* Hidden while the AI reads, so the form isn't built with empty values.
					    A new key per upload makes React rebuild it with the new values. */}
					{!isExtracting && (
						<BillDetailsForm key={uploadedPath} initialValues={extracted} />
					)}
				</section>
			</div>
		</>
	);
}

export default UploadBillPage;
