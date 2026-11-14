import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import BillDetailsForm from './BillDetailsForm';
import PropertyForm from './PropertyForm';
import VendorForm from './VendorForm';
import { useUserProfile } from '../hooks/useUserProfile';
import { canManageRecords } from '../utils/permissions';

// Everything needed to finish a saved bill that couldn't go straight to
// approval (needs_review or extraction_failed). Used right after an upload and
// on the bill's own page, so a bill can be finished later, by anyone allowed to.
// Everything is rebuilt from the bill's saved extracted_data.

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
// only the vendor is known, or null when nothing matches or the call fails.
async function findMatch(extracted) {
	try {
		const result = await callFunction('match-bill', extracted);
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

// bill: the saved bill row.
// vendorId: the vendor process-bill recognized, when known. Leave it out and
//   the panel looks it up (the bill row doesn't store it).
// onSaved: runs with the updated bill once it's saved.
function FinishBillPanel({ bill: savedBill, vendorId: givenVendorId, onSaved }) {
	const { profile } = useUserProfile();
	const canEditRecords = canManageRecords(profile?.role);

	// The bill plus any dropdown pre-selections we found. Not saved until Save.
	const [bill, setBill] = useState(savedBill);
	const [vendorId, setVendorId] = useState(givenVendorId ?? null);
	// { id, name } of a saved property this bill seems to be for, or null
	const [knownProperty, setKnownProperty] = useState(null);
	const [isLookingUp, setIsLookingUp] = useState(true);

	// Which modal is open: 'property', 'vendor', or null
	const [openForm, setOpenForm] = useState(null);
	const [existingVendor, setExistingVendor] = useState(null);
	const [isSaving, setIsSaving] = useState(false);
	const [formError, setFormError] = useState('');
	const [notice, setNotice] = useState('');
	// Bumped after a pre-selection changes so the bill form rebuilds with it
	const [formVersion, setFormVersion] = useState(0);

	const extracted = bill.extracted_data ?? null;
	const noAccount =
		bill.status === 'needs_review' && !bill.vendor_account_id && extracted;

	// Work out what's already in the system, so the person only adds what's missing
	useEffect(() => {
		let cancelled = false;

		async function lookUp() {
			const data = savedBill.extracted_data;
			if (savedBill.status !== 'needs_review' || savedBill.vendor_account_id || !data) {
				setIsLookingUp(false);
				return;
			}

			// The upload page already knows the vendor; elsewhere, ask again.
			// Asking again also catches an account someone added since the upload.
			const match = givenVendorId === undefined ? await findMatch(data) : null;
			const property = match?.vendor_account_id
				? null
				: await findExistingProperty(data);
			if (cancelled) return;

			if (match?.vendor_account_id) {
				setBill((current) => ({
					...current,
					vendor_account_id: match.vendor_account_id,
					property_id: match.property_id,
				}));
				setNotice('A matching vendor account was added since upload. It\'s selected below.');
			} else {
				if (givenVendorId === undefined) setVendorId(match?.vendor_id ?? null);
				setKnownProperty(property);
				if (property && !savedBill.property_id) {
					setBill((current) => ({ ...current, property_id: property.id }));
				}
			}
			setFormVersion((version) => version + 1);
			setIsLookingUp(false);
		}

		lookUp();
		return () => {
			cancelled = true;
		};
	}, [savedBill, givenVendorId]);

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
			<div role="status" className="mt-4 rounded-lg border border-secondary p-4">
				<p className="text-sm font-semibold">
					{bill.status === 'extraction_failed'
						? "Saved, but we couldn't read it"
						: 'Saved, but it needs a review'}
				</p>
				<p className="mt-1 text-sm text-gray-700">{bill.review_reason}</p>
				<p className="mt-1 text-sm text-gray-600">
					{canEditRecords
						? 'Fix the details below and save to send it for approval.'
						: 'A manager or administrator must review and complete this bill.'}
				</p>
			</div>

			{notice && (
				<p role="status" className="mt-4 text-sm text-green-700">
					{notice}
				</p>
			)}

			{isLookingUp && noAccount && (
				<p role="status" className="mt-4 text-sm text-gray-600">
					Checking your vendors and properties...
				</p>
			)}

			{/* Buttons, not an automatic popup: the AI may have misread the number */}
			{!isLookingUp && noAccount && (
				<div className="mt-4 rounded-lg border border-secondary p-4">
					<p className="text-sm font-semibold">
						{vendorId
							? `We found ${vendorLabel}, but no matching account${accountLabel}.`
							: `We couldn't find ${vendorLabel}${accountLabel} in your vendors.`}
					</p>
					{knownProperty ? (
						<p className="mt-1 text-sm text-gray-600">
							This looks like{' '}
							<span className="font-semibold">{knownProperty.name}</span>, which is
							already one of your properties, so it's selected for you.{' '}
							{canEditRecords
								? 'Add the vendor account to finish.'
								: 'A manager or administrator must add the vendor account to finish.'}
						</p>
					) : (
						<p className="mt-1 text-sm text-gray-600">
							{canEditRecords
								? 'Add the missing items, or choose from the dropdowns below.'
								: 'A manager or administrator must add the missing property or vendor account. Contact them to complete this bill.'}
						</p>
					)}
					{canEditRecords && (
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
					)}
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
			{canEditRecords && !isLookingUp && (
				<BillDetailsForm
					key={`${bill.id}-${formVersion}`}
					bill={{ ...bill, review_reason: null }}
					onSaved={onSaved}
				/>
			)}

			{canEditRecords && openForm === 'property' && (
				<PropertyForm
					initialValues={propertyFromBill}
					isSubmitting={isSaving}
					error={formError}
					onCancel={closeForm}
					onSubmit={handleSaveProperty}
				/>
			)}

			{canEditRecords && openForm === 'vendor' && (
				<VendorForm
					addAccountMode={Boolean(vendorId)}
					vendorData={existingVendor}
					initialValues={{
						name: extracted?.vendor_name,
						account_number: extracted?.account_number,
						portal_url: extracted?.portal_url,
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

export default FinishBillPanel;
