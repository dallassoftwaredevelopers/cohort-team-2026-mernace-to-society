import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import VendorForm from "../components/VendorForm";
import VendorSummary from "../components/VendorSummary";
import { useUserProfile } from "../hooks/useUserProfile";
import { canManageRecords } from "../utils/permissions";
import { useVendors } from "../hooks/useVendors";
import { supabase } from "../../utils/supabase";

const serviceTypes = [
  "Electric",
  "Water",
  "Disposal",
  "Internet",
  "Property Services",
];

// width keeps the columns lined up across every service type table
const columns = [
  { label: "Vendor Name", key: "name", mobile: true, width: "md:w-1/4" },
  { label: "Also On Bills As", key: "aliases" },
  { label: "Accounts", key: "accounts", width: "md:w-24" },
  { label: "Open Bills", key: "open_bills", width: "md:w-28" },
  { label: "Status", key: "status", mobile: true, width: "md:w-28" },
];

const hideOnMobile = (col) => (col.mobile ? "" : "hidden md:table-cell");

function renderVendorCell(col, vendor, accountCount) {
  if (col.key === "name") {
    return (
      <Link to={`/vendors/${vendor.id}`} className="link">
        {vendor.name}
      </Link>
    );
  }

  if (col.key === "aliases") {
    return vendor.aliases && vendor.aliases.length > 0
      ? vendor.aliases.join(", ")
      : "—";
  }

  if (col.key === "accounts") return accountCount;

  if (col.key === "status") {
    return (
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          vendor.status === "active"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {vendor.status === "active" ? "Active" : "Inactive"}
      </span>
    );
  }

  return "—";
}

