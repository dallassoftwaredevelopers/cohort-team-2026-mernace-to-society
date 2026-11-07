import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';

// property and vendorAccount hold ids; the dropdowns show names
const initialFormData = {
	property: '',
	vendorAccount: '',
	invoiceNumber: '',
	amount: '',
	invoiceDate: '',
	dueDate: '',
	approver: '',
};

const inputClassName =
	'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

// Turns a bill row from the database into the form's field names
function billToFormData(bill) {
	return {
		...initialFormData,
		property: bill.property_id ?? '',
		vendorAccount: bill.vendor_account_id ?? '',
		invoiceNumber: bill.invoice_number ?? '',
		amount: bill.amount == null ? '' : String(bill.amount),
		invoiceDate: bill.issue_date ?? '',
		dueDate: bill.due_date ?? '',
	};
}

// Pass `bill` to edit an existing pending bill; leave it out to create a new one.
// onSaved runs after a successful edit; onCancel shows a Cancel button.
function BillDetailsForm({ bill, initialValues, onSaved, onCancel }) {
	const isEditing = Boolean(bill);
	const [formData, setFormData] = useState(() => {
		const startingValues = bill ?? initialValues;
		return startingValues ? billToFormData(startingValues) : initialFormData;
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [properties, setProperties] = useState([]);
	const [vendorAccounts, setVendorAccounts] = useState([]);

	// Plain reads go straight to the tables; only the insert needs the edge function
	useEffect(() => {
		async function loadProperties() {
			const { data, error } = await supabase
				.from('property')
				.select('id, name')
				.order('name');

			if (error) {
				console.error('Loading properties failed:', error);
				setErrorMessage('Could not load properties.');
				return;
			}
			setProperties(data);
		}

		loadProperties();
	}, []);

	// Reload the vendor accounts whenever a different property is picked
	useEffect(() => {
		if (!formData.property) return;

		let ignore = false;

		async function loadVendorAccounts() {
			const { data, error } = await supabase
				.from('vendor_account')
				.select('id, account_number, service, vendor(name)')
				.eq('property_id', formData.property);

			if (ignore) return;
			if (error) {
				console.error('Loading vendor accounts failed:', error);
				setErrorMessage('Could not load vendor accounts.');
				return;
			}
			setVendorAccounts(data);
		}

		loadVendorAccounts();
		return () => {
			ignore = true;
		};
	}, [formData.property]);

	function handleChange(event) {
		const { name, value } = event.target;
		setFormData((currentForm) => ({
			...currentForm,
			[name]: value,
			// A vendor account belongs to one property, so clear it when the property changes
			...(name === 'property' && { vendorAccount: '' }),
		}));
		if (name === 'property') setVendorAccounts([]);
		setErrorMessage('');
		setSuccessMessage('');
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setIsSubmitting(true);
		setErrorMessage('');
		setSuccessMessage('');

		try {
			// Only send fields the bill table has columns for. Approver stays in
			// the UI until the table supports it. The edge function looks up property_id from the vendor account.
			const billFields = {
				invoice_number: formData.invoiceNumber,
				amount: Number(formData.amount),
				issue_date: formData.invoiceDate,
				due_date: formData.dueDate,
				vendor_account_id: formData.vendorAccount,
			};

			const { data, error } = isEditing
				? await supabase.functions.invoke('update-bill', {
						method: 'PATCH',
						body: { id: bill.id, ...billFields },
					})
				: await supabase.functions.invoke('create-bill', {
						body: billFields,
					});

			if (error) {
				// The function's { error } message lives on the response body
				const details = await error.context?.json?.().catch(() => null);
				throw new Error(
					details?.error ??
						'The bill could not be submitted. Please try again.',
				);
			}

			if (isEditing) {
				onSaved?.(data?.data);
				return;
			}

			setSuccessMessage('Bill submitted successfully.');
			setFormData(initialFormData);
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: 'The bill could not be submitted. Please try again.',
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form className="mt-6 space-y-4" onSubmit={handleSubmit}>
			<div>
				<label
					htmlFor="property"
					className="mb-1 block text-sm font-medium text-gray-700"
				>
					Property
				</label>
				<select
					id="property"
					name="property"
					value={formData.property}
					onChange={handleChange}
					className={inputClassName}
					required
				>
					<option value="" disabled>
						Select property
					</option>
					{properties.map((property) => (
						<option key={property.id} value={property.id}>
							{property.name}
						</option>
					))}
				</select>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label
						htmlFor="vendorAccount"
						className="mb-1 block text-sm font-medium text-gray-700"
					>
						Vendor Account
					</label>
					<select
						id="vendorAccount"
						name="vendorAccount"
						value={formData.vendorAccount}
						onChange={handleChange}
						className={inputClassName}
						disabled={!formData.property}
						required
					>
						<option value="" disabled>
							{formData.property
								? 'Select vendor account'
								: 'Select a property first'}
						</option>
						{vendorAccounts.map((account) => (
							<option key={account.id} value={account.id}>
								{account.vendor?.name} · acct {account.account_number} ·{' '}
								{account.service}
							</option>
						))}
					</select>
				</div>

				<div>
					<label
						htmlFor="invoiceNumber"
						className="mb-1 block text-sm font-medium text-gray-700"
					>
						Invoice Number
					</label>
					<input
						id="invoiceNumber"
						name="invoiceNumber"
						type="text"
						placeholder="Enter invoice number"
						value={formData.invoiceNumber}
						onChange={handleChange}
						className={inputClassName}
						required
					/>
				</div>

				<div>
					<label
						htmlFor="amount"
						className="mb-1 block text-sm font-medium text-gray-700"
					>
						Amount
					</label>
					<input
						id="amount"
						name="amount"
						type="number"
						min="0.01"
						step="0.01"
						placeholder="0.00"
						value={formData.amount}
						onChange={handleChange}
						className={inputClassName}
						required
					/>
				</div>

				<div>
					<label
						htmlFor="invoiceDate"
						className="mb-1 block text-sm font-medium text-gray-700"
					>
						Invoice Date
					</label>
					<input
						id="invoiceDate"
						name="invoiceDate"
						type="date"
						value={formData.invoiceDate}
						onChange={handleChange}
						className={inputClassName}
						required
					/>
				</div>

				<div>
					<label
						htmlFor="dueDate"
						className="mb-1 block text-sm font-medium text-gray-700"
					>
						Due Date
					</label>
					<input
						id="dueDate"
						name="dueDate"
						type="date"
						value={formData.dueDate}
						onChange={handleChange}
						className={inputClassName}
						required
					/>
				</div>
			</div>

			{/* Hidden for now: approved_by is set when someone actually approves the bill,
          not at creation. Bring back as "Assign to" if we add an assigned approver column.
      <div>
        <label
          htmlFor="approver"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Approver
        </label>
        <select
          id="approver"
          name="approver"
          value={formData.approver}
          onChange={handleChange}
          className={inputClassName}
          required
        >
          <option value="" disabled>
            Select approver
          </option>
          <option value="Robert">Robert</option>
          <option value="John">John</option>
        </select>
      </div>
      */}

			{errorMessage && (
				<p role="alert" className="text-sm text-red-700">
					{errorMessage}
				</p>
			)}
			{successMessage && (
				<p role="status" className="text-sm text-green-700">
					{successMessage}
				</p>
			)}

			<div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						disabled={isSubmitting}
						className="btn-secondary px-4 py-2 text-sm"
					>
						Cancel
					</button>
				)}
				<button
					type="submit"
					disabled={isSubmitting}
					className="rounded-md bg-[#2460D5] px-4 py-2 text-sm font-medium text-white hover:bg-[#194DB4] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isSubmitting
						? isEditing
							? 'Saving...'
							: 'Submitting...'
						: isEditing
							? 'Save Changes'
							: 'Review & Submit'}
				</button>
			</div>
		</form>
	);
}

export default BillDetailsForm;
