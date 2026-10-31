import { useState } from "react";
import { supabase } from "../../utils/supabase";


const initialFormData = {
  name: "",
  aliases: "",
  portal_url: "",
  email:"",
  phone_number:"",
  status: "active",
  category:"",
};

const inputClassName =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function VendorFormPage() {
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
      
      //convert aliases to an array
      const vendorData ={
        ...formData,
        aliases:formData.aliases
        .split(",")
        .map((alias) => alias.trim())
        .filter(Boolean),
      }

      const { error } = await supabase.functions.invoke("create-Vendor", {
        body: vendorData,
      });

     if (error) {
       throw error;
     }

      setSuccessMessage("Vendor details submitted successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Vendor details could not be submitted. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="vendor"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Vendor
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Comcast Business"
          value={formData.name}
          onChange={handleChange}
          className={inputClassName}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="aliases"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Aliases
          </label>
          <input
            id="aliases"
            name="aliases"
            type="text"
            placeholder="Florida Power & Light"
            value={formData.aliases}
            onChange={handleChange}
            className={inputClassName}
            required
          />
        </div>

        <div>
          <label
            htmlFor="portal_url"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Website
          </label>
          <input
            id="portal_url"
            name="portal_url"
            type="text"
            placeholder="business.comcast.com "
            value={formData.portal_url}
            onChange={handleChange}
            className={inputClassName}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder=""
            value={formData.email}
            onChange={handleChange}
            className={inputClassName}
            required
          />
        </div>

        <div>
          <label
            htmlFor="phone_number"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Phone Number
          </label>
          <input
            id="phone_number"
            name="phone_number"
            type="tel"
            placeholder=""
            value={formData.phone_number}
            onChange={handleChange}
            className={inputClassName}
            required
          />
        </div>

        {/* <div>
          <label
            htmlFor="status"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={inputClassName}
            required
          >
            <option value="" disabled>
              Select status
            </option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div> */}

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
      </div>
    </form>
  );
}

export default VendorFormPage;
