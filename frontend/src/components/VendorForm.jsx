import { useEffect, useState } from "react";
import { useProperties } from "../hooks/useProperties";

const emptyVendor = {
  name: "",
  aliases: "",
  portal_url: "",
  email: "",
  phone_number: "",
  account_number: "",
  service: "",
  property_id: "",
};

const inputClassName =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function VendorForm({
  isSubmitting = false,
  error = "",
  onCancel,
  onSubmit,
  editMode = false,
  addAccountMode = false,
  vendorData = null,
  // Starting values read from a bill: { name, account_number, property_id }. Any can be missing.
  initialValues = null,
}) {
  // A form opened from a bill exists to create the account, so it isn't optional there
  const accountRequired = addAccountMode || Boolean(initialValues);

  const {
    properties,
    loading: propertiesLoading,
    error: propertiesError,
    fetchProperties,
  } = useProperties();

  const [formData, setFormData] = useState(() => {
    if ((editMode || addAccountMode) && vendorData) {
      return {
        name: vendorData.name || "",
        aliases:
          addAccountMode && Array.isArray(vendorData.aliases)
            ? vendorData.aliases.join(", ")
            : vendorData.aliases || "",
        portal_url: vendorData.portal_url || "",
        email: vendorData.email || "",
        phone_number: vendorData.phone_number || "",
        account_number: initialValues?.account_number || "",
        service: "",
        property_id: initialValues?.property_id || "",
      };
    }
    return {
      ...emptyVendor,
      name: initialValues?.name || "",
      account_number: initialValues?.account_number || "",
      property_id: initialValues?.property_id || "",
    };
  });

  useEffect(() => {
    fetchProperties().catch(() => {});
  }, [fetchProperties]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (addAccountMode) {
      await onSubmit({
        account_number: formData.account_number.trim(),
        service: formData.service.trim(),
        property_id: formData.property_id,
      });
      return;
    }

    const aliases = Array.isArray(formData.aliases)
      ? formData.aliases
      : (formData.aliases || "")
          .split(/[\n,]/)
          .map((alias) => alias.trim())
          .filter(Boolean);

    const vendorPayload = {
      name: formData.name.trim(),
      aliases,
      portal_url: formData.portal_url.trim() || null,
      email: formData.email.trim() || null,
      phone_number: formData.phone_number.trim() || null,
      status: "active",
    };

    if (!editMode) {
      vendorPayload.account_number = formData.account_number.trim() || null;
      vendorPayload.service = formData.service.trim() || null;
      vendorPayload.property_id = formData.property_id || null;
    }

    await onSubmit(vendorPayload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-auto w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {addAccountMode
              ? "Add Vendor Account"
              : editMode
                ? "Update Vendor"
                : "Add Vendor"}
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
              readOnly={addAccountMode}
              className={inputClassName}
              placeholder="Florida Power & Light"
              maxLength={100}
              required={!addAccountMode}
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
              readOnly={addAccountMode}
              className={inputClassName}
              placeholder={"FPL\nFlorida Power"}
              rows={3}
            />
            <p className="mt-1 text-xs text-gray-600">
              Optional. Separate alternate names with commas or new lines.
            </p>
          </div>

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
              readOnly={addAccountMode}
              className={inputClassName}
              placeholder="https://example.com"
              maxLength={2048}
            />
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
              readOnly={addAccountMode}
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
              readOnly={addAccountMode}
              className={inputClassName}
              placeholder="(555) 555-5555"
            />
          </div>

          {(!editMode || addAccountMode) && (
            <fieldset className="space-y-4 rounded-lg border border-secondary p-4">
              <legend className="px-1 text-sm font-semibold">
                Account Information{accountRequired ? "" : " (Optional)"}
              </legend>

              <div>
                <label htmlFor="vendor-account-number" className="mb-1 block text-sm font-medium">
                  Account Number
                </label>
                <input
                  id="vendor-account-number"
                  name="account_number"
                  type="text"
                  value={formData.account_number}
                  onChange={handleChange}
                  className={inputClassName}
                  required={accountRequired}
                />
              </div>

              <div>
                <label htmlFor="vendor-service" className="mb-1 block text-sm font-medium">
                  Service Type
                </label>
                <input
                  id="vendor-service"
                  name="service"
                  type="text"
                  value={formData.service}
                  onChange={handleChange}
                  className={inputClassName}
                  placeholder="Electric"
                  required={accountRequired}
                />
              </div>

              <div>
                <label htmlFor="vendor-property" className="mb-1 block text-sm font-medium">
                  Property
                </label>
                <select
                  id="vendor-property"
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleChange}
                  className={inputClassName}
                  disabled={propertiesLoading}
                  required={accountRequired}
                >
                  <option value="">
                    {propertiesLoading
                      ? "Loading properties..."
                      : accountRequired
                        ? "Select a property"
                        : "Select a property (optional)"}
                  </option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                {propertiesError && (
                  <div className="mt-1 text-sm text-red-700">
                    <p role="alert">Could not load properties: {propertiesError}</p>
                    <button
                      type="button"
                      onClick={() => fetchProperties().catch(() => {})}
                      className="mt-1 font-semibold underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-600">
                {accountRequired
                  ? "Account number, service type, and property are required."
                  : "To create an account, provide the account number, service type, and property."}
              </p>
            </fieldset>
          )}

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
                : addAccountMode
                  ? "Add Account"
                  : editMode
                    ? "Update Vendor"
                    : "Create Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default VendorForm;
