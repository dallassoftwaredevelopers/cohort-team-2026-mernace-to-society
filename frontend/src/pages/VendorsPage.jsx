
import { useEffect, useState } from "react";
import VendorForm from "../components/VendorForm";
import { useVendors } from "../hooks/useVendors";
import { supabase } from "../../utils/supabase";

const cards = [
  { title: "Total Vendors", value: "0", note: "Across 0 service types" },
  { title: "Vendor Accounts", value: "0", note: "Linked to 0 properties" },
  { title: "Open Bills", value: "0", note: "From 0 vendors" },
  { title: "Active Vendors", value: "0", note: "0 inactive" },
];

const serviceTypes = [
  "Electric",
  "Water",
  "Disposal",
  "Internet",
  "Property Services",
];

const columns = [
  { label: "Vendor Name", key: "name", mobile: true },
  { label: "Also On Bills As", key: "aliases" },
  { label: "Accounts", key: "accounts" },
  { label: "Open Bills", key: "open_bills" },
  { label: "Status", key: "status", mobile: true },
];

const hideOnMobile = (col) => (col.mobile ? "" : "hidden md:table-cell");

function renderVendorCell(col, vendor, accountCount) {
  if (col.key === "name") return vendor.name;

  if (col.key === "aliases") {
    return vendor.aliases && vendor.aliases.length > 0
      ? vendor.aliases.join(", ")
      : "—";
  }

  if (col.key === "accounts") return accountCount;

  if (col.key === "status") {
    return (
      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
        {vendor.status === "active" ? "Active" : vendor.status || "—"}
      </span>
    );
  }

  return "—";
}

