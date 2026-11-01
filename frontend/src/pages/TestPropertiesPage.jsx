import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { getPropertyData } from "../hooks/propertyHooks/testPropertyDataHooks"


function PropertiesPageTest() {

    const {
        properties,
        loading,
        error,
        addProperty,
        updateProperty,
        deleteProperty,
      } = getPropertyData()

    const [showAddForm, setShowAddForm] = useState(false)
    const [editingProperty, setEditingProperty] = useState(null)
    const [formLoading, setFormLoading] = useState(false)
    const emptyProperty = { name: "", address: "", type: "Residential", size: "" }
    const [newProperty, setNewProperty] = useState(emptyProperty)
    const propertyTypes = ["Residential", "Commercial", "Multi-Family", "Industrial"]
    const groupedProperties = propertyTypes.map((type) => ({
    type,
    properties: properties.filter((property) => property.type === type),
    }))

    const residentialProperties = properties.filter(
      (property) => property.type === "Residential"
    )
    const commercialProperties = properties.filter(
      (property) => property.type === "Commercial"
    )

    const totalResidentialUnits = residentialProperties.reduce(
      (total, property) => total + Number(property.size || 0),
      0
    )
    const totalCommercialSize = commercialProperties.reduce(
      (total, property) => total + Number(property.size || 0),
      0
    )

    const handleAddProperty = async (e) => {
        e.preventDefault()
        setFormLoading(true)
        const result = await addProperty({
          ...newProperty,
          size: Number(newProperty.size),
        });
        setFormLoading(false)

        if (result.success) {
          setNewProperty(emptyProperty)
          setShowAddForm(false)
        } else {
          alert(result.error)
        }
      }

    const handleUpdateProperty = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        const result = await updateProperty(editingProperty.id, {
          name: editingProperty.name,
          address: editingProperty.address,
          type: editingProperty.type,
          size: Number(editingProperty.size),
        });
        setFormLoading(false)

        if (result.success) {
          setEditingProperty(null)
        } else {
          alert(result.error)
        }
    }
    
    const handleDeleteProperty = async (id) => {
      const confirmed = window.confirm("Are you sure you want to delete this property?")
      if (!confirmed) return

      const result = await deleteProperty(id)
      if (!result.success) {
        alert(result.error)
      }
    }

    if (loading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-lg text-[#192D4A]">Loading properties...</p>
        </div>
      )
    }
    if (error && properties.length === 0) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      );
    }



	return (
		<div className="flex min-h-screen bg-gray-50">
			<Sidebar />

			<main className="min-w-0 flex-1 p-4 sm:p-8">
				<section className="flex flex-wrap items-center justify-between gap-4">
					<h2 className="text-2xl font-bold text-[#192D4A]">Properties</h2>
					<button
						type="button"
                        onClick={() => {
                          setEditingProperty(null)
                          setShowAddForm(true)
                        }}
						className="rounded-lg bg-[#192D4A] px-5 py-3 font-medium text-white"
					>
						+ Add Property
					</button>
				</section>

                {error && (
                  <div className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">
                    {error}
                  </div>
                )}

                {showAddForm && (
                  <form
                    onSubmit={handleAddProperty}
                    className="mt-6 rounded-2xl border border-gray-200 bg-white p-6"
                  >
                    <h3 className="mb-5 text-xl font-semibold text-[#192D4A]">
                      Add New Property
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Property Name"
                        value={newProperty.name}
                        onChange={(e) =>
                          setNewProperty({ ...newProperty, name: e.target.value })
                        }
                        required
                        className="rounded-lg border border-gray-300 p-3"
                      />
                      <input
                        type="text"
                        placeholder="Address"
                        value={newProperty.address}
                        onChange={(e) =>
                          setNewProperty({ ...newProperty, address: e.target.value })
                        }
                        required
                        className="rounded-lg border border-gray-300 p-3"
                      />
                      <select
                        value={newProperty.type}
                        onChange={(e) =>
                          setNewProperty({ ...newProperty, type: e.target.value })
                        }
                        className="rounded-lg border border-gray-300 p-3"
                      >
                        {propertyTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        placeholder="Units / Size"
                        value={newProperty.size}
                        onChange={(e) =>
                          setNewProperty({ ...newProperty, size: e.target.value })
                        }
                        required
                        className="rounded-lg border border-gray-300 p-3"
                      />
                    </div>
                    <div className="mt-5 flex gap-3">
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="rounded-lg bg-[#192D4A] px-5 py-3 text-white disabled:opacity-50"
                      >
                        {formLoading ? "Saving..." : "Save Property"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewProperty(emptyProperty);
                        }}
                        className="rounded-lg border border-gray-300 px-5 py-3"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {editingProperty && (
                  <form
                    onSubmit={handleUpdateProperty}
                    className="mt-6 rounded-2xl border border-gray-200 bg-white p-6"
                  >
                    <h3 className="mb-5 text-xl font-semibold text-[#192D4A]">
                      Edit Property
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Property Name"
                        value={editingProperty.name || ""}
                        onChange={(e) =>
                          setEditingProperty({ ...editingProperty, name: e.target.value })
                        }
                        required
                        className="rounded-lg border border-gray-300 p-3"
                      />
                      <input
                        type="text"
                        placeholder="Address"
                        value={editingProperty.address || ""}
                        onChange={(e) =>
                          setEditingProperty({
                            ...editingProperty,
                            address: e.target.value,
                          })
                        }
                        required
                        className="rounded-lg border border-gray-300 p-3"
                      />
                      <select
                        value={editingProperty.type || "Residential"}
                        onChange={(e) =>
                          setEditingProperty({ ...editingProperty, type: e.target.value })
                        }
                        className="rounded-lg border border-gray-300 p-3"
                      >
                        {propertyTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        placeholder="Units / Size"
                        value={editingProperty.size ?? ""}
                        onChange={(e) =>
                          setEditingProperty({ ...editingProperty, size: e.target.value })
                        }
                        required
                        className="rounded-lg border border-gray-300 p-3"
                      />
                    </div>
                    <div className="mt-5 flex gap-3">
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="rounded-lg bg-[#192D4A] px-5 py-3 text-white disabled:opacity-50"
                      >
                        {formLoading ? "Updating..." : "Update Property"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProperty(null)}
                        className="rounded-lg border border-gray-300 px-5 py-3"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

				<section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<div className="rounded-2xl border border-gray-200 bg-white p-6">
						<h3 className=" text-gray-600">Total Properties</h3>
						<p className="py-3 text-3xl text-[#192D4A]">{properties.length}</p>
						<p className=" text-gray-600">Across 4 property types</p>
					</div>
					<div className="rounded-2xl border border-gray-200 bg-white p-6">
						<h3 className="text-gray-600">Residential</h3>
						<p className="py-3 text-3xl text-[#192D4A]">
							{residentialProperties.length}
						</p>
                        {/* fix here! residental sizes needs to change data type, it is either units or size, this variable does not work because this is wrong */}
						<p className=" text-gray-600">{totalResidentialUnits} units total</p>
					</div>
					<div className="rounded-2xl border border-gray-200 bg-white p-6">
						<h3 className=" text-gray-600">Commercial</h3>
						<p className="py-3 text-3xl text-[#192D4A]">
							{commercialProperties.length}
						</p>
						<p className=" text-gray-600">
                            {totalCommercialSize.toLocaleString()} sq ft
                        </p>
					</div>
					<div className="rounded-2xl border border-gray-200 bg-white p-6">
						<h3 className=" text-gray-600">Active Properties</h3>
						<p className="py-3 text-3xl text-[#192D4A]">{properties.length}</p>
						<p className=" text-gray-600">All properties active</p>
					</div>
				</section>

				<section className="mt-8">
					<div className="mb-4 flex flex-wrap items-center justify-between gap-2">
						<h3 className="text-xl font-semibold text-[#192D4A]">Properties by type</h3>
						<p className=" text-gray-500">{properties.length} total properties</p>
					</div>

					<div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
						{groupedProperties.map(({ type, properties: typeProperties }) => (
							<section key={type} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
								<div className="mb-2 flex items-center justify-between gap-2">
									<h4 className="font-semibold text-[#192D4A]">{type}</h4>
									<p className=" text-gray-500">
                                        {typeProperties.length} properties
                                    </p>
								</div>

								<div className="overflow-x-auto rounded-xl border border-gray-200">
									<table className="w-full min-w-[600px] text-left text-sm">
										<thead className="bg-gray-100 text-[#192D4A]">
											<tr>
												<th className="px-4 py-2 font-semibold">Property Name</th>
												<th className="px-4 py-2 font-semibold">Address</th>
												<th className="px-4 py-2 font-semibold">Units / Size</th>
												<th className="px-4 py-2 font-semibold">Status</th>
                                                <th className="px-4 py-3 font-semibold">Actions</th>
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
                                                    <td className="px-4 py-3">
                                                        <div className="flex gap-3">
                                                            <button
                                                              type="button"
                                                              onClick={() => {
                                                                setShowAddForm(false);
                                                                setEditingProperty({
                                                                  ...property,
                                                                  size: String(property.size ?? ""),
                                                                });
                                                              }}
                                                              className="font-medium text-blue-600 hover:underline"
                                                            >
                                                              Edit
                                                            </button>
                                                            <button
                                                              type="button"
                                                              onClick={() => handleDeleteProperty(property.id)}
                                                              className="font-medium text-red-600 hover:underline"
                                                            >
                                                              Delete
                                                            </button>
                                                      </div>
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
		</div>
	);
}

export default PropertiesPageTest;
