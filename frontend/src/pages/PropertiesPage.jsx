// Placeholder hardcorded property records.
// Grouping logic used to display records in category tables.

import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

const properties = [
	{ id: 1, type: "Residential", name: "Oakwood Apartments", address: "124 Main St", size: "24 Units", status: "Active" },
	{ id: 2, type: "Residential", name: "Pineview Residences", address: "55 Pineview Dr", size: "16 Units", status: "Active" },
	{ id: 3, type: "Residential", name: "Sunny Apartments", address: "123 Main St", size: "12 Units", status: "Active" },
	{ id: 4, type: "Residential", name: "Cedar Grove Homes", address: "840 Cedar Ln", size: "8 Units", status: "Active" },
	{ id: 5, type: "Commercial", name: "Market Square Plaza", address: "300 Market St", size: "12,000 sq ft", status: "Active" },
	{ id: 6, type: "Commercial", name: "Riverside Offices", address: "18 River Rd", size: "6,400 sq ft", status: "Active" },
	{ id: 7, type: "Commercial", name: "Pioneer Shops", address: "720 Pioneer Ave", size: "4,000 sq ft", status: "Active" },
	{ id: 8, type: "Multi-Family", name: "Harbor View Lofts", address: "22 Harbor Way", size: "32 Units", status: "Active" },
	{ id: 9, type: "Multi-Family", name: "Riverwalk Commons", address: "99 Riverwalk Blvd", size: "36 Units", status: "Active" },
	{ id: 10, type: "Multi-Family", name: "Maple Court", address: "410 Maple St", size: "24 Units", status: "Active" },
	{ id: 11, type: "Industrial", name: "Warehouse District 2", address: "210 Depot St", size: "38,000 sq ft", status: "Active" },
	{ id: 12, type: "Industrial", name: "Westside Distribution", address: "600 Westside Pkwy", size: "24,000 sq ft", status: "Active" },
];

const groupedProperties = [
	{
		type: "Residential",
		properties: properties.filter((property) => property.type === "Residential"),
	},
	{
		type: "Commercial",
		properties: properties.filter((property) => property.type === "Commercial"),
	},
	{
		type: "Multi-Family",
		properties: properties.filter((property) => property.type === "Multi-Family"),
	},
	{
		type: "Industrial",
		properties: properties.filter((property) => property.type === "Industrial"),
	},
];

function PropertiesPage() {
	return (
		<div className="flex min-h-screen bg-gray-50">
			<Sidebar />
			<div className="flex min-w-0 flex-1 flex-col">

			<main className="min-w-0 flex-1 p-4 sm:p-8">
				<section className="flex flex-wrap items-center justify-between gap-4">
					<h2 className="text-2xl font-bold text-[#192D4A]">Properties</h2>
					<button
						type="button"
						className="rounded-lg bg-[#192D4A] px-5 py-3 font-medium text-white"
					>
						+ Add Property
					</button>
				</section>

				<section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<div className="rounded-2xl border border-gray-200 bg-white p-6">
						<h3 className=" text-gray-600">Total Properties</h3>
						<p className="py-3 text-3xl text-[#192D4A]">12</p>
						<p className=" text-gray-600">Across 4 property types</p>
					</div>
					<div className="rounded-2xl border border-gray-200 bg-white p-6">
						<h3 className="text-gray-600">Residential</h3>
						<p className="py-3 text-3xl text-[#192D4A]">
							4
						</p>
						<p className=" text-gray-600">60 units total</p>
					</div>
					<div className="rounded-2xl border border-gray-200 bg-white p-6">
						<h3 className=" text-gray-600">Commercial</h3>
						<p className="py-3 text-3xl text-[#192D4A]">
							3
						</p>
						<p className=" text-gray-600">22,400 sq ft</p>
					</div>
					<div className="rounded-2xl border border-gray-200 bg-white p-6">
						<h3 className=" text-gray-600">Active Properties</h3>
						<p className="py-3 text-3xl text-[#192D4A]">12</p>
						<p className=" text-gray-600">All properties active</p>
					</div>
				</section>

				<section className="mt-8">
					<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
						<h3 className="text-xl font-semibold text-[#192D4A]">Properties by type</h3>
						<p className=" text-gray-500">12 total properties</p>
					</div>

					<div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
						{groupedProperties.map(({ type, properties: typeProperties }) => (
							<section key={type} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
								<div className="mb-2 flex items-center justify-between gap-2">
									<h4 className="font-semibold text-[#192D4A]">{type}</h4>
									<p className=" text-gray-500">{typeProperties.length} properties</p>
								</div>

								<div className="overflow-x-auto rounded-xl border border-gray-200">
									<table className="w-full min-w-[600px] text-left text-sm">
										<thead className="bg-gray-100 text-[#192D4A]">
											<tr>
												<th className="px-4 py-2 font-semibold">Property Name</th>
												<th className="px-4 py-2 font-semibold">Address</th>
												<th className="px-4 py-2 font-semibold">Units / Size</th>
												<th className="px-4 py-2 font-semibold">Status</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-gray-100 text-gray-600">
											{typeProperties.map((property) => (
												<tr key={property.id}>
													<td className="whitespace-nowrap px-4 py-2 text-[#192D4A]">{property.name}</td>
													<td className="whitespace-nowrap px-4 py-2">{property.address}</td>
													<td className="whitespace-nowrap px-4 py-2">{property.size}</td>
													<td className="px-4 py-2">
														<span className="inline-block rounded-full bg-green-50 px-3 py-1 text-green-700">
															active
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</section>
						))}
					</div>
				</section>
			</main>
			<Footer />
			</div>
		</div>
	);
}

export default PropertiesPage;