function VendorsPage() {
  const { vendors, loading, error, fetchVendors, deleteVendors } = useVendors();
  const { profile } = useUserProfile();
  const canEditRecords = canManageRecords(profile?.role);

  const [openBillCount, setOpenBillCount] = useState(null);
  const [isLoadingOpenBillCount, setIsLoadingOpenBillCount] = useState(true);
  const [openBillCountError, setOpenBillCountError] = useState("");
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedVendorIds, setSelectedVendorIds] = useState(new Set());
  const [editVendorId, setEditVendorId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const normalizedAccountSearchTerm = normalizedSearchTerm.replace(/\s/g, "");
  const filteredVendors = vendors.filter((vendor) => {
    if (!normalizedSearchTerm) return true;

    return (
      String(vendor.name ?? "")
        .toLowerCase()
        .includes(normalizedSearchTerm) ||
      (vendor.aliases || []).some((alias) =>
        String(alias).toLowerCase().includes(normalizedSearchTerm),
      ) ||
      (vendor.vendor_account || []).some(
        (account) =>
          String(account.service ?? "")
            .toLowerCase()
            .includes(normalizedSearchTerm) ||
          String(account.account_number ?? "")
            .replace(/\s/g, "")
            .toLowerCase()
            .includes(normalizedAccountSearchTerm),
      )
    );
  });

  const unassignedVendors = filteredVendors.filter(
    (vendor) => !(vendor.vendor_account || []).length,
  );

  const allDisplayedVendors = filteredVendors;

  useEffect(() => {
    fetchVendors().catch(() => {});
  }, [fetchVendors]);

  useEffect(() => {
    let isMounted = true;

    async function loadOpenBillCount() {
      try {
        const { count, error: queryError } = await supabase
          .from("bill")
          .select("id, vendor_account!inner(vendor_id)", {
            count: "exact",
            head: true,
          })
          .in("status", ["pending", "needs_review", "approved"]);

        if (queryError) throw queryError;
        if (count === null) {
          throw new Error("Supabase did not return the open bill count.");
        }

        if (isMounted) {
          setOpenBillCount(count);
          setOpenBillCountError("");
        }
      } catch (caughtError) {
        if (isMounted) {
          setOpenBillCountError(
            caughtError instanceof Error
              ? caughtError.message
              : "Could not load open bills.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingOpenBillCount(false);
        }
      }
    }

    loadOpenBillCount();

    return () => {
      isMounted = false;
    };
  }, []);

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
      const { data, error: invokeError } = await supabase.functions.invoke(
        "update-vendor",
        {
          method: "PATCH",
          body: { ...vendorData, id: editVendorId },
        },
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
    vendors: filteredVendors.filter((vendor) =>
      (vendor.vendor_account || []).some(
        (account) => account.service?.toLowerCase() === type.toLowerCase(),
      ),
    ),
  }));

  const vendorAccountCount = vendors.reduce(
    (total, vendor) => total + (vendor.vendor_account || []).length,
    0,
  );
  const vendorsWithAccountsCount = vendors.filter(
    (vendor) => (vendor.vendor_account || []).length > 0,
  ).length;
  const serviceTypeCount = new Set(
    vendors.flatMap((vendor) =>
      (vendor.vendor_account || [])
        .map((account) => account.service?.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).size;
  const activeVendorCount = vendors.filter(
    (vendor) => vendor.status === "active",
  ).length;
  const inactiveVendorCount = vendors.length - activeVendorCount;

  const tableHead = (
    <thead>
      <tr className="text-xs uppercase">
        {canEditRecords && (
          <th className="w-12 px-4 py-3 font-semibold">
            <span className="sr-only">Select</span>
          </th>
        )}

        {columns.map((col) => (
          <th
            key={col.key}
            className={`px-4 py-3 font-semibold ${hideOnMobile(col)} ${col.width ?? ""}`}
          >
            {col.label}
          </th>
        ))}

        {canEditRecords && (
          <th className="hidden px-4 py-3 font-semibold md:table-cell md:w-24">
            Actions
          </th>
        )}

        <th className="w-8 md:hidden">
          <span className="sr-only">Open</span>
        </th>
      </tr>
    </thead>
  );

  function renderVendorRow(vendor, accountCount) {
    return (
      <tr key={vendor.id} className="border-t border-secondary">
        {canEditRecords && (
          <td className="px-4 py-3">
            <input
              type="checkbox"
              checked={selectedVendorIds.has(vendor.id)}
              onChange={() => toggleVendorSelection(vendor.id)}
              className="h-4 w-4 cursor-pointer"
              aria-label={`Select ${vendor.name}`}
            />
          </td>
        )}

        {columns.map((col) => (
          <td key={col.key} className={`px-4 py-3 ${hideOnMobile(col)}`}>
            {renderVendorCell(col, vendor, accountCount)}
          </td>
        ))}

        {canEditRecords && (
          <td className="hidden px-4 py-3 md:table-cell">
            <button
              type="button"
              onClick={() => {
                setFormError("");
                setEditVendorId(vendor.id);
                setShowVendorForm(true);
              }}
              className="btn-secondary px-4 py-2 text-xs"
              aria-label={`Edit ${vendor.name}`}
            >
              Edit
            </button>
          </td>
        )}

        <td className="pr-4 text-right md:hidden" aria-hidden="true">
          →
        </td>
      </tr>
    );
  }

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Vendors</h1>
          <p className="page-subtitle">
            View and manage the companies that send you bills.
          </p>
        </div>

        {canEditRecords && (
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setShowVendorForm(true);
            }}
            className="btn-primary px-5 py-3 text-sm"
          >
            + Add Vendor
          </button>
        )}
      </section>

      {!canEditRecords && (
        <p className="mt-4 text-sm text-gray-600">
          You have read-only access to vendors. Contact a manager or
          administrator to make changes.
        </p>
      )}

      {successMessage && (
        <p role="status" className="alert-success mt-4">
          {successMessage}
        </p>
      )}

      {formError && (
        <p role="alert" className="alert-error mt-4">
          {formError}
        </p>
      )}

      {error && (
        <p role="alert" className="alert-error mt-4">
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
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="input md:max-w-sm"
        />
      </div>

      <VendorSummary
        totalVendorCount={vendors.length}
        vendorAccountCount={vendorAccountCount}
        serviceTypeCount={serviceTypeCount}
        vendorsWithAccountsCount={vendorsWithAccountsCount}
        activeVendorCount={activeVendorCount}
        inactiveVendorCount={inactiveVendorCount}
        isLoadingVendors={loading}
        vendorError={error}
        openBillCount={openBillCount}
        isLoadingOpenBillCount={isLoadingOpenBillCount}
        openBillCountError={openBillCountError}
      />

      {canEditRecords && (
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selectedVendorIds.size === 0 || isDeleting}
            className="btn-danger w-full border border-red-200 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isDeleting
              ? "Deleting..."
              : `Delete Selected (${selectedVendorIds.size})`}
          </button>
        </div>
      )}

      <section className="card mt-8">
        <div className="section-header">
          <h2 className="text-lg font-bold">Vendors by Service Type</h2>

          <div className="flex items-center gap-4">
            {canEditRecords && (
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
            )}
            <span className="text-sm">{vendors.length} total vendors</span>
          </div>
        </div>

        {loading && vendors.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">Loading vendors…</p>
        ) : filteredVendors.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            {normalizedSearchTerm
              ? "No vendors match your search."
              : "No vendors found."}
          </p>
        ) : (
          <>
            {vendorsByService.map(({ type, vendors: typeVendors }) => (
              <div key={type} className="mt-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">{type}</h3>
                  <span className="text-xs">
                    {typeVendors.length}{" "}
                    {typeVendors.length === 1 ? "vendor" : "vendors"}
                  </span>
                </div>

                <table className="mt-2 w-full rounded-lg bg-white text-left text-sm md:table-fixed">
                  {tableHead}
                  <tbody>
                    {typeVendors.length === 0 ? (
                      <tr className="border-t border-secondary">
                        <td
                          colSpan={columns.length + (canEditRecords ? 3 : 1)}
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
                    {unassignedVendors.length}{" "}
                    {unassignedVendors.length === 1 ? "vendor" : "vendors"}
                  </span>
                </div>

                <table className="mt-2 w-full rounded-lg bg-white text-left text-sm md:table-fixed">
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

      {canEditRecords && showVendorForm && (
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
