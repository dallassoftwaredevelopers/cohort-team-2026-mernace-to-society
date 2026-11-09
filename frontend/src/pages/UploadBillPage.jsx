import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import BillDetailsForm from '../components/BillDetailsForm';
import UploadDocument from '../components/UploadDocument';
import PropertyForm from '../components/PropertyForm';
import VendorForm from '../components/VendorForm';

// Calls an edge function and throws its own error message on failure.
// invoke hides that message on the response body.
async function callFunction(name, body) {
	const { data, error } = await supabase.functions.invoke(name, { body });
	if (error) {
		const details = await error.context?.json?.().catch(() => null);
		throw new Error(details?.error ?? 'Something went wrong. Please try again.');
	}
	return data;
}

// Asks match-bill which vendor account this bill belongs to. Returns
// { vendor_account_id, property_id, complete } for a match, { vendor_id } when
// there's no account (vendor_id is null for an unknown vendor), or null when
// several accounts match or the call fails, so the person picks from the dropdowns.
async function findMatch(bill) {
	try {
		const result = await callFunction('match-bill', bill);
		return result?.data ?? null;
	} catch (err) {
		console.error('match-bill failed:', err);
		return null;
	}
}

function UploadBillPage() {
	const [uploadedPath, setUploadedPath] = useState('');
	const [extracted, setExtracted] = useState(null);
	const [match, setMatch] = useState(null);
	const [isExtracting, setIsExtracting] = useState(false);
	const [extractError, setExtractError] = useState('');

	// Which modal is open: 'property', 'vendor', or null
	const [openForm, setOpenForm] = useState(null);
	const [existingVendor, setExistingVendor] = useState(null);
	const [isSaving, setIsSaving] = useState(false);
	const [formError, setFormError] = useState('');
	const [notice, setNotice] = useState('');
	// Bumped after adding an account so the bill form rebuilds with the new match
	const [formVersion, setFormVersion] = useState(0);

	const noMatch = match && !match.vendor_account_id;

	function resetBill() {
		setExtracted(null);
		setMatch(null);
		setExtractError('');
		setFormError('');
		setNotice('');
	}

	// UploadDocument calls this once the file is in storage
	async function handleUploaded(path) {
		setUploadedPath(path);
		resetBill();
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
			setMatch(await findMatch(data.data));
			setExtracted(data.data);
		}
		setIsExtracting(false);
	}

	function handleRemoved() {
		setUploadedPath('');
		resetBill();
	}

	function closeForm() {
		setOpenForm(null);
		setFormError('');
	}

	// Runs one modal's save, keeping it open with the error if the save fails
	async function saveFromForm(save) {
		setIsSaving(true);
		setFormError('');
		try {
			await save();
			setOpenForm(null);
		} catch (err) {
			setFormError(err.message);
		} finally {
			setIsSaving(false);
		}
	}

	function handleSaveProperty(property) {
		return saveFromForm(async () => {
			await callFunction('create-property', property);
			setNotice('Property added. Select it when you add the vendor account.');
		});
	}

	function handleSaveVendor(values) {
		return saveFromForm(async () => {
			if (match.vendor_id) {
				await callFunction('create-vendor-account', {
					...values,
					vendor_id: match.vendor_id,
				});
			} else {
				await callFunction('create-vendor', values);
			}

			// Match on the number the person saved, in case they corrected the AI's reading
			const bill = { ...extracted, account_number: values.account_number };
			setMatch(await findMatch(bill));
			setExtracted(bill);
			setFormVersion((version) => version + 1);
			setNotice('Vendor account added.');
		});
	}

	// Add Account mode needs the vendor's saved details, so load them first
	async function openVendorForm() {
		setFormError('');
		setNotice('');
		try {
			if (match.vendor_id) {
				const { vendor } = await callFunction('read-vendor-details', {
					vendorId: match.vendor_id,
				});
				setExistingVendor(vendor);
			}
			setOpenForm('vendor');
		} catch (err) {
			setFormError(err.message);
		}
	}

	const vendorLabel = extracted?.vendor_name || 'this vendor';
	const accountLabel = extracted?.account_number
		? ` (account ${extracted.account_number})`
		: '';

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

					{notice && (
						<p role="status" className="mt-4 text-sm text-green-700">
							{notice}
						</p>
					)}

					{/* Buttons, not an automatic popup: the AI may have misread the number */}
					{noMatch && (
						<div className="mt-4 rounded-lg border border-secondary p-4">
							<p className="text-sm font-semibold">
								{match.vendor_id
									? `We found ${vendorLabel}, but no matching account${accountLabel}.`
									: `We couldn't find ${vendorLabel}${accountLabel} in your vendors.`}
							</p>
							<p className="mt-1 text-sm text-gray-600">
								Add what's missing, or choose from the dropdowns below.
							</p>
							<div className="mt-3 flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() => {
										setFormError('');
										setNotice('');
										setOpenForm('property');
									}}
									className="btn-secondary px-4 py-2 text-sm"
								>
									+ Add property
								</button>
								<button
									type="button"
									onClick={openVendorForm}
									className="btn-primary px-4 py-2 text-sm"
								>
									+ Add vendor account
								</button>
							</div>
							{formError && !openForm && (
								<p role="alert" className="mt-2 text-sm text-red-700">
									{formError}
								</p>
							)}
						</div>
					)}

					{/* Hidden while the AI reads, so the form isn't built with empty values.
					    A new key makes React rebuild it with the new values. */}
					{!isExtracting && (
						<BillDetailsForm
							key={`${uploadedPath}-${formVersion}`}
							initialValues={extracted && { ...extracted, ...match }}
							source="upload"
						/>
					)}
				</section>
			</div>

			{openForm === 'property' && (
				<PropertyForm
					isSubmitting={isSaving}
					error={formError}
					onCancel={closeForm}
					onSubmit={handleSaveProperty}
				/>
			)}

			{openForm === 'vendor' && (
				<VendorForm
					addAccountMode={Boolean(match.vendor_id)}
					vendorData={existingVendor}
					initialValues={{
						name: extracted.vendor_name,
						account_number: extracted.account_number,
					}}
					isSubmitting={isSaving}
					error={formError}
					onCancel={closeForm}
					onSubmit={handleSaveVendor}
				/>
			)}
		</>
	);
}

export default UploadBillPage;
