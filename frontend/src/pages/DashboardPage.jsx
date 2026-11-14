import PropertyForm from "../components/PropertyForm";
import VendorForm from "../components/VendorForm";
import BillsSummary from "../components/BillsSummary";
import RecentBills from "../components/RecentBills";
import { useProperties } from "../hooks/useProperties";
import { supabase } from "../../utils/supabase";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../hooks/useUserProfile";
import { canManageRecords } from "../utils/permissions";

function DashboardPage() {
  const [open, setOpen] = useState(false);
  const [activeForm, setActiveForm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { createProperty } = useProperties();
  const navigate = useNavigate();
  const { profile, authUser } = useUserProfile();
  const canEditRecords = canManageRecords(profile?.role);

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
                {(canEditRecords
                  ? [
                      { label: "Enter Manually", path: "/bills/manual" },
                      { label: "Upload Bill", path: "/bills/upload" },
                    ]
                  : [{ label: "Upload Bill", path: "/bills/upload" }]
                ).map(({ label, path }) => (
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
          {canEditRecords && (
            <>
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
            </>
          )}
        </div>
      </section>

      {successMessage && (
        <p role="status" className="mt-4 text-sm text-green-700">
          {successMessage}
        </p>
      )}

      <BillsSummary />

      {/* Recent bills */}
      <RecentBills />
      {activeForm === "property" && (
        <PropertyForm
          key="dashboard-property"
          isSubmitting={isSubmitting}
          error={formError}
          onCancel={closeForm}
          onSubmit={handleCreateProperty}
        />
      )}
      {canEditRecords && activeForm === "vendor" && (
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