function VendorsPage() {
  const { vendors, loading, error, fetchVendors, deleteVendors } = useVendors();

  const [showVendorForm, setShowVendorForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedVendorIds, setSelectedVendorIds] = useState(new Set());
  const [editVendorId, setEditVendorId] = useState(null);

  const unassignedVendors = vendors.filter(
    (vendor) => !(vendor.vendor_account || []).length,
  );

  const allDisplayedVendors = vendors;

  useEffect(() => {
    fetchVendors().catch(() => {});
  }, [fetchVendors]);

  function closeVendorForm() {
    setShowVendorForm(false);
    setEditVendorId(null);
    setFormError("");
  }

  async function handleCreateVendor(vendorData) {
    setIsSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-vendor",
        { body: vendorData },
      );

      if (invokeError) {
        let serverMessage = "";

        if (typeof invokeError.context?.json === "function") {
          try {
            const responseBody = await invokeError.context.json();
            serverMessage = responseBody?.error || "";
          } catch {
            serverMessage = "";
          }
        }

        throw new Error(
          serverMessage || invokeError.message || "Could not create vendor.",
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
      await fetchVendors();
    } catch (caughtError) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create vendor.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function editVendor(vendorData) {
    if (!editVendorId) return;

    setIsSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      const { data, error: invokeError } =
        await supabase.functions.invoke("update-vendor", {
          method: "PATCH",
          body: { ...vendorData, id: editVendorId },
        });

      if (invokeError) {
        let serverMessage = "";

        if (typeof invokeError.context?.json === "function") {
          try {
            const responseBody = await invokeError.context.json();
            serverMessage = responseBody?.error || "";
          } catch {
            serverMessage = "";
          }
        }

        throw new Error(
          serverMessage || invokeError.message || "Could not update vendor.",
        );
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setSuccessMessage("Vendor updated successfully.");
      closeVendorForm();
      await fetchVendors();
    } catch (caughtError) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update vendor.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleVendorSelection(vendorId) {
    setSelectedVendorIds((prev) => {
      const next = new Set(prev);

      if (next.has(vendorId)) {
        next.delete(vendorId);
      } else {
        next.add(vendorId);
      }

      return next;
    });
  }

  function toggleSelectAll() {
    if (
      selectedVendorIds.size === allDisplayedVendors.length &&
      allDisplayedVendors.length > 0
    ) {
      setSelectedVendorIds(new Set());
    } else {
      setSelectedVendorIds(new Set(allDisplayedVendors.map((v) => v.id)));
    }
  }

  const allSelected =
    allDisplayedVendors.length > 0 &&
    selectedVendorIds.size === allDisplayedVendors.length;

  const someSelected =
    selectedVendorIds.size > 0 &&
    selectedVendorIds.size < allDisplayedVendors.length;

  async function handleDeleteSelected() {
    if (selectedVendorIds.size === 0) return;

    const count = selectedVendorIds.size;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${count} vendor${count !== 1 ? "s" : ""}?`,
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      await deleteVendors(Array.from(selectedVendorIds));

      setSuccessMessage(
        `${count} vendor${count !== 1 ? "s" : ""} deleted successfully.`,
      );

      setSelectedVendorIds(new Set());
      await fetchVendors();
    } catch (caughtError) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete vendors.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const vendorsByService = serviceTypes.map((type) => ({
    type,
    vendors: vendors.filter((vendor) =>
      (vendor.vendor_account || []).some(
        (account) => account.service?.toLowerCase() === type.toLowerCase(),
      ),
    ),
  }));

  const tableHead = (
    <thead>
      <tr className="text-xs uppercase">
        <th className="w-8 px-4 py-3 font-semibold">
          <span className="sr-only">Select</span>
        </th>

        {columns.map((col) => (
          <th
            key={col.key}
            className={`px-4 py-3 font-semibold ${hideOnMobile(col)}`}
          >
            {col.label}
          </th>
        ))}

        <th className="hidden px-4 py-3 font-semibold md:table-cell">
          Actions
        </th>

        <th className="w-8 md:hidden">
          <span className="sr-only">Open</span>
        </th>
      </tr>
    </thead>
  );

  function renderVendorRow(vendor, accountCount) {
    return (
      <tr key={vendor.id} className="border-t border-section">
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={selectedVendorIds.has(vendor.id)}
            onChange={() => toggleVendorSelection(vendor.id)}
            className="h-4 w-4 cursor-pointer"
            aria-label={`Select ${vendor.name}`}
          />
        </td>

        {columns.map((col) => (
          <td key={col.key} className={`px-4 py-3 ${hideOnMobile(col)}`}>
            {renderVendorCell(col, vendor, accountCount)}
          </td>
        ))}

        <td className="hidden px-4 py-3 md:table-cell">
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setEditVendorId(vendor.id);
              setShowVendorForm(true);
            }}
            className="cursor-pointer text-sm text-primary underline"
            aria-label={`Edit ${vendor.name}`}
          >
            Edit
          </button>
        </td>

        <td className="pr-4 text-right md:hidden" aria-hidden="true">
          →
        </td>
      </tr>
    );
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

      {formError && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {formError}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

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

      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {cards.map(({ title, value, note }) => (
          <div key={title} className="card">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-3 text-3xl font-bold">{value}</p>
            {note && <p className="mt-1 text-xs">{note}</p>}
          </div>
        ))}
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleDeleteSelected}
          disabled={selectedVendorIds.size === 0 || isDeleting}
          className="btn-secondary w-full cursor-pointer px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isDeleting
            ? "Deleting..."
            : `Delete Selected (${selectedVendorIds.size})`}
        </button>
      </div>

      <section className="card mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black pb-4">
          <h2 className="text-lg font-bold">Vendors by Service Type</h2>

          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={toggleSelectAll}
                className="h-4 w-4 cursor-pointer"
              />
              Select All
            </label>

            <span className="text-sm">{vendors.length} total vendors</span>
          </div>
        </div>

        {loading && vendors.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">Loading vendors…</p>
        ) : (
          <>
            {vendorsByService.map(({ type, vendors: typeVendors }) => (
              <div key={type} className="mt-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">{type}</h3>
                  <span className="text-xs">
                    {typeVendors.length} vendors
                  </span>
                </div>

                <table className="mt-2 w-full rounded-lg bg-white text-left text-sm">
                  {tableHead}
                  <tbody>
                    {typeVendors.length === 0 ? (
                      <tr className="border-t border-section">
                        <td
                          colSpan={columns.length + 3}
                          className="px-4 py-3 text-gray-600"
                        >
                          No vendors for this service type.
                        </td>
                      </tr>
                    ) : (
                      typeVendors.map((vendor) =>
                        renderVendorRow(
                          vendor,
                          (vendor.vendor_account || []).filter(
                            (account) =>
                              account.service?.toLowerCase() ===
                              type.toLowerCase(),
                          ).length,
                        ),
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ))}

            {unassignedVendors.length > 0 && (
              <div className="mt-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">Unassigned</h3>
                  <span className="text-xs">
                    {unassignedVendors.length} vendors
                  </span>
                </div>

                <table className="mt-2 w-full rounded-lg bg-white text-left text-sm">
                  {tableHead}
                  <tbody>
                    {unassignedVendors.map((vendor) =>
                      renderVendorRow(vendor, 0),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>

      {showVendorForm && (
        <VendorForm
          isSubmitting={isSubmitting}
          error={formError}
          onCancel={closeVendorForm}
          onSubmit={editVendorId ? editVendor : handleCreateVendor}
          editMode={!!editVendorId}
          vendorData={
            editVendorId
              ? vendors.find((vendor) => vendor.id === editVendorId)
              : null
          }
        />
      )}
    </>
  );
}

export default VendorsPage;
