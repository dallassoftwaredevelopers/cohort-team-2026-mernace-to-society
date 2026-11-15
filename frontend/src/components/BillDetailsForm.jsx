import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import PropertyForm from "./PropertyForm";
import VendorAccountForm from "./VendorAccountForm";

const ADD_PROPERTY_OPTION = "__add_property__";
const ADD_VENDOR_ACCOUNT_OPTION = "__add_vendor_account__";

async function invokeFunction(name, body, fallbackMessage) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const details = await error.context?.json?.().catch(() => null);
    throw new Error(details?.error ?? fallbackMessage);
  }
  return data.data;
}

function fetchVendorAccounts(propertyId) {
  return supabase
    .from("vendor_account")
    .select("id, account_number, service, vendor_id, vendor(name)")
    .eq("property_id", propertyId);
}

// property and vendorAccount hold ids; the dropdowns show names
const initialFormData = {
  property: "",
  vendorAccount: "",
  invoiceNumber: "",
  amount: "",
  invoiceDate: "",
  dueDate: "",
  comments: "",
  approver: "",
};

const inputClassName = "input";

// Turns a bill row from the database into the form's field names
function billToFormData(bill) {
  return {
    ...initialFormData,
    property: bill.property_id ?? "",
    vendorAccount: bill.vendor_account_id ?? "",
    invoiceNumber: bill.invoice_number ?? "",
    amount: bill.amount == null ? "" : String(bill.amount),
    invoiceDate: bill.issue_date ?? "",
    dueDate: bill.due_date ?? "",
    comments: bill.review_reason ?? "",
  };
}

