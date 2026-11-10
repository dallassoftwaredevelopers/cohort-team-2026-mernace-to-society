import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropertyForm from "../components/PropertyForm";
import { useProperties } from "../hooks/useProperties";

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

  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
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

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [properties]);

  // Dashboard statistics.
  const totalProperties = properties.length;

  const residentialCount = properties.filter(
    (property) => property.type === "Residential",
  ).length;

  const commercialCount = properties.filter(
    (property) => property.type === "Commercial",
  ).length;

  const activeCount = properties.filter(
    (property) => property.status === "active",
  ).length;

  function openAddForm() {
    setEditingProperty(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(property) {
    setEditingProperty(property);
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingProperty(null);
    setFormError("");
  }

  async function handleSubmit(propertyData) {
    setIsSubmitting(true);
    setFormError("");
    setSuccessMessage("");

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
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusChange(property) {
    const newStatus = property.status === "active" ? "inactive" : "active";

    setSuccessMessage("");

    try {
      await updateProperty(property.id, {
        status: newStatus,
      });

      setSuccessMessage(`Property marked as ${newStatus}.`);
    } catch {
      // The hook manages the error message.
    }
  }

  async function handleDelete(property) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${property.name}?`,
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
    <>
      {/* Page Header */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-bold">Properties</h1>

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
          <h3 className="text-sm font-semibold">Total Properties</h3>
          <p className="mt-3 text-3xl font-bold">{totalProperties}</p>
          <p className="mt-1 text-xs">
            Across {groupedProperties.length} property types
          </p>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold">Residential</h3>
          <p className="mt-3 text-3xl font-bold">{residentialCount}</p>
          <p className="mt-1 text-xs">Residential properties</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold">Commercial</h3>
          <p className="mt-3 text-3xl font-bold">{commercialCount}</p>
          <p className="mt-1 text-xs">Commercial properties</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold">Active Properties</h3>
          <p className="mt-3 text-3xl font-bold">{activeCount}</p>
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
          <h2 className="text-lg font-bold">Properties by Type</h2>

          <p className="text-sm">{totalProperties} total properties</p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <p className="py-8 text-center text-sm">Loading properties...</p>
          ) : properties.length === 0 ? (
            <div className="py-10 text-center">
              <h3 className="font-semibold">No properties yet</h3>
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
                  <h3 className="font-semibold">{type}</h3>
                  <p className="text-xs">{typeProperties.length} properties</p>
                </div>

                <table className="w-full text-left text-sm md:rounded-lg md:bg-white">
                  <thead className="hidden text-xs uppercase md:table-header-group">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Property Name</th>
                      <th className="px-4 py-3 font-semibold">Address</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  {/* Rows have actions, so below md each row stacks into a card */}
                  <tbody className="block md:table-row-group">
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
                            value !== "",
                        )
                        .join(", ");

                      return (
                        <tr
                          key={property.id}
                          className="mb-3 block rounded-lg bg-white p-4 md:mb-0 md:table-row md:rounded-none md:border-t md:border-section md:p-0"
                        >
                          <td className="block py-1 font-semibold md:table-cell md:px-4 md:py-3 md:font-medium">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/properties/${property.id}`)
                              }
                              className="text-left text-primary hover:text-primary-hover hover:underline"
                            >
                              {property.name}
                            </button>
                          </td>

                          <td className="block py-1 text-gray-700 md:table-cell md:px-4 md:py-3 md:text-black">
                            {address || "—"}
                          </td>

                          <td className="block py-2 md:table-cell md:px-4 md:py-3">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(property)}
                              className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors md:py-1 ${
                                property.status === "active"
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-red-100 text-red-800 hover:bg-red-200"
                              }`}
                              title="Click to change status"
                            >
                              {property.status === "active"
                                ? "Active"
                                : "Inactive"}
                            </button>
                          </td>

                          <td className="block pt-2 md:table-cell md:px-4 md:py-3">
                            <div className="flex gap-2 md:justify-end">
                              <button
                                type="button"
                                onClick={() => openEditForm(property)}
                                className="btn-secondary flex-1 px-4 py-2 text-xs md:flex-none"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(property)}
                                className="flex-1 rounded-lg px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 md:flex-none"
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
              </section>
            ))
          )}
        </div>
      </section>

      {showForm && (
        <PropertyForm
          key={editingProperty?.id ?? "new-property"}
          initialValues={editingProperty ?? undefined}
          isEditing={Boolean(editingProperty)}
          isSubmitting={isSubmitting}
          error={formError}
          onCancel={closeForm}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}

export default PropertiesPage;