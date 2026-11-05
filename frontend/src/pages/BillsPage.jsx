import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import BillDetailsForm from '../components/BillDetailsForm';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';

const billColumns = [
	'Invoice number',
	'Property',
	'Vendor',
	'Issue date',
	'Due date',
	'Amount',
	'Status',
	'Actions',
];

const cellMessageClassName = "px-4 py-12 text-center text-gray-600";

// Below md each row becomes a card with a label beside every value
const stackedRowClassName =
  "mb-4 block rounded-lg bg-white p-4 md:mb-0 md:table-row md:rounded-none md:border-t md:border-gray-200 md:bg-transparent md:p-0";
const stackedCellClassName =
  "flex justify-between gap-4 py-1 md:table-cell md:px-4 md:py-3";

function BillsPage() {

	const [open, setOpen] = useState(false);
	const [bills, setBills] = useState([]);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	// The bill whose Edit button was clicked; null keeps the modal closed
	const [editingBill, setEditingBill] = useState(null);

	// Bumping this re-runs the fetch below (e.g. after a bill is edited)
	const [reloadCount, setReloadCount] = useState(0);
	const navigate = useNavigate();

	useEffect(() => {
		async function loadBills() {
			// The client sends the logged-in user's token, so RLS decides which rows come back.
			// property_id and vendor_account_id are needed to pre-fill the edit form.
			const { data, error } = await supabase
				.from('bill')
				.select(
					'id, invoice_number, issue_date, due_date, amount, status, extracted_vendor_name, property_id, vendor_account_id, property(name), vendor_account(service, vendor(name))',
				)
				.order('due_date', { ascending: true });

			if (error) {
				setErrorMessage('Could not load bills. Please try again.');
			} else {
				setErrorMessage('');
				setBills(data);
			}
			setLoading(false);
		}
		loadBills();
	}, [reloadCount]);

	function handleBillSaved() {
		setEditingBill(null);
		// Re-fetch so the joined property/vendor names reflect the edit
		setReloadCount((count) => count + 1);
	}

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Bills</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage bills for your properties.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="btn-primary px-5 py-3 text-sm"
            >
              + Add Bill ▾
            </button>
            {open && (
              <div className="absolute left-0 z-10 mt-2 w-48 sm:left-auto sm:right-0 rounded-lg border border-secondary bg-white py-2 shadow-lg">
                {[
                  { label: "Enter Manually", path: "/bills/manual" },
                  { label: "Upload Bill", path: "/bills/upload" },
                ].map(({ label, path }) => (
                  <button
                    key={label}
                    onClick={() => {
                      setOpen(false);
                      navigate(path);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm font-semibold hover:bg-section"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

					<section className="card mt-8 overflow-x-auto">
						<h2 className="border-b border-black pb-4 text-lg font-bold">
							All Bills
						</h2>
						<table className="mt-4 w-full min-w-[640px] text-left text-sm">
							<thead>
								<tr className="text-xs uppercase">
									{billColumns.map((column) => (
										<th key={column} className="px-4 py-3 font-semibold">
											{column}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{loading ? (
									<tr>
										<td
											colSpan={billColumns.length}
											className={cellMessageClassName}
										>
											Loading bills…
										</td>
									</tr>
								) : errorMessage ? (
									<tr>
										<td
											colSpan={billColumns.length}
											className={`${cellMessageClassName} text-red-700`}
										>
											{errorMessage}
										</td>
									</tr>
								) : bills.length === 0 ? (
									<tr>
										<td
											colSpan={billColumns.length}
											className={cellMessageClassName}
										>
											<p className="font-medium text-gray-800">No bills yet</p>
											<p className="mt-2">
												Add a bill manually or upload a document to get started.
											</p>
										</td>
									</tr>
								) : (
									bills.map((bill) => (
										<tr key={bill.id} className="border-t border-gray-200">
											<td className="px-4 py-3">{bill.invoice_number ?? '—'}</td>
											<td className="px-4 py-3">{bill.property?.name ?? '—'}</td>
											<td className="px-4 py-3">
												{/* Uploaded bills may only have the AI-extracted vendor name */}
												{bill.vendor_account?.vendor?.name ??
													bill.extracted_vendor_name ??
													'—'}
												{bill.vendor_account?.service && (
													<span className="text-gray-600">
														{' '}
														· {bill.vendor_account.service}
													</span>
												)}
											</td>
											<td className="px-4 py-3">{bill.issue_date ?? '—'}</td>
											<td className="px-4 py-3">{bill.due_date ?? '—'}</td>
											<td className="px-4 py-3">
												{bill.amount == null
													? '—'
													: Number(bill.amount).toLocaleString('en-US', {
															style: 'currency',
															currency: 'USD',
														})}
											</td>
											<td className="px-4 py-3 capitalize">{bill.status}</td>
											<td className="px-4 py-3">
												{/* Only pending bills can be edited; approved/rejected bills are locked */}
												{bill.status === 'pending' && (
													<button
														type="button"
														onClick={() => setEditingBill(bill)}
														className="font-medium text-[#2460D5] hover:text-[#194DB4]"
													>
														Edit
													</button>
												)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</section>
				</main>
				<Footer />
			</div>

			{editingBill && (
				<div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
					<div className="my-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-bold">Edit Bill</h2>
							<button
								type="button"
								onClick={() => setEditingBill(null)}
								className="text-2xl text-gray-500 hover:text-black"
								aria-label="Close form"
							>
								&times;
							</button>
						</div>
						{/* key resets the form if a different bill is opened */}
						<BillDetailsForm
							key={editingBill.id}
							bill={editingBill}
							onSaved={handleBillSaved}
							onCancel={() => setEditingBill(null)}
						/>
					</div>
				</div>
			)}
		</div>
	);

}

export default BillsPage;