// Pass `bill` to edit an existing pending bill; leave it out to create a new one.
// onSaved runs after a successful edit; onCancel shows a Cancel button.
// source: 'upload' when the bill came from the Upload Bill page; only used when creating
function BillDetailsForm({
  bill,
  initialValues,
  source = "manual",
  allowCreateRecords = false,
  onSaved,
  onCancel,
}) {
  const isEditing = Boolean(bill);
  const [formData, setFormData] = useState(() => {
    const startingValues = bill ?? initialValues;
    return startingValues ? billToFormData(startingValues) : initialFormData;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [properties, setProperties] = useState([]);
  const [vendorAccounts, setVendorAccounts] = useState([]);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [isCreatingProperty, setIsCreatingProperty] = useState(false);
  const [propertyFormError, setPropertyFormError] = useState("");
  const [showVendorAccountForm, setShowVendorAccountForm] = useState(false);
  const [isCreatingVendorAccount, setIsCreatingVendorAccount] =
    useState(false);
  const [vendorAccountFormError, setVendorAccountFormError] = useState("");

  // Plain reads go straight to the tables; only the insert needs the edge function
  useEffect(() => {
    async function loadProperties() {
      const { data, error } = await supabase
        .from("property")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Loading properties failed:", error);
        setErrorMessage("Could not load properties.");
        return;
      }
      setProperties(data);
    }

    loadProperties();
  }, []);

  // Reload the vendor accounts whenever a different property is picked
  useEffect(() => {
    if (!formData.property) return;

    let ignore = false;

    async function loadVendorAccounts() {
      const { data, error } = await fetchVendorAccounts(formData.property);

      if (ignore) return;
      if (error) {
        console.error("Loading vendor accounts failed:", error);
        setErrorMessage("Could not load vendor accounts.");
        return;
      }
      setVendorAccounts(data);
    }

    loadVendorAccounts();
    return () => {
      ignore = true;
    };
  }, [formData.property]);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "property" && value === ADD_PROPERTY_OPTION) {
      setPropertyFormError("");
      setShowPropertyForm(true);
      return;
    }

    if (name === "vendorAccount" && value === ADD_VENDOR_ACCOUNT_OPTION) {
      setVendorAccountFormError("");
      setShowVendorAccountForm(true);
      return;
    }

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
      // A vendor account belongs to one property, so clear it when the property changes
      ...(name === "property" && { vendorAccount: "" }),
    }));
    if (name === "property") setVendorAccounts([]);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleCreateProperty(propertyData) {
    setIsCreatingProperty(true);
    setPropertyFormError("");

    try {
      const newProperty = await invokeFunction(
        "create-property",
        propertyData,
        "The property could not be created. Please try again.",
      );
      setProperties((currentProperties) =>
        [...currentProperties, newProperty].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      setFormData((currentForm) => ({
        ...currentForm,
        property: newProperty.id,
        vendorAccount: "",
      }));
      setVendorAccounts([]);
      setShowPropertyForm(false);
    } catch (error) {
      setPropertyFormError(
        error instanceof Error
          ? error.message
          : "The property could not be created. Please try again.",
      );
    } finally {
      setIsCreatingProperty(false);
    }
  }

  async function handleCreateVendorAccount({
    vendorId,
    vendorName,
    accountNumber,
    service,
  }) {
    setIsCreatingVendorAccount(true);
    setVendorAccountFormError("");
    const propertyId = formData.property;
    const fallbackMessage =
      "The vendor account could not be created. Please try again.";

    try {
      let accountVendorId = vendorId;
      if (vendorId) {
        await invokeFunction(
          "create-vendor-account",
          {
            vendor_id: vendorId,
            property_id: propertyId,
            account_number: accountNumber,
            service,
          },
          fallbackMessage,
        );
      } else {
        const newVendor = await invokeFunction(
          "create-vendor",
          {
            name: vendorName,
            account_number: accountNumber,
            service,
            property_id: propertyId,
          },
          fallbackMessage,
        );
        accountVendorId = newVendor.id;
      }

      const { data, error } = await fetchVendorAccounts(propertyId);
      if (error) {
        throw new Error(
          "The vendor account was created, but the list could not be reloaded. Refresh the page to see it.",
        );
      }

      const newAccount = data.find(
        (account) =>
          account.vendor_id === accountVendorId &&
          account.account_number === accountNumber,
      );
      setVendorAccounts(data);
      setFormData((currentForm) => ({
        ...currentForm,
        vendorAccount: newAccount?.id ?? "",
      }));
      setShowVendorAccountForm(false);
    } catch (error) {
      setVendorAccountFormError(
        error instanceof Error ? error.message : fallbackMessage,
      );
    } finally {
      setIsCreatingVendorAccount(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Only send fields the bill table has columns for. Approver stays in
      // the UI until the table supports it. The edge function looks up property_id from the vendor account.
      const billFields = {
        invoice_number: formData.invoiceNumber,
        amount: Number(formData.amount),
        issue_date: formData.invoiceDate,
        due_date: formData.dueDate,
        vendor_account_id: formData.vendorAccount,
        review_reason: formData.comments,
      };

      const { data, error } = isEditing
        ? await supabase.functions.invoke("update-bill", {
            method: "PATCH",
            body: { id: bill.id, ...billFields },
          })
        : await supabase.functions.invoke("create-bill", {
            body: { ...billFields, source },
          });

      if (error) {
        // The function's { error } message lives on the response body
        const details = await error.context?.json?.().catch(() => null);
        throw new Error(
          details?.error ??
            "The bill could not be submitted. Please try again.",
        );
      }

      if (isEditing) {
        onSaved?.(data?.data);
        return;
      }

      setSuccessMessage("Bill submitted successfully.");
      setFormData(initialFormData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The bill could not be submitted. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="property" className="label">
            Property
          </label>
          <select
            id="property"
            name="property"
            value={formData.property}
            onChange={handleChange}
            className={`${inputClassName} select`}
            required
          >
            <option value="" disabled>
              Select property
            </option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
            {allowCreateRecords && (
              <option value={ADD_PROPERTY_OPTION}>+ Add new property</option>
            )}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="vendorAccount" className="label">
              Vendor Account
            </label>
            <select
              id="vendorAccount"
              name="vendorAccount"
              value={formData.vendorAccount}
              onChange={handleChange}
              className={`${inputClassName} select`}
              disabled={!formData.property}
              aria-describedby={
                formData.property ? undefined : "vendorAccount-hint"
              }
              required
            >
              <option value="" disabled>
                {formData.property
                  ? "Select vendor account"
                  : "Select a property first"}
              </option>
              {vendorAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.vendor?.name} · acct {account.account_number} ·{" "}
                  {account.service}
                </option>
              ))}
              {allowCreateRecords && formData.property && (
                <option value={ADD_VENDOR_ACCOUNT_OPTION}>
                  + Add vendor account
                </option>
              )}
            </select>
            {!formData.property && (
              <p id="vendorAccount-hint" className="mt-1 text-xs text-red-600">
                Select a property first to see its vendor accounts.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="invoiceNumber" className="label">
              Invoice Number
            </label>
            <input
              id="invoiceNumber"
              name="invoiceNumber"
              type="text"
              placeholder="Enter invoice number"
              value={formData.invoiceNumber}
              onChange={handleChange}
              className={inputClassName}
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="label">
              Amount
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={handleChange}
              className={inputClassName}
              required
            />
          </div>

          <div>
            <label htmlFor="invoiceDate" className="label">
              Invoice Date
            </label>
            <input
              id="invoiceDate"
              name="invoiceDate"
              type="date"
              value={formData.invoiceDate}
              onChange={handleChange}
              className={inputClassName}
              required
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="label">
              Due Date
            </label>
            <input
              id="dueDate"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              className={inputClassName}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="comments" className="label">
            Comments <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <textarea
            id="comments"
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            rows={4}
            maxLength={2000}
            placeholder="Add a comment about this bill"
            className={inputClassName}
          />
          <p className="mt-1 text-right text-xs text-gray-500">
            {formData.comments.length}/2000
          </p>
        </div>

        {/* Hidden for now: approved_by is set when someone actually approves the bill,
            not at creation. Bring back as "Assign to" if we add an assigned approver column.
        <div>
          <label
            htmlFor="approver"
            className="label"
          >
            Approver
          </label>
          <select
            id="approver"
            name="approver"
            value={formData.approver}
            onChange={handleChange}
            className={inputClassName}
            required
          >
            <option value="" disabled>
              Select approver
            </option>
            <option value="Robert">Robert</option>
            <option value="John">John</option>
          </select>
        </div>
        */}

        {errorMessage && (
          <p role="alert" className="alert-error">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p role="status" className="alert-success">
            {successMessage}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-secondary pt-5">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? isEditing
                ? "Saving..."
                : "Submitting..."
              : isEditing
                ? "Save Changes"
                : "Review & Submit"}
          </button>
        </div>
      </form>

      {showPropertyForm && (
        <PropertyForm
          initialValues={{ status: "active" }}
          isSubmitting={isCreatingProperty}
          error={propertyFormError}
          onCancel={() => setShowPropertyForm(false)}
          onSubmit={handleCreateProperty}
        />
      )}

      {showVendorAccountForm && (
        <VendorAccountForm
          propertyName={
            properties.find((property) => property.id === formData.property)
              ?.name ?? ""
          }
          isSubmitting={isCreatingVendorAccount}
          error={vendorAccountFormError}
          onCancel={() => setShowVendorAccountForm(false)}
          onSubmit={handleCreateVendorAccount}
        />
      )}
    </>
  );
}

export default BillDetailsForm;
