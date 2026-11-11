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
// { vendor_account_id, property_id, complete } for a match, or null when there's
// no single match or the call fails, so the person picks from the dropdowns.
async function findMatch(bill) {
	try {
		const result = await callFunction('match-bill', bill);
		return result?.data ?? null;
	} catch (err) {
		console.error('match-bill failed:', err);
		return null;
	}
}

// Lowercase, no punctuation, single spaces: "HarborLite Design Co." -> "harborlite design co"
function clean(text) {
	return (text ?? '')
		.toLowerCase()
		.replace(/[^a-z0-9 ]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

// Looks for a saved property with the same name as the customer on the bill.
// Name only: names are unique, but several properties can share a street.
// Only a suggestion, so a failed read returns null.
async function findExistingProperty(extracted) {
	const name = clean(extracted?.customer_name);
	if (!name) return null;

	const { data, error } = await supabase.from('property').select('id, name');
	if (error) return null;

	return data.find((property) => clean(property.name) === name) ?? null;
}

function formatMoney(amount) {
	return amount == null
		? '—'
		: Number(amount).toLocaleString('en-US', {
				style: 'currency',
				currency: 'USD',
			});
}

function UploadBillPage() {
	// The bill process-bill saved: pending, needs_review or extraction_failed
	const [bill, setBill] = useState(null);
	// Set when there's no account but we recognized the vendor (for Add Account)
	const [vendorId, setVendorId] = useState(null);
	// { id, name } of a saved property this bill seems to be for, or null
	const [knownProperty, setKnownProperty] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [processError, setProcessError] = useState('');
	// { message, billId } when this file or invoice was already entered
	const [duplicate, setDuplicate] = useState(null);

	// Which modal is open: 'property', 'vendor', or null
	const [openForm, setOpenForm] = useState(null);
	const [existingVendor, setExistingVendor] = useState(null);
	const [isSaving, setIsSaving] = useState(false);
	const [formError, setFormError] = useState('');
	const [notice, setNotice] = useState('');
	// Bumped after adding an account so the bill form rebuilds with the new match
	const [formVersion, setFormVersion] = useState(0);

	const extracted = bill?.extracted_data ?? null;
	const needsFixing = bill && bill.status !== 'pending';
	const noAccount =
		bill?.status === 'needs_review' && !bill.vendor_account_id && extracted;

	function resetBill() {
		setBill(null);
		setVendorId(null);
		setKnownProperty(null);
		setProcessError('');
		setDuplicate(null);
		setFormError('');
		setNotice('');
	}

	// UploadDocument calls this once the file is in storage. process-bill reads,
	// matches, checks and saves it in one step; nothing to submit afterwards.
	async function handleUploaded(path) {
		resetBill();
		setIsProcessing(true);

		const { data, error } = await supabase.functions.invoke('process-bill', {
			body: { path },
		});

		if (error) {
			// The function's { error } message is on the response body
			const details = await error.context?.json?.().catch(() => null);
			if (error.context?.status === 409) {
				setDuplicate({
					message: details?.error ?? 'This bill was already uploaded.',
					billId: details?.duplicate_bill_id ?? null,
				});
			} else {
				setProcessError(
					details?.error ?? "We couldn't process this bill. Please try again.",
				);
			}
		} else {
			// invoke puts the response body in `data`: { data: bill, vendor_id }
			const saved = data.data;

			// No account matched, but the property may already exist. If so,
			// pre-select it so nobody tries to add it again.
			const known =
				saved.status === 'needs_review' && !saved.vendor_account_id
					? await findExistingProperty(saved.extracted_data)
					: null;

			setKnownProperty(known);
			setBill(
				known && !saved.property_id ? { ...saved, property_id: known.id } : saved,
			);
			setVendorId(data.vendor_id ?? null);
		}
		setIsProcessing(false);
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
			const { data: created } = await callFunction('create-property', property);
			// Pre-selects it in the vendor account form
			setKnownProperty({ id: created.id, name: created.name });
			setNotice('Property added. Now add the vendor account.');
		});
	}

	function handleSaveVendor(values) {
		return saveFromForm(async () => {
			if (vendorId) {
				await callFunction('create-vendor-account', {
					...values,
					vendor_id: vendorId,
				});
			} else {
				await callFunction('create-vendor', values);
			}

			// Match on the number the person saved, in case they corrected the AI's
			// reading. This only pre-selects the dropdowns; Save sends it.
			const match = await findMatch({
				...extracted,
				account_number: values.account_number,
			});
			if (match?.vendor_account_id) {
				setBill((current) => ({
					...current,
					vendor_account_id: match.vendor_account_id,
					property_id: match.property_id,
				}));
			}
			setFormVersion((version) => version + 1);
			setNotice('Vendor account added. Save the bill to send it for approval.');
		});
	}

	// Add Account mode needs the vendor's saved details, so load them first
	async function openVendorForm() {
		setFormError('');
		setNotice('');
		try {
			if (vendorId) {
				const { vendor } = await callFunction('read-vendor-details', {
					vendorId,
				});
				setExistingVendor(vendor);
			}
			setOpenForm('vendor');
		} catch (err) {
			setFormError(err.message);
		}
	}

	// After a fix is saved, update-bill moves the bill to pending
	function handleBillSaved(saved) {
		setBill(saved);
		setNotice('');
	}

	// Pre-fills Add Property from what the AI read. The name is a suggestion:
	// who's billed, else the street. Active, since the property is getting bills.
	// The form's inputs need strings, so anything unread becomes ''.
	const address = extracted?.service_address;
	const propertyFromBill = {
		name: extracted?.customer_name || address?.street || '',
		status: 'active',
		street: address?.street ?? '',
		city: address?.city ?? '',
		state: address?.state ?? '',
		zip: address?.zip ?? '',
	};

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
						We'll read the bill, match it to a vendor account and send it for
						approval. If anything is missing, you can fix it here.
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
						onRemoved={resetBill}
						disabled={isProcessing}
					/>
				</section>

				<section className="card">
					<h2 className="text-lg font-bold">Bill details</h2>

					{!bill && !isProcessing && !processError && !duplicate && (
						<p className="mt-1 text-sm text-gray-600">
							Upload a file to get started.
						</p>
					)}

					{isProcessing && (
						<p role="status" className="mt-4 text-sm text-gray-600">
							Reading and saving bill...
						</p>
					)}

					{processError && (
						<p role="alert" className="mt-4 text-sm text-red-700">
							{processError}
						</p>
					)}

					{duplicate && (
						<div role="alert" className="mt-4 rounded-lg border border-red-300 p-4">
							<p className="text-sm font-semibold text-red-700">
								{duplicate.message}
							</p>
							<p className="mt-1 text-sm text-gray-600">
								Nothing new was saved.{' '}
								{duplicate.billId && (
									<Link
										to={`/bills/${duplicate.billId}`}
										className="font-semibold underline"
									>
										View the existing bill
									</Link>
								)}
							</p>
						</div>
					)}

					{bill?.status === 'pending' && (
						<div role="status" className="mt-4 rounded-lg border border-green-600 p-4">
							<p className="text-sm font-semibold text-green-800">
								Sent for approval
							</p>
							<p className="mt-1 text-sm text-gray-700">
								{[
									extracted?.vendor_name,
									bill.invoice_number && `Invoice ${bill.invoice_number}`,
									formatMoney(bill.amount),
									bill.due_date && `due ${bill.due_date}`,
								]
									.filter(Boolean)
									.join(' · ')}
							</p>
							<Link
								to={`/bills/${bill.id}`}
								className="mt-3 inline-block text-sm font-semibold underline"
							>
								View bill
							</Link>
						</div>
					)}

					{needsFixing && (
						<div role="status" className="mt-4 rounded-lg border border-secondary p-4">
							<p className="text-sm font-semibold">
								{bill.status === 'extraction_failed'
									? "Saved, but we couldn't read it"
									: 'Saved, but it needs a review'}
							</p>
							<p className="mt-1 text-sm text-gray-700">{bill.review_reason}</p>
							<p className="mt-1 text-sm text-gray-600">
								Fix the details below and save to send it for approval.
							</p>
						</div>
					)}

					{notice && (
						<p role="status" className="mt-4 text-sm text-green-700">
							{notice}
						</p>
					)}

					{/* Buttons, not an automatic popup: the AI may have misread the number */}
					{noAccount && (
						<div className="mt-4 rounded-lg border border-secondary p-4">
							<p className="text-sm font-semibold">
								{vendorId
									? `We found ${vendorLabel}, but no matching account${accountLabel}.`
									: `We couldn't find ${vendorLabel}${accountLabel} in your vendors.`}
							</p>
							{knownProperty ? (
								<p className="mt-1 text-sm text-gray-600">
									This looks like{' '}
									<span className="font-semibold">{knownProperty.name}</span>,
									which is already one of your properties, so it's selected for
									you. Add the vendor account to finish.
								</p>
							) : (
								<p className="mt-1 text-sm text-gray-600">
									Add what's missing, or choose from the dropdowns below.
								</p>
							)}
							<div className="mt-3 flex flex-wrap gap-2">
								{/* Hidden when the property exists: adding it again would fail */}
								{!knownProperty && (
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
								)}
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

					{/* Edits the saved bill through update-bill. review_reason is cleared
					    so fixing the bill sends it on; it's shown above instead. Typing a
					    comment keeps it in needs_review. A new key rebuilds the form. */}
					{needsFixing && (
						<BillDetailsForm
							key={`${bill.id}-${formVersion}`}
							bill={{ ...bill, review_reason: null }}
							onSaved={handleBillSaved}
						/>
					)}
				</section>
			</div>

			{openForm === 'property' && (
				<PropertyForm
					initialValues={propertyFromBill}
					isSubmitting={isSaving}
					error={formError}
					onCancel={closeForm}
					onSubmit={handleSaveProperty}
				/>
			)}

			{openForm === 'vendor' && (
				<VendorForm
					addAccountMode={Boolean(vendorId)}
					vendorData={existingVendor}
					initialValues={{
						name: extracted?.vendor_name,
						account_number: extracted?.account_number,
						property_id: knownProperty?.id,
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
