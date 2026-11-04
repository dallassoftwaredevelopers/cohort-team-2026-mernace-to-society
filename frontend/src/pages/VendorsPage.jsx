import { useState } from "react";
import VendorForm from "../components/VendorForm";
import { supabase } from "../../utils/supabase";

const cards = [
  { title: "Total Vendors", value: "0", note: "Across 0 service types" },
  { title: "Vendor Accounts", value: "0", note: "Linked to 0 properties" },
  { title: "Open Bills", value: "0", note: "From 0 vendors" },
  { title: "Active Vendors", value: "0", note: "0 inactive" },
];

// service_type lives on vendor_account (electric, water, etc.)
const serviceTypes = [
  "Electric",
  "Water",
  "Disposal",
  "Internet",
  "Property Services",
];

// keys match current MVP ERD tables
const columns = [
  { label: "Vendor Name", key: "name", mobile: true },
  { label: "Also On Bills As", key: "aliases" },
  { label: "Accounts", key: "accounts" },
  { label: "Open Bills", key: "open_bills" },
  { label: "Status", key: "status", mobile: true },
];

const hideOnMobile = (col) => (col.mobile ? "" : "hidden md:table-cell");

function VendorsPage() {
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function closeVendorForm() {
    setShowVendorForm(false);
    setFormError("");
  }

  async function handleCreateVendor(vendorData) {
    setIsSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("create-vendor", {
        body: vendorData,
      });

      if (error) {
        let serverMessage = "";
        if (typeof error.context?.json === "function") {
          try {
            const responseBody = await error.context.json();
            serverMessage = responseBody?.error || "";
          } catch {
            serverMessage = "";
          }
        }
        throw new Error(
          serverMessage || error.message || "Could not create vendor.",
        );
      }

      if (data?.error) {
        throw new Error(data.error);
      }
      if (!data?.data) {
        throw new Error("The server did not return the created vendor.");
      }

      setSuccessMessage("Vendor created successfully.");
      closeVendorForm();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not create vendor.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-bold">Vendors</h1>
        <button
          type="button"
          onClick={() => {
            setFormError("");
            setShowVendorForm(true);
          }}
          className="btn-primary cursor-pointer px-5 py-3 text-sm"
        >
          + Add Vendor
        </button>
      </section>

      {successMessage && (
        <p role="status" className="mt-4 text-sm text-green-700">
          {successMessage}
        </p>
      )}

      {/* Search */}
      <div className="mt-6">
        <label htmlFor="vendor-search" className="sr-only">
          Search vendors
        </label>
        <input
          id="vendor-search"
          type="search"
          placeholder="Search vendors"
          className="w-full rounded-lg border border-secondary px-4 py-3 text-sm md:max-w-sm"
        />
      </div>

      {/* Summary cards */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {cards.map(({ title, value, note }) => (
          <div key={title} className="card">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-3 text-3xl font-bold">{value}</p>
            {note && <p className="mt-1 text-xs">{note}</p>}
          </div>
        ))}
      </section>

      {/* Vendors by service type */}
      <section className="card mt-8">
        <div className="flex items-baseline justify-between border-b border-black pb-4">
          <h2 className="text-lg font-bold">Vendors by Service Type</h2>
          <span className="text-sm">0 total vendors</span>
        </div>

        {serviceTypes.map((type) => (
          <div key={type} className="mt-6">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">{type}</h3>
              <span className="text-xs">0 vendors</span>
            </div>

            <table className="mt-2 w-full rounded-lg bg-white text-left text-sm">
              <thead>
                <tr className="text-xs uppercase">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 font-semibold ${hideOnMobile(col)}`}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="w-8 md:hidden">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* Placeholder row — replace with mapped vendor data later */}
                <tr className="border-t border-section">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${hideOnMobile(col)}`}
                    >
                      {col.key === "status" ? (
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                          Active
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  ))}
                  <td className="pr-4 text-right md:hidden" aria-hidden="true">
                    →
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </section>
      {showVendorForm && (
        <VendorForm
          isSubmitting={isSubmitting}
          error={formError}
          onCancel={closeVendorForm}
          onSubmit={handleCreateVendor}
        />
      )}
    </>
  );
}

export default VendorsPage;
