import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BillDetailsForm from "../components/BillDetailsForm";
import FinishBillPanel from "../components/FinishBillPanel";
import { supabase } from "../../utils/supabase";
import { useUserProfile } from "../hooks/useUserProfile";
import { canManageRecords } from "../utils/permissions";

const formatCurrency = (amount) =>
  Number(amount || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

// Saved bills that can't go to approval until someone fills in what's missing
const UNFINISHED = ["needs_review", "extraction_failed"];

function formatBillStatus(status) {
  if (status === "needs_review") return "Needs Review";
  if (status === "extraction_failed") return "Couldn't Read";
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
}

function BillDetailsPage() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const canEditRecords = canManageRecords(profile?.role);

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);

  const fetchBillDetails = async () => {
    if (!billId) {
      setError("Bill ID is required.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("bill")
        .select(
          `
          *,
          property(id, name, street, city, state, zip),
          vendor_account(
            id,
            account_number,
            service,
            vendor(name)
          )
        `
        )
        .eq("id", billId)
        .single();

      if (fetchError) throw fetchError;

      setBill(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to retrieve bill details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillDetails();
  }, [billId]);

  async function handleBillSaved(updatedBill) {
    setSuccessMessage(
      updatedBill?.status === "pending"
        ? "Bill saved and sent for approval."
        : "Bill updated successfully."
    );
    setShowEditForm(false);
    if (updatedBill) {
      // Re-fetch to get fresh joined relations
      await fetchBillDetails();
    }
  }

  const vendorName =
    bill?.vendor_account?.vendor?.name ||
    bill?.extracted_vendor_name ||
    bill?.extracted_data?.vendor_name ||
    "—";

  const serviceName = bill?.vendor_account?.service;
  const accountNumber = bill?.vendor_account?.account_number;

  const infoFields = [
    { label: "Invoice Number", value: bill?.invoice_number },
    { label: "Property", value: bill?.property?.name },
    { label: "Vendor", value: vendorName },
    { label: "Service / Account", value: accountNumber ? `${serviceName || "Service"} (Acct: ${accountNumber})` : serviceName },
    { label: "Issue Date", value: bill?.issue_date },
    { label: "Due Date", value: bill?.due_date },
    { label: "Amount", value: formatCurrency(bill?.amount) },
    { label: "Status", value: formatBillStatus(bill?.status) },
  ];

  // Unfinished bills get the finish panel below instead of the Edit modal
  const isUnfinished = bill && UNFINISHED.includes(bill.status);
  const canEdit = canEditRecords && bill?.status === "pending";

  return (
    <>
      {/* Back Navigation & Edit Action Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate("/bills")}
          className="text-sm font-semibold text-primary hover:underline"
        >
          ← Back to Bills
        </button>

        {canEdit && !loading && !error && (
          <button
            type="button"
            onClick={() => setShowEditForm(true)}
            className="btn-primary px-4 py-2 text-sm"
          >
            Edit Bill
          </button>
        )}
      </div>

      {successMessage && (
        <div
          role="status"
          className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700"
        >
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-600">
          Loading bill details...
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-6 text-red-700">{error}</div>
      ) : !bill ? (
        <div className="py-16 text-center text-gray-600">Bill not found.</div>
      ) : (
        <>
          {/* Bill Header */}
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-bold md:text-3xl">
                Invoice #{bill.invoice_number || "—"}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {vendorName} {serviceName ? `· ${serviceName}` : ""}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${
                bill.status === "paid"
                  ? "bg-green-100 text-green-800"
                  : bill.status === "extraction_failed"
                  ? "bg-red-100 text-red-800"
                  : bill.status === "needs_review"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {formatBillStatus(bill.status)}
            </span>
          </section>

          {/* Bill Information Section */}
          <section className="card mt-8">
            <h2 className="mb-5 border-b border-secondary pb-4 text-lg font-bold">
              Bill Information
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {infoFields.map(({ label, value }) => (
                <div key={label}>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="mt-1 font-semibold">{value || "—"}</p>
                </div>
              ))}
            </div>

            {/* The finish panel shows the reason itself */}
            {bill.review_reason && !isUnfinished && (
              <div className="mt-6 border-t border-secondary pt-4">
                <p className="text-sm text-gray-500">Review Comments / Reason</p>
                <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
                  {bill.review_reason}
                </p>
              </div>
            )}
          </section>

          {/* Same helpers as right after upload, rebuilt from the saved bill */}
          {isUnfinished && (
            <section className="card mt-8">
              <h2 className="text-lg font-bold">Finish this bill</h2>
              <FinishBillPanel
                key={`${bill.id}-${bill.status}`}
                bill={bill}
                onSaved={handleBillSaved}
              />
            </section>
          )}
        </>
      )}

      {/* Edit Bill Modal */}
      {canEdit && showEditForm && bill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Bill</h2>
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="rounded-lg p-2 text-2xl leading-none text-gray-500 hover:text-black"
                aria-label="Close form"
              >
                &times;
              </button>
            </div>

            <BillDetailsForm
              key={bill.id}
              bill={bill}
              onSaved={handleBillSaved}
              onCancel={() => setShowEditForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default BillDetailsPage;