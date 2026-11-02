import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { useProperties } from "../hooks/useProperties";
//comment so I can git add and push
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
		<div className="flex min-h-screen bg-white text-black">
			<Sidebar />

			<div className="flex min-w-0 flex-1 flex-col">
				<main className="min-w-0 flex-1 p-4 md:p-8">

					{/* Page Header */}
					<section className="flex flex-wrap items-center justify-between gap-4">
						<h1 className="font-serif text-2xl font-bold">
							Properties
						</h1>

						<button
							type="button"
							onClick={openAddForm}
							className="btn-primary px-5 py-3 text-sm"
						>
							+ Add Property
						</button>
					</section>

					{/* Dashboard Statistics */}
					<section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">

						<div className="card">
							<h3 className="text-sm font-semibold">
								Total Properties
							</h3>
							<p className="mt-3 text-3xl font-bold">
								{totalProperties}
							</p>
							<p className="mt-1 text-xs">
								Across {groupedProperties.length} property types
							</p>
						</div>

						<div className="card">
							<h3 className="text-sm font-semibold">
								Residential
							</h3>
							<p className="mt-3 text-3xl font-bold">
								{residentialCount}
							</p>
							<p className="mt-1 text-xs">
								Residential properties
							</p>
						</div>

						<div className="card">
							<h3 className="text-sm font-semibold">
								Commercial
							</h3>
							<p className="mt-3 text-3xl font-bold">
								{commercialCount}
							</p>
							<p className="mt-1 text-xs">
								Commercial properties
							</p>
						</div>

						<div className="card">
							<h3 className="text-sm font-semibold">
								Active Properties
							</h3>
							<p className="mt-3 text-3xl font-bold">
								{activeCount}
							</p>
							<p className="mt-1 text-xs">
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
					<section className="card mt-8">
						<div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-black pb-4">
							<h2 className="text-lg font-bold">
								Properties by Type
							</h2>

							<p className="text-sm">
								{totalProperties} total properties
							</p>
						</div>

						<div className="space-y-4">

							{loading ? (
								<p className="py-8 text-center text-sm">
									Loading properties...
								</p>
							) : properties.length === 0 ? (
								<div className="py-10 text-center">
									<h3 className="font-semibold">
										No properties yet
									</h3>
									<p className="mt-2 text-sm">
										Add your first property to get started.
									</p>
									<button
										type="button"
										onClick={openAddForm}
										className="btn-primary mt-4 px-5 py-2 text-sm"
									>
										Add Property
									</button>
								</div>
							) : (
								groupedProperties.map(([type, typeProperties]) => (
									<section
										key={type}
										className="border-b border-section pb-4 last:border-b-0 last:pb-0"
									>
										<div className="mb-2 flex items-center justify-between gap-2">
											<h3 className="font-semibold">
												{type}
											</h3>
											<p className="text-xs">
												{typeProperties.length} properties
											</p>
										</div>

										<div className="overflow-x-auto rounded-lg bg-white">
											<table className="w-full min-w-[650px] text-left text-sm">
												<thead className="text-xs uppercase">
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

												<tbody>
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
															<tr
																key={property.id}
																className="border-t border-section"
															>
																<td className="whitespace-nowrap px-4 py-3 font-medium">
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
																		className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-black"
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
																			className="font-medium text-primary hover:text-primary-hover"
																		>
																			Edit
																		</button>

																		<button
																			type="button"
																			onClick={() =>
																				handleDelete(property)
																			}
																			className="font-medium text-red-700 hover:text-red-900"
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
					<div className="my-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">

						<div className="mb-6 flex items-center justify-between">
							<h2 className="text-xl font-bold">
								{editingProperty ? "Edit Property" : "Add Property"}
							</h2>

							<button
								type="button"
								onClick={closeForm}
								className="text-2xl text-gray-500 hover:text-black"
								aria-label="Close form"
							>
								&times;
							</button>
						</div>

						<form onSubmit={handleSubmit} className="space-y-4">

							<div>
								<label
									htmlFor="name"
									className="mb-1 block text-sm font-medium"
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
									className="mb-1 block text-sm font-medium"
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
									className="mb-1 block text-sm font-medium"
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
										className="mb-1 block text-sm font-medium"
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
										className="mb-1 block text-sm font-medium"
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
										className="mb-1 block text-sm font-medium"
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
										className="mb-1 block text-sm font-medium"
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

							<div className="flex justify-end gap-3 border-t border-section pt-5">
								<button
									type="button"
									onClick={closeForm}
									disabled={isSubmitting}
									className="btn-secondary px-4 py-2 text-sm"
								>
									Cancel
								</button>

								<button
									type="submit"
									disabled={isSubmitting}
									className="btn-primary px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
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
