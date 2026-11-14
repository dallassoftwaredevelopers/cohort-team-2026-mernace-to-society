import { useRef, useState } from 'react';
import { supabase } from '../../utils/supabase';

const extensionsByType = {
	'application/pdf': 'pdf',
	'image/jpeg': 'jpg',
	'image/png': 'png',
};

// disabled: the page is still working on the last upload (e.g. reading the bill)
function UploadDocument({ onUploaded, onRemoved, disabled = false }) {
	const [file, setFile] = useState(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState('');
	const [uploadedPath, setUploadedPath] = useState('');
	const fileInputRef = useRef(null);
	const busy = isUploading || disabled;

	function handleFileSelection(selectedFile) {
		if (!selectedFile) return;

		if (!extensionsByType[selectedFile.type]) {
			setUploadError('Please select a PDF, JPG, or PNG file. Up to 50MB size');
			return;
		}

		setFile(selectedFile);
		setUploadError('');
		setUploadedPath('');
	}

	async function handleUpload() {
		if (!file || busy || uploadedPath) return;

		setIsUploading(true);
		setUploadError('');
		setUploadedPath('');

		try {
			// The private bucket's policies require the user to be signed in.
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();

			if (authError) throw authError;
			if (!user) {
				throw new Error('Please sign in before uploading a bill.');
			}

			// Generate a unique storage path so files with matching names don't collide.
			const extension = extensionsByType[file.type];
			const objectPath = `${crypto.randomUUID()}.${extension}`;

			// Upload the file to the private bucket and preserve its original name as metadata.
			const { data, error } = await supabase.storage
				.from('invoices')
				.upload(objectPath, file, {
					contentType: file.type,
					upsert: false,
					metadata: { originalName: file.name },
				});

			if (error) throw error;

			// Save the bucket-relative path; a bill record can reference it later.
			setUploadedPath(data.path);
			onUploaded?.(data.path);
		} catch (error) {
			setUploadError(
				error instanceof Error
					? error.message
					: 'The file could not be uploaded. Please try again.',
			);
		} finally {
			// Re-enable the upload controls whether the request succeeded or failed.
			setIsUploading(false);
		}
	}

	function removeFile() {
		setFile(null);
		setUploadError('');
		setUploadedPath('');
		onRemoved?.();
	}

	return (
		<div className="flex flex-1 flex-col">
			<input
				ref={fileInputRef}
				type="file"
				accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
				className="sr-only"
				disabled={busy}
				onChange={(event) => {
					// Clearing the input lets the same file be selected again afterward.
					handleFileSelection(event.target.files?.[0]);
					event.target.value = '';
				}}
			/>

			{/* This drop target supports both dragging a file and using the chooser button. */}
			<div
				className={`flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center ${
					isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
				}`}
				onDragOver={(event) => {
					event.preventDefault();
					if (!busy) setIsDragging(true);
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={(event) => {
					event.preventDefault();
					setIsDragging(false);
					if (!busy) handleFileSelection(event.dataTransfer.files[0]);
				}}
			>
				<p>
					{isDragging ? 'Drop your file here!' : 'Upload your bill or invoice'}
				</p>
				<p className="mt-1 text-sm text-gray-500">PDF, JPG, or PNG</p>
				<button
					type="button"
					disabled={busy}
					onClick={() => fileInputRef.current?.click()}
					className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
				>
					Choose file
				</button>
			</div>

			{file && (
				<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
					<p className="text-sm text-gray-700">
						Selected file: <span className="font-medium">{file.name}</span>
					</p>
					<button
						type="button"
						disabled={busy}
						onClick={removeFile}
						className="text-sm text-red-600 hover:text-red-800 disabled:opacity-60"
					>
						Remove
					</button>
				</div>
			)}

			{/* Hidden once this file is uploaded, so it can't be sent twice.
			    Choosing another file brings it back. */}
			{file && !uploadedPath && (
				<button
					type="button"
					disabled={busy}
					onClick={handleUpload}
					className="btn-primary mt-4 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isUploading ? 'Uploading...' : 'Upload file'}
				</button>
			)}

			{uploadError && (
				<p role="alert" className="mt-3 text-sm text-red-700">
					{uploadError}
				</p>
			)}

			{uploadedPath && (
				<p role="status" className="mt-3 break-all text-sm text-green-700">
					Upload complete. Storage path: {uploadedPath}
				</p>
			)}
		</div>
	);
}

export default UploadDocument;
