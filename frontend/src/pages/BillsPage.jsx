import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';

const billColumns = [
	'Property',
	'Vendor',
	'Issue date',
	'Due date',
	'Amount',
	'Status',
];

const cellMessageClassName = 'px-4 py-12 text-center text-gray-600';

function BillsPage() {
	const [open, setOpen] = useState(false);
	const [bills, setBills] = useState([]);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const navigate = useNavigate();

	useEffect(() => {
		async function loadBills() {
			// The client sends the logged-in user's token, so RLS decides which rows come back
			const { data, error } = await supabase
				.from('bill')
				.select(
					'id, issue_date, due_date, amount, status, extracted_vendor_name, property(name), vendor_account(service, vendor(name))',
				)
				.order('due_date', { ascending: true });

			if (error) {
				setErrorMessage('Could not load bills. Please try again.');
			} else {
				setBills(data);
			}
			setLoading(false);
		}
		loadBills();
	}, []);

	return (
		<div className="flex min-h-screen bg-white text-black">
			<Sidebar />
			<div className="flex min-w-0 flex-1 flex-col">
				<main className="min-w-0 flex-1 p-4 md:p-8">
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
									onClick={() => setOpen(!open)}
									className="btn-primary px-5 py-3 text-sm"
								>
									+ Add Bill ▾
								</button>
								{open && (
									<div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-secondary bg-white py-2 shadow-lg">
										{[
											{ label: 'Enter Manually', path: '/bills/manual' },
											{ label: 'Upload Bill', path: '/bills/upload' },
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
										</tr>
									))
								)}
							</tbody>
						</table>
					</section>
				</main>
				<Footer />
			</div>
		</div>
	);
}

export default BillsPage;
