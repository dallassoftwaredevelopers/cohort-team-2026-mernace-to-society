import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PropertyForm from "../components/PropertyForm";
import { usePropertyDetails } from "../hooks/usePropertyDetails";
import { useProperties } from "../hooks/useProperties";
import { useUserProfile } from "../hooks/useUserProfile";
import { canManageRecords } from "../utils/permissions";
import StatusBadge from "../components/StatusBadge";
import { formatCurrency, formatDate } from "../utils/format";

const stackedRowClassName = "stacked-row";
const stackedCellClassName = "stacked-cell";

function PropertyDetailsPage() {
  const { propertyId } = useParams();
  const navigate = useNavigate();

  const { property, bills, loading, error, fetchPropertyDetails } =
    usePropertyDetails();

  const { updateProperty } = useProperties();

  const { profile } = useUserProfile();
  const canEditRecords = canManageRecords(profile?.role);
  const canPay = canEditRecords;

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchPropertyDetails(propertyId);
  }, [propertyId, fetchPropertyDetails]);

  async function handleEditSubmit(propertyData) {
    setIsSubmitting(true);
    setFormError("");
    setSuccessMessage("");

    try {
      await updateProperty(propertyId, propertyData);
      setSuccessMessage("Property updated successfully.");
      setShowForm(false);
      // Refresh property details to reflect the latest values
      await fetchPropertyDetails(propertyId);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to update property.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const totalBills = bills.length;

  const paidBills = bills.filter(
    (bill) => bill.status?.toLowerCase() === "paid",
  );

  const unpaidBills = bills.filter(
    (bill) => bill.status?.toLowerCase() !== "paid",
  );

  const outstandingAmount = unpaidBills.reduce(
    (total, bill) => total + Number(bill.amount || 0),
    0,
  );

  const totalAmount = bills.reduce(
    (total, bill) => total + Number(bill.amount || 0),
    0,
  );

  const infoFields = [
    { label: "Property Name", value: property?.name },
    { label: "Property Type", value: property?.type },
    { label: "Street", value: property?.street },
    { label: "City", value: property?.city },
    { label: "State", value: property?.state },
    { label: "ZIP Code", value: property?.zip },
  ];

  return (
    <>
      {/* Back Navigation & Edit Action Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate("/properties")}
          className="link text-sm"
        >
          ← Back to Properties
        </button>

        {canEditRecords && property && !loading && !error && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-primary px-4 py-2 text-sm"
          >
            Edit Property
          </button>
        )}
      </div>

      {!canEditRecords && (
        <p className="mb-6 text-sm text-gray-600">
          You have read-only access to this property. Contact a manager or
          administrator to make changes.
        </p>
      )}

      {successMessage && (
        <div role="status" className="alert-success mb-6">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-600">
          Loading property details...
        </div>
      ) : error ? (
        <div role="alert" className="alert-error">
          {error}
        </div>
      ) : !property ? (
        <div className="py-16 text-center text-gray-600">
          Property not found.
        </div>
      ) : (
        <>
          {/* Property Header */}
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="page-title md:text-3xl">{property.name}</h1>

              <p className="page-subtitle">
                {[property.street, property.city, property.state, property.zip]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                property.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {property.status
                ? property.status.charAt(0).toUpperCase() +
                  property.status.slice(1)
                : "—"}
            </span>
          </section>

          {/* Property Information */}
          <section className="card mt-8">
            <h2 className="section-title mb-5">Property Information</h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {infoFields.map(({ label, value }) => (
                <div key={label}>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="mt-1 font-semibold">{value || "—"}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Financial Summary */}
          <section className="mt-8">
            <h2 className="mb-4 text-xl font-bold">Bill Summary</h2>

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              <div className="card">
                <p className="text-sm text-gray-500">Total Bills</p>
                <p className="mt-2 text-2xl font-bold">{totalBills}</p>
              </div>

              <div className="card">
                <p className="text-sm text-gray-500">Total Bill Amount</p>
                <p className="mt-2 text-2xl font-bold">
                  {formatCurrency(totalAmount)}
                </p>
              </div>

              <div className="card">
                <p className="text-sm text-gray-500">Paid Bills</p>
                <p className="mt-2 text-2xl font-bold text-green-700">
                  {paidBills.length}
                </p>
              </div>

              <div className="card">
                <p className="text-sm text-gray-500">Outstanding Amount</p>
                <p className="mt-2 text-2xl font-bold text-red-700">
                  {formatCurrency(outstandingAmount)}
                </p>
              </div>
            </div>
          </section>

          {/* Bills Table */}
          <section className="card mt-8">
            <div className="section-header">
              <div>
                <h2 className="text-lg font-bold">Property Bills</h2>
                <p className="mt-1 text-sm text-gray-500">
                  All bills associated with this property.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(canEditRecords ? "/bills/manual" : "/bills/upload")
                }
                className="btn-primary px-4 py-2 text-sm"
              >
                {canEditRecords ? "+ Add Bill" : "Upload Bill"}
              </button>
            </div>

            <div className="table-card mt-4">
              <table className="stacked-table">
                {/* Column headers only show in table view; cards use inline labels */}
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Vendor</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {bills.length === 0 ? (
                    <tr className="stacked-message-row">
                      <td colSpan="7" className="stacked-message">
                        <p className="font-semibold">
                          No bills for this property yet.
                        </p>
                        <p className="mt-2">Add a bill to get started.</p>
                      </td>
                    </tr>
                  ) : (
                    bills.map((bill) => (
                      <tr key={bill.id} className={stackedRowClassName}>
                        <td
                          className={`${stackedCellClassName} @table:whitespace-nowrap`}
                        >
                          <span className="stacked-label">Invoice</span>
                          <button
                            type="button"
                            onClick={() => navigate(`/bills/${bill.id}`)}
                            className="link text-left"
                          >
                            {bill.invoice_number || "—"}
                          </button>
                        </td>

                        <td className={stackedCellClassName}>
                          <span className="stacked-label">Vendor</span>
                          <span className="text-right @table:text-left">
                            {bill.vendor_account?.vendor?.name ||
                              bill.extracted_vendor_name ||
                              "—"}
                            {bill.vendor_account?.service && (
                              <span className="text-gray-500">
                                {" "}
                                · {bill.vendor_account.service}
                              </span>
                            )}
                          </span>
                        </td>

                        <td
                          className={`${stackedCellClassName} @table:whitespace-nowrap`}
                        >
                          <span className="stacked-label">Issue Date</span>
                          {formatDate(bill.issue_date)}
                        </td>

                        <td
                          className={`${stackedCellClassName} @table:whitespace-nowrap`}
                        >
                          <span className="stacked-label">Due Date</span>
                          {formatDate(bill.due_date)}
                        </td>

                        <td
                          className={`${stackedCellClassName} @table:whitespace-nowrap`}
                        >
                          <span className="stacked-label">Amount</span>
                          {formatCurrency(bill.amount)}
                        </td>

                        <td className={stackedCellClassName}>
                          <span className="stacked-label">Status</span>
                          <StatusBadge status={bill.status} />
                        </td>
                        <td className="stacked-actions">
                          {bill.status === "approved" && canPay && (
                            <button
                              type="button"
                              className="btn-primary w-full px-4 py-2 text-xs @table:w-auto"
                            >
                              Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Edit Property Modal */}
      {canEditRecords && showForm && property && (
        <PropertyForm
          key={property.id}
          initialValues={property}
          isEditing={true}
          isSubmitting={isSubmitting}
          error={formError}
          onCancel={() => setShowForm(false)}
          onSubmit={handleEditSubmit}
        />
      )}
    </>
  );
}

export default PropertyDetailsPage;
