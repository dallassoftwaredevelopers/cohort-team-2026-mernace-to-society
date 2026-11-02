import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { useProperties } from "../hooks/useProperties";

const initialFormData = {
	name: "",
	street: "",
	city: "",
	state: "",
	zip: "",
	type: "",
	status: "inactive",
};

const inputClassName =
	"w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function PropertiesPage() {
	const {
		properties,
		loading,
		error,
		fetchProperties,
		createProperty,
		updateProperty,
		deleteProperty,
	} = useProperties();

	const [showForm, setShowForm] = useState(false);
	const [editingProperty, setEditingProperty] = useState(null);
	const [formData, setFormData] = useState(initialFormData);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formError, setFormError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");

	// Retrieve properties when the page loads.
	useEffect(() => {
		fetchProperties().catch(() => {});
	}, [fetchProperties]);

	// Group properties dynamically by type.
	const groupedProperties = useMemo(() => {
		const groups = properties.reduce((groups, property) => {
			const type = property.type || "Uncategorized";

			if (!groups[type]) {
				groups[type] = [];
			}

			groups[type].push(property);

			return groups;
		}, {});

		return Object.entries(groups).sort(([a], [b]) =>
			a.localeCompare(b)
		);
	}, [properties]);

	// Dashboard statistics.
	const totalProperties = properties.length;

	const residentialCount = properties.filter(
		(property) => property.type === "Residential"
	).length;

	const commercialCount = properties.filter(
		(property) => property.type === "Commercial"
	).length;

	const activeCount = properties.filter(
		(property) => property.status === "active"
	).length;

	function handleChange(event) {
		const { name, value } = event.target;

		setFormData((current) => ({
			...current,
			[name]: value,
		}));

		setFormError("");
	}

	function openAddForm() {
		setEditingProperty(null);
		setFormData(initialFormData);
		setFormError("");
		setShowForm(true);
	}

	function openEditForm(property) {
		setEditingProperty(property);

		setFormData({
			name: property.name || "",
			street: property.street || "",
			city: property.city || "",
			state: property.state || "",
			zip: property.zip ?? "",
			type: property.type || "",
			status: property.status || "inactive",
		});

		setFormError("");
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
		setEditingProperty(null);
		setFormData(initialFormData);
		setFormError("");
	}

	async function handleSubmit(event) {
		event.preventDefault();

		setIsSubmitting(true);
		setFormError("");
		setSuccessMessage("");

		const propertyData = {
			...formData,
			zip: formData.zip === "" ? null : Number(formData.zip),
		};

		try {
			if (editingProperty) {
				await updateProperty(editingProperty.id, propertyData);
				setSuccessMessage("Property updated successfully.");
			} else {
				await createProperty(propertyData);
				setSuccessMessage("Property created successfully.");
			}

			closeForm();
		} catch (err) {
			setFormError(
				err instanceof Error
					? err.message
					: "Something went wrong. Please try again."
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleStatusChange(property) {
		const newStatus =
			property.status === "active" ? "inactive" : "active";

		setSuccessMessage("");

		try {
			await updateProperty(property.id, {
				status: newStatus,
			});

			setSuccessMessage(
				`Property marked as ${newStatus}.`
			);
		} catch {
			// The hook manages the error message.
		}
	}

	async function handleDelete(property) {
		const confirmed = window.confirm(
			`Are you sure you want to delete ${property.name}?`
		);

		if (!confirmed) return;

		setSuccessMessage("");

		try {
			await deleteProperty(property.id);
			setSuccessMessage("Property deleted successfully.");
		} catch {
			// The hook manages the error message.
		}
	}

	return (
		<div className="flex min-h-screen bg-gray-50">
			<Sidebar />

			<div className="flex min-w-0 flex-1 flex-col">
				<main className="min-w-0 flex-1 p-4 sm:p-8">

					{/* Page Header */}
					<section className="flex flex-wrap items-center justify-between gap-4">
						<h2 className="text-2xl font-bold text-[#192D4A]">
							Properties
						</h2>

						<button
							type="button"
							onClick={openAddForm}
							className="rounded-lg bg-[#192D4A] px-5 py-3 font-medium text-white hover:bg-[#263F60]"
						>
							+ Add Property
						</button>
					</section>

					{/* Dashboard Statistics */}
					<section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

						<div className="rounded-2xl border border-gray-200 bg-white p-6">
							<h3 className="text-gray-600">
								Total Properties
							</h3>
							<p className="py-3 text-3xl text-[#192D4A]">
								{totalProperties}
							</p>
							<p className="text-gray-600">
								Across {groupedProperties.length} property types
							</p>
						</div>

						<div className="rounded-2xl border border-gray-200 bg-white p-6">
							<h3 className="text-gray-600">
								Residential
							</h3>
							<p className="py-3 text-3xl text-[#192D4A]">
								{residentialCount}
							</p>
							<p className="text-gray-600">
								Residential properties
							</p>
						</div>

						<div className="rounded-2xl border border-gray-200 bg-white p-6">
							<h3 className="text-gray-600">
								Commercial
							</h3>
							<p className="py-3 text-3xl text-[#192D4A]">
								{commercialCount}
							</p>
							<p className="text-gray-600">
								Commercial properties
							</p>
						</div>

						<div className="rounded-2xl border border-gray-200 bg-white p-6">
							<h3 className="text-gray-600">
								Active Properties
							</h3>
							<p className="py-3 text-3xl text-[#192D4A]">
								{activeCount}
							</p>
							<p className="text-gray-600">
								{totalProperties - activeCount} inactive properties
							</p>
						</div>

					</section>

					{/* Messages */}
					{error && (
						<div
							role="alert"
							className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700"
						>
							{error}
						</div>
					)}

					{successMessage && (
						<div
							role="status"
							className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-700"
						>
							{successMessage}
						</div>
					)}

					{/* Properties by Type */}
					<section className="mt-8">
						<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
							<h3 className="text-xl font-semibold text-[#192D4A]">
								Properties by type
							</h3>

							<p className="text-gray-500">
								{totalProperties} total properties
							</p>
						</div>

						<div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">

							{loading ? (
								<p className="py-8 text-center text-gray-500">
									Loading properties...
								</p>
							) : properties.length === 0 ? (
								<div className="py-10 text-center">
									<h4 className="font-semibold text-[#192D4A]">
										No properties yet
									</h4>
									<p className="mt-2 text-sm text-gray-500">
										Add your first property to get started.
									</p>
									<button
										type="button"
										onClick={openAddForm}
										className="mt-4 rounded-lg bg-[#192D4A] px-5 py-2 text-sm font-medium text-white"
									>
										Add Property
									</button>
								</div>
							) : (
								groupedProperties.map(([type, typeProperties]) => (
									<section
										key={type}
										className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
									>
										<div className="mb-2 flex items-center justify-between gap-2">
											<h4 className="font-semibold text-[#192D4A]">
												{type}
											</h4>
											<p className="text-gray-500">
												{typeProperties.length} properties
											</p>
										</div>

										<div className="overflow-x-auto rounded-xl border border-gray-200">
											<table className="w-full min-w-[650px] text-left text-sm">
												<thead className="bg-gray-100 text-[#192D4A]">
													<tr>
														<th className="px-4 py-3 font-semibold">
															Property Name
														</th>
														<th className="px-4 py-3 font-semibold">
															Address
														</th>
														<th className="px-4 py-3 font-semibold">
															Status
														</th>
														<th className="px-4 py-3 font-semibold">
															Actions
														</th>
													</tr>
												</thead>

												<tbody className="divide-y divide-gray-100 text-gray-600">
													{typeProperties.map((property) => {
														const address = [
															property.street,
															property.city,
															property.state,
															property.zip,
														]
															.filter(
																(value) =>
																	value !== null &&
																	value !== undefined &&
																	value !== ""
															)
															.join(", ");

														return (
															<tr key={property.id}>
																<td className="whitespace-nowrap px-4 py-3 font-medium text-[#192D4A]">
																	{property.name}
																</td>

																<td className="px-4 py-3">
																	{address || "—"}
																</td>

																<td className="px-4 py-3">
																	<button
																		type="button"
																		onClick={() =>
																			handleStatusChange(property)
																		}
																		className={`rounded-full px-3 py-1 text-xs font-medium ${
																			property.status === "active"
																				? "bg-green-50 text-green-700"
																				: "bg-gray-100 text-gray-600"
																		}`}
																		title="Click to change status"
																	>
																		{property.status === "active"
																			? "Active"
																			: "Inactive"}
																	</button>
																</td>

																<td className="whitespace-nowrap px-4 py-3">
																	<div className="flex gap-3">
																		<button
																			type="button"
																			onClick={() =>
																				openEditForm(property)
																			}
																			className="font-medium text-blue-600 hover:text-blue-800"
																		>
																			Edit
																		</button>

																		<button
																			type="button"
																			onClick={() =>
																				handleDelete(property)
																			}
																			className="font-medium text-red-600 hover:text-red-800"
																		>
																			Delete
																		</button>
																	</div>
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										</div>
									</section>
								))
							)}

						</div>
					</section>
				</main>

				<Footer />
			</div>

			{/* Add / Edit Property Modal */}
			{showForm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
					<div className="my-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">

						<div className="mb-6 flex items-center justify-between">
							<h3 className="text-xl font-bold text-[#192D4A]">
								{editingProperty ? "Edit Property" : "Add Property"}
							</h3>

							<button
								type="button"
								onClick={closeForm}
								className="text-2xl text-gray-400 hover:text-gray-700"
								aria-label="Close form"
							>
								&times;
							</button>
						</div>

						<form onSubmit={handleSubmit} className="space-y-4">

							<div>
								<label
									htmlFor="name"
									className="mb-1 block text-sm font-medium text-gray-700"
								>
									Property Name
								</label>
								<input
									id="name"
									name="name"
									type="text"
									value={formData.name}
									onChange={handleChange}
									className={inputClassName}
									placeholder="Oakwood Apartments"
									maxLength={150}
									required
								/>
							</div>

							<div>
								<label
									htmlFor="type"
									className="mb-1 block text-sm font-medium text-gray-700"
								>
									Property Type
								</label>
								<select
									id="type"
									name="type"
									value={formData.type}
									onChange={handleChange}
									className={inputClassName}
									required
								>
									<option value="" disabled>
										Select property type
									</option>
									<option value="Residential">Residential</option>
									<option value="Commercial">Commercial</option>
									<option value="Multi-Family">Multi-Family</option>
									<option value="Industrial">Industrial</option>
								</select>
							</div>

							<div>
								<label
									htmlFor="street"
									className="mb-1 block text-sm font-medium text-gray-700"
								>
									Street Address
								</label>
								<input
									id="street"
									name="street"
									type="text"
									value={formData.street}
									onChange={handleChange}
									className={inputClassName}
									placeholder="124 Main St"
								/>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div>
									<label
										htmlFor="city"
										className="mb-1 block text-sm font-medium text-gray-700"
									>
										City
									</label>
									<input
										id="city"
										name="city"
										type="text"
										value={formData.city}
										onChange={handleChange}
										className={inputClassName}
										placeholder="Miami"
									/>
								</div>

								<div>
									<label
										htmlFor="state"
										className="mb-1 block text-sm font-medium text-gray-700"
									>
										State
									</label>
									<input
										id="state"
										name="state"
										type="text"
										value={formData.state}
										onChange={handleChange}
										className={inputClassName}
										placeholder="FL"
									/>
								</div>

								<div>
									<label
										htmlFor="zip"
										className="mb-1 block text-sm font-medium text-gray-700"
									>
										ZIP Code
									</label>
									<input
										id="zip"
										name="zip"
										type="number"
										value={formData.zip}
										onChange={handleChange}
										className={inputClassName}
										placeholder="33101"
										min="0"
										max="99999"
									/>
								</div>

								<div>
									<label
										htmlFor="status"
										className="mb-1 block text-sm font-medium text-gray-700"
									>
										Status
									</label>
									<select
										id="status"
										name="status"
										value={formData.status}
										onChange={handleChange}
										className={inputClassName}
									>
										<option value="active">Active</option>
										<option value="inactive">Inactive</option>
									</select>
								</div>
							</div>

							{formError && (
								<p role="alert" className="text-sm text-red-700">
									{formError}
								</p>
							)}

							<div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
								<button
									type="button"
									onClick={closeForm}
									disabled={isSubmitting}
									className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
								>
									Cancel
								</button>

								<button
									type="submit"
									disabled={isSubmitting}
									className="rounded-lg bg-[#192D4A] px-5 py-2 text-sm font-medium text-white hover:bg-[#263F60] disabled:cursor-not-allowed disabled:opacity-60"
								>
									{isSubmitting
										? "Saving..."
										: editingProperty
											? "Save Changes"
											: "Create Property"}
								</button>
							</div>

						</form>
					</div>
				</div>
			)}
		</div>
	);
}

export default PropertiesPage;
