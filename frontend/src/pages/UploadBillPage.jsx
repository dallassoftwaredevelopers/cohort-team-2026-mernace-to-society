import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import FinishBillPanel from "../components/FinishBillPanel";
import UploadDocument from "../components/UploadDocument";
import { formatCurrency, formatDate } from "../utils/format";

function UploadBillPage() {
  // The bill process-bill saved: pending, needs_review or extraction_failed
  const [bill, setBill] = useState(null);
  // Set when there's no account but we recognized the vendor (for Add Account)
  const [vendorId, setVendorId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState("");
  // { message, billId } when this file or invoice was already entered
  const [duplicate, setDuplicate] = useState(null);

  const extracted = bill?.extracted_data ?? null;
  const needsFixing = bill && bill.status !== "pending";

  function resetBill() {
    setBill(null);
    setVendorId(null);
    setProcessError("");
    setDuplicate(null);
  }

  // UploadDocument calls this once the file is in storage. process-bill reads,
  // matches, checks and saves it in one step; nothing to submit afterwards.
  async function handleUploaded(path) {
    resetBill();
    setIsProcessing(true);

    const { data, error } = await supabase.functions.invoke("process-bill", {
      body: { path },
    });

    if (error) {
      // The function's { error } message is on the response body
      const details = await error.context?.json?.().catch(() => null);
      if (error.context?.status === 409) {
        setDuplicate({
          message: details?.error ?? "This bill was already uploaded.",
          billId: details?.duplicate_bill_id ?? null,
        });
      } else {
        setProcessError(
          details?.error ?? "We couldn't process this bill. Please try again.",
        );
      }
    } else {
      // invoke puts the response body in `data`: { data: bill, vendor_id }
      setBill(data.data);
      setVendorId(data.vendor_id ?? null);
    }
    setIsProcessing(false);
  }

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Upload a bill</h1>
          <p className="page-subtitle">
            We'll read the bill, match it to a vendor account and send it for
            approval. If anything is missing, you can fix it here or later from
            the bill's page.
          </p>
        </div>
        <Link to="/bills" className="link text-sm">
          &larr; Back to Bills
        </Link>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card flex min-h-[300px] flex-col items-center">
          <h2 className="text-lg font-bold">Document Upload</h2>
          <p className="mt-1 text-sm text-gray-600">
            Upload your bill or invoice (PDF, JPG, or PNG).
          </p>

          <UploadDocument
            onUploaded={handleUploaded}
            onRemoved={resetBill}
            disabled={isProcessing}
          />
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Bill details</h2>

          {!bill && !isProcessing && !processError && !duplicate && (
            <p className="mt-1 text-sm text-gray-600">
              Upload a file to get started.
            </p>
          )}

          {isProcessing && (
            <p role="status" className="mt-4 text-sm text-gray-600">
              Reading and saving bill...
            </p>
          )}

          {processError && (
            <p role="alert" className="alert-error mt-4">
              {processError}
            </p>
          )}

          {duplicate && (
            <div role="alert" className="alert-error mt-4">
              <p className="font-semibold">{duplicate.message}</p>
              <p className="mt-1 text-sm text-gray-600">
                Nothing new was saved.{" "}
                {duplicate.billId && (
                  <Link to={`/bills/${duplicate.billId}`} className="link">
                    View the existing bill
                  </Link>
                )}
              </p>
            </div>
          )}

          {bill?.status === "pending" && (
            <div role="status" className="alert-success mt-4">
              <p className="font-semibold">Sent for approval</p>
              <p className="mt-1 text-sm text-gray-700">
                {[
                  extracted?.vendor_name,
                  bill.invoice_number && `Invoice ${bill.invoice_number}`,
                  formatCurrency(bill.amount),
                  bill.due_date && `due ${formatDate(bill.due_date)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <Link to={`/bills/${bill.id}`} className="link mt-3 inline-block">
                View bill
              </Link>
            </div>
          )}

          {/* process-bill already knows the vendor, so pass it on. Saving
					    moves the bill to pending, which swaps this for the box above. */}
          {needsFixing && (
            <>
              <FinishBillPanel
                key={bill.id}
                bill={bill}
                vendorId={vendorId}
                onSaved={setBill}
              />
              <p className="mt-4 text-sm text-gray-600">
                Need to stop? It's saved.{" "}
                <Link to={`/bills/${bill.id}`} className="link">
                  Finish it later from the bill's page
                </Link>
                .
              </p>
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default UploadBillPage;
