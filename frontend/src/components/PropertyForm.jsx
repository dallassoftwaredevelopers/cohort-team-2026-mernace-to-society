import { useState } from "react";

const emptyProperty = {
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

function PropertyForm({
  initialValues = emptyProperty,
  isEditing = false,
  isSubmitting = false,
  error = "",
  onCancel,
  onSubmit,
}) {
  const [formData, setFormData] = useState(() => ({
    ...emptyProperty,
    ...initialValues,
    zip: initialValues.zip ?? "",
  }));

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({
      ...formData,
      zip: formData.zip === "" ? null : Number(formData.zip),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-auto w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEditing ? "Edit Property" : "Add Property"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-2xl leading-none text-gray-500 hover:text-black"
            aria-label="Close form"
            disabled={isSubmitting}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="property-name"
              className="mb-1 block text-sm font-medium"
            >
              Property Name
            </label>
            <input
              id="property-name"
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
              htmlFor="property-type"
              className="mb-1 block text-sm font-medium"
            >
              Property Type
            </label>
            <select
              id="property-type"
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
              htmlFor="property-street"
              className="mb-1 block text-sm font-medium"
            >
              Street Address
            </label>
            <input
              id="property-street"
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
                htmlFor="property-city"
                className="mb-1 block text-sm font-medium"
              >
                City
              </label>
              <input
                id="property-city"
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
                htmlFor="property-state"
                className="mb-1 block text-sm font-medium"
              >
                State
              </label>
              <input
                id="property-state"
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
                htmlFor="property-zip"
                className="mb-1 block text-sm font-medium"
              >
                ZIP Code
              </label>
              <input
                id="property-zip"
                name="zip"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                value={formData.zip}
                onChange={handleChange}
                className={inputClassName}
                placeholder="33101"
              />
            </div>

            <div>
              <label
                htmlFor="property-status"
                className="mb-1 block text-sm font-medium"
              >
                Status
              </label>
              <select
                id="property-status"
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

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-section pt-5 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onCancel}
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
                : isEditing
                  ? "Save Changes"
                  : "Create Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PropertyForm;
