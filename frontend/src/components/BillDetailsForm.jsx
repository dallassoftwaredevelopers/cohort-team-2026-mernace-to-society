import { useState } from "react";

const initialFormData = {
  property: "",
  vendor: "",
  invoiceNumber: "",
  amount: "",
  invoiceDate: "",
  dueDate: "",
  category: "",
  approver: "",
};

const inputClassName =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function BillDetailsForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((currentForm) => ({ ...currentForm, [name]: value }));
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("The bill could not be submitted. Please try again.");
      }

      setSuccessMessage("Bill submitted successfully.");
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
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="property"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Property
        </label>
        <input
          id="property"
          name="property"
          type="text"
          placeholder="Royal Oaks Apartments"
          value={formData.property}
          onChange={handleChange}
          className={inputClassName}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="vendor"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Vendor
          </label>
          <input
            id="vendor"
            name="vendor"
            type="text"
            placeholder="Florida Power & Light"
            value={formData.vendor}
            onChange={handleChange}
            className={inputClassName}
            required
          />
        </div>

        <div>
          <label
            htmlFor="invoiceNumber"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
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
          <label
            htmlFor="amount"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
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
          <label
            htmlFor="invoiceDate"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
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
          <label
            htmlFor="dueDate"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
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

        <div>
          <label
            htmlFor="category"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
            id="category"
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
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="approver"
          className="mb-1 block text-sm font-medium text-gray-700"
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

      {errorMessage && (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p role="status" className="text-sm text-green-700">
          {successMessage}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-5">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-[#2460D5] px-4 py-2 text-sm font-medium text-white hover:bg-[#194DB4] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Review & Submit"}
        </button>
      </div>
    </form>
  );
}

export default BillDetailsForm;
