import { useState } from "react";

const emptyVendor = {
  name: "",
  aliases: "",
  portal_url: "",
  // email: "",
  // phone_number: "",
  // category: "",
};

const inputClassName =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function VendorForm({
  isSubmitting = false,
  error = "",
  onCancel,
  onSubmit,
  editMode = false,
  vendorData = null,
}) {
  // When editing, prefill form with existing vendor data; otherwise use empty state
  const [formData, setFormData] = useState(() => {
    if (editMode && vendorData) {
      return {
        name: vendorData.name || "",
        aliases: vendorData.aliases || "",
        portal_url: vendorData.portal_url || "",
      };
    }
    return emptyVendor;
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    
const aliases = Array.isArray(formData.aliases)
  ? formData.aliases
  : (formData.aliases || "")
      .split(/[\n,]/)
      .map((alias) => alias.trim())
      .filter(Boolean);

    await onSubmit({
      name: formData.name.trim(),
      aliases,
      portal_url: formData.portal_url.trim() || null,
      // email: formData.email.trim() || null,
      // phone_number: formData.phone_number.trim() || null,
      // category: formData.category,
      status: "active",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-auto w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {editMode ? "Update Vendor" : "Add Vendor"}
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
            <label htmlFor="vendor-name" className="mb-1 block text-sm font-medium">
              Vendor Name
            </label>
            <input
              id="vendor-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={inputClassName}
              placeholder="Florida Power & Light"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label htmlFor="vendor-aliases" className="mb-1 block text-sm font-medium">
              Aliases
            </label>
            <textarea
              id="vendor-aliases"
              name="aliases"
              value={formData.aliases}
              onChange={handleChange}
              className={inputClassName}
              placeholder={"FPL\nFlorida Power"}
              rows={3}
            />
            <p className="mt-1 text-xs text-gray-600">
              Optional. Separate alternate names with commas or new lines.
            </p>
          </div>

          {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"> */}
            <div>
            <div>
              <label htmlFor="vendor-portal-url" className="mb-1 block text-sm font-medium">
                Portal URL
              </label>
              <input
                id="vendor-portal-url"
                name="portal_url"
                type="url"
                value={formData.portal_url}
                onChange={handleChange}
                className={inputClassName}
                placeholder="https://example.com"
                maxLength={2048}
              />
            </div>

            {/* <div>
              <label htmlFor="vendor-category" className="mb-1 block text-sm font-medium">
                Category
              </label>
              <select
                id="vendor-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={inputClassName}
                required
              >
                <option value="" disabled>
                  Select category
                </option>
                <option value="utilities">Utilities</option>
                <option value="maintenance">Maintenance</option>
                <option value="insurance">Insurance</option>
                <option value="internet_telecom">Internet & Telecom</option>
              </select>
            </div>

            <div>
              <label htmlFor="vendor-email" className="mb-1 block text-sm font-medium">
                Email
              </label>
              <input
                id="vendor-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClassName}
                placeholder="billing@example.com"
              />
            </div>

            <div>
              <label htmlFor="vendor-phone" className="mb-1 block text-sm font-medium">
                Phone Number
              </label>
              <input
                id="vendor-phone"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                className={inputClassName}
                placeholder="(555) 555-5555"
              />
            </div> */}
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
              {isSubmitting ? "Saving..." : editMode ? "Update Vendor" : "Create Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default VendorForm;
