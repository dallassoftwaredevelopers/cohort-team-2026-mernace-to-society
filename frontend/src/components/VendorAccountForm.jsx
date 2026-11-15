import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";

const NEW_VENDOR_OPTION = "__new_vendor__";

const inputClassName = "input";

function VendorAccountForm({
  propertyName,
  isSubmitting = false,
  error = "",
  onCancel,
  onSubmit,
}) {
  const [vendors, setVendors] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [formData, setFormData] = useState({
    vendorId: "",
    vendorName: "",
    accountNumber: "",
    service: "",
  });

  const isNewVendor = formData.vendorId === NEW_VENDOR_OPTION;

  useEffect(() => {
    async function loadVendors() {
      const { data, error } = await supabase
        .from("vendor")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Loading vendors failed:", error);
        setLoadError("Could not load vendors.");
        return;
      }
      setVendors(data);
    }

    loadVendors();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({
      vendorId: isNewVendor ? null : formData.vendorId,
      vendorName: formData.vendorName.trim(),
      accountNumber: formData.accountNumber.trim(),
      service: formData.service.trim(),
    });
  }

  return (
    <div className="modal-overlay">
      <div className="my-auto w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Add Vendor Account</h2>
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
            <label htmlFor="account-property" className="label">
              Property
            </label>
            <input
              id="account-property"
              type="text"
              value={propertyName}
              readOnly
              className={`${inputClassName} bg-gray-100`}
            />
          </div>

          <div>
            <label htmlFor="account-vendor" className="label">
              Vendor
            </label>
            <select
              id="account-vendor"
              name="vendorId"
              value={formData.vendorId}
              onChange={handleChange}
              className={`${inputClassName} select`}
              required
            >
              <option value="" disabled>
                Select vendor
              </option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
              <option value={NEW_VENDOR_OPTION}>+ New vendor</option>
            </select>
            {loadError && (
              <p role="alert" className="mt-1 text-sm text-red-700">
                {loadError}
              </p>
            )}
          </div>

          {isNewVendor && (
            <div>
              <label htmlFor="account-vendor-name" className="label">
                New Vendor Name
              </label>
              <input
                id="account-vendor-name"
                name="vendorName"
                type="text"
                value={formData.vendorName}
                onChange={handleChange}
                className={inputClassName}
                placeholder="Florida Power & Light"
                maxLength={100}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="account-number" className="label">
                Account Number
              </label>
              <input
                id="account-number"
                name="accountNumber"
                type="text"
                value={formData.accountNumber}
                onChange={handleChange}
                className={inputClassName}
                maxLength={50}
                required
              />
            </div>

            <div>
              <label htmlFor="account-service" className="label">
                Service Type
              </label>
              <input
                id="account-service"
                name="service"
                type="text"
                value={formData.service}
                onChange={handleChange}
                className={inputClassName}
                placeholder="Electric"
                maxLength={50}
                required
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="alert-error">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-secondary pt-5 sm:flex-row sm:justify-end sm:gap-3">
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
              {isSubmitting ? "Saving..." : "Add Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VendorAccountForm;
