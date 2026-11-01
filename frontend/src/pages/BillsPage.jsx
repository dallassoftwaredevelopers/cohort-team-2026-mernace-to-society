import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const billColumns = [
	"Invoice number",
	"Property",
	"Vendor",
	"Due date",
	"Amount",
	"Status",
];

function BillsPage() {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();

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
								<tr>
									<td
										colSpan={billColumns.length}
										className="px-4 py-12 text-center text-gray-600"
									>
										<p className="font-medium text-gray-800">No bills yet</p>
										<p className="mt-2">
											Add a bill manually or upload a document to get started.
										</p>
									</td>
								</tr>
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
