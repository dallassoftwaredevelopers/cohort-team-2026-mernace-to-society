import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import VendorForm from "../components/VendorForm";
import { useVendorDetails } from "../hooks/useVendorDetails";
import { useUserProfile } from "../hooks/useUserProfile";
import { canManageRecords } from "../utils/permissions";
import { supabase } from "../../utils/supabase";

// Until there's room for the table, each row becomes a card with a label
// beside every value (shared classes in index.css)
const stackedRowClassName = "stacked-row";
const stackedCellClassName = "stacked-cell";

// Only link to real web pages, never javascript: or other schemes
function isWebUrl(url) {
  return /^https?:\/\//i.test(url ?? "");
}

function VendorDetailsPage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const canEditRecords = canManageRecords(profile?.role);
  const { vendor, accounts, loading, error, notFound, fetchVendorDetails } =
    useVendorDetails();
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchVendorDetails(vendorId).catch(() => {});
  }, [vendorId, fetchVendorDetails]);

  async function handleAddAccount(accountData) {
    setIsAddingAccount(true);
    setAccountError("");
    setSuccessMessage("");

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-vendor-account",
        {
          method: "POST",
          body: { ...accountData, vendor_id: vendorId },
        },
      );

      if (invokeError) {
        const responseBody = await invokeError.context
          ?.json?.()
          .catch(() => null);
        throw new Error(
          responseBody?.error ||
            invokeError.message ||
            "Could not add vendor account.",
        );
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setShowAddAccountForm(false);
      setSuccessMessage("Vendor account added successfully.");
      await fetchVendorDetails(vendorId);
    } catch (err) {
      setAccountError(
        err instanceof Error ? err.message : "Could not add vendor account.",
      );
    } finally {
      setIsAddingAccount(false);
    }
  }

  const infoFields = [
    { label: "Vendor Name", value: vendor?.name },
    { label: "Aliases", value: vendor?.aliases?.join(", ") },
    { label: "Email", value: vendor?.email },
    { label: "Phone Number", value: vendor?.phone_number },
  ];

  return (
    <>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate("/vendors")}
          className="link text-sm"
        >
          ← Back to Vendors
        </button>
      </div>

      {successMessage && (
        <p role="status" className="alert-success mb-6">
          {successMessage}
        </p>
      )}
      {!canEditRecords && (
        <p className="mb-6 text-sm text-gray-600">
          You have read-only access to this vendor. Contact a manager or
          administrator to make changes.
        </p>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-600">
          Loading vendor details...
        </div>
      ) : error ? (
        <div role="alert" className="alert-error">
          {error}
        </div>
      ) : notFound || !vendor ? (
        <div className="py-16 text-center text-gray-600">Vendor not found.</div>
      ) : (
        <>
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="page-title md:text-3xl">{vendor.name}</h1>
              {isWebUrl(vendor.portal_url) && (
                <a
                  href={vendor.portal_url}
                  target="_blank"
                  rel="noreferrer"
                  className="link mt-2 inline-block text-sm"
                >
                  Vendor portal
                </a>
              )}
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                vendor.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {vendor.status
                ? vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)
                : "—"}
            </span>
          </section>

          <section className="card mt-8">
            <h2 className="section-title mb-5">Vendor Information</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {infoFields.map(({ label, value }) => (
                <div key={label}>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="mt-1 font-semibold">{value || "—"}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card mt-8">
            <div className="section-header">
              <div>
                <h2 className="text-lg font-bold">Vendor Accounts</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Accounts associated with this vendor.
                </p>
              </div>
              {canEditRecords && (
                <button
                  type="button"
                  onClick={() => {
                    setAccountError("");
                    setSuccessMessage("");
                    setShowAddAccountForm(true);
                  }}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  + Add Account
                </button>
              )}
            </div>

            {accounts.length === 0 ? (
              <p className="py-12 text-center text-gray-600">
                This vendor has no associated accounts.
              </p>
            ) : (
              <div className="table-card table-card-compact mt-4">
                <table className="stacked-table">
                  <thead>
                    <tr>
                      <th>Account Number</th>
                      <th>Service</th>
                      <th>Payment Type</th>
                      <th>Status</th>
                      <th>Property</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id} className={stackedRowClassName}>
                        <td className={stackedCellClassName}>
                          <span className="stacked-label">Account #</span>
                          {account.account_number || "—"}
                        </td>
                        <td className={stackedCellClassName}>
                          <span className="stacked-label">Service</span>
                          {account.service || "—"}
                        </td>
                        <td className={`${stackedCellClassName} capitalize`}>
                          <span className="stacked-label">Payment Type</span>
                          {account.payment_type || "—"}
                        </td>
                        <td className={stackedCellClassName}>
                          <span className="stacked-label">Status</span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              account.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {account.status === "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>
                        <td className={stackedCellClassName}>
                          <span className="stacked-label">Property</span>
                          {account.property?.name || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {canEditRecords && showAddAccountForm && vendor && (
        <VendorForm
          addAccountMode
          vendorData={vendor}
          isSubmitting={isAddingAccount}
          error={accountError}
          onCancel={() => setShowAddAccountForm(false)}
          onSubmit={handleAddAccount}
        />
      )}
    </>
  );
}

export default VendorDetailsPage;
