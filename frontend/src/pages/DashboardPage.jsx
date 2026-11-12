import PropertyForm from "../components/PropertyForm";
import VendorForm from "../components/VendorForm";
import { useProperties } from "../hooks/useProperties";
import { supabase } from "../../utils/supabase";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../hooks/useUserProfile";

const cards = [
  { title: "Bills to Review", value: "0" },
  { title: "Outstanding / Due Soon", value: "$0", note: "0 bills due" },
  { title: "Paid This Month", value: "$0", note: "0 bills paid" },
  { title: "Monthly Spending Total", value: "$0" },
];

// keys match current MVP ERD tables
const columns = [
  { label: "Bill #", key: "bill_number" },
  { label: "Property", key: "property" },
  { label: "Vendor", key: "vendor" },
  { label: "Due Date", key: "due_date" },
  { label: "Amount", key: "amount" },
  { label: "Status", key: "status" },
];

function DashboardPage() {
  const [open, setOpen] = useState(false);
  const [activeForm, setActiveForm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { createProperty } = useProperties();
  const navigate = useNavigate();
  const { profile, authUser } = useUserProfile();

  // Wraps the Add Bill button and its menu, so we can tell inside clicks from outside ones
  const dropdownRef = useRef(null);

  // Close the Add Bill menu when clicking outside it or pressing Escape
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function closeForm() {
    setActiveForm("");
    setFormError("");
  }

  async function handleCreateProperty(propertyData) {
    setIsSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      await createProperty(propertyData);
      setSuccessMessage("Property created successfully.");
      closeForm();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Could not create property.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
        throw new Error(error.message || "Could not create vendor.");
      }
      if (data?.error) {
        throw new Error(data.error);
      }
      if (!data?.data) {
        throw new Error("The server did not return the created vendor.");
      }

      setSuccessMessage("Vendor created successfully.");
      closeForm();
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
        <div>
          <h1 className="font-serif text-2xl font-bold">
            Welcome Back, {profile?.name || authUser?.email || "there"}
          </h1>
          <p className="mt-2 text-sm">
            Review pending property bills, track expenses, and record payments.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="btn-primary w-full px-5 py-3 text-sm sm:w-auto"
            >
              + Add Bill ▾
            </button>
            {open && (
              <div className="absolute left-0 z-10 mt-2 w-48 rounded-lg border border-secondary bg-white py-2 shadow-lg sm:left-auto sm:right-0">
                {[
                  { label: "Enter Manually", path: "/bills/manual" },
                  { label: "Upload Bill", path: "/bills/upload" },
                ].map(({ label, path }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate(path);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm font-semibold hover:bg-section"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setActiveForm("property");
            }}
            className="btn-secondary px-5 py-3 text-sm"
          >
            Add Property
          </button>
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setActiveForm("vendor");
            }}
            className="btn-secondary px-5 py-3 text-sm"
          >
            Add Vendor
          </button>
        </div>
      </section>

      {successMessage && (
        <p role="status" className="mt-4 text-sm text-green-700">
          {successMessage}
        </p>
      )}

      {/* Summary cards */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {cards.map(({ title, value, note }) => (
          <div key={title} className="card">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-3 text-2xl font-bold md:text-3xl">{value}</p>
            {note && <p className="mt-1 text-xs">{note}</p>}
          </div>
        ))}
      </section>

      {/* Property Bills table */}
      <section className="card mt-8">
        <h2 className="border-b border-black pb-4 text-lg font-bold">
          Property Bills
        </h2>

        <table className="mt-4 w-full text-left text-sm">
          <thead className="hidden md:table-header-group">
            <tr className="text-xs uppercase">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-semibold">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className="block md:table-row-group">
            <tr className="mb-4 block rounded-lg bg-white p-4 md:mb-0 md:table-row md:bg-transparent md:p-0">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="flex justify-between py-1 md:table-cell md:px-4 md:py-4"
                >
                  <span className="font-semibold md:hidden">{col.label}</span>
                  {col.key === "status" ? (
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                      Pending
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              ))}
              <td className="block pt-3 md:table-cell md:px-4 md:py-4">
                <div className="flex gap-2 md:justify-end">
                  <button
                    type="button"
                    className="btn-secondary flex-1 px-4 py-2 text-xs md:flex-none"
                  >
                    Review
                  </button>
                  <button
                    type="button"
                    // TODO: open the payment flow once payments are built
                    className="btn-primary flex-1 px-4 py-2 text-xs md:flex-none"
                  >
                    Pay
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
      {activeForm === "property" && (
        <PropertyForm
          key="dashboard-property"
          isSubmitting={isSubmitting}
          error={formError}
          onCancel={closeForm}
          onSubmit={handleCreateProperty}
        />
      )}
      {activeForm === "vendor" && (
        <VendorForm
          key="dashboard-vendor"
          isSubmitting={isSubmitting}
          error={formError}
          onCancel={closeForm}
          onSubmit={handleCreateVendor}
        />
      )}
    </>
  );
}

export default DashboardPage;
