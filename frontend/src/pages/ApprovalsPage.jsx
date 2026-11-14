import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabase";

const tabs = ["Pending", "Needs Review", "Approved", "Rejected"];
const cellMessageClassName = "px-4 py-12 text-center text-gray-600";

const queueColumns = [
  "Invoice #",
  "Property",
  "Vendor",
  "Amount",
  "Due Date",
  "Source",
  "Review Reason",
  "Status",
  "Action",
];

// Approval history is scanned, not acted on: phones show Date + Action only
const historyColumns = [
  { label: "Date", mobile: true },
  { label: "Invoice #" },
  { label: "Action", mobile: true },
  { label: "Status Change" },
  { label: "By" },
  { label: "Note" },
];

const hideOnMobile = (mobile) => (mobile ? "" : "hidden md:table-cell");

// Queue rows have actions, so below md each row stacks into a labeled card
const stackedRowClassName =
  "mb-4 block rounded-lg bg-white p-4 md:mb-0 md:table-row md:rounded-none md:bg-transparent md:p-0 md:border-t md:border-gray-200";
const stackedCellClassName =
  "flex justify-between gap-4 py-1 md:table-cell md:px-3 md:py-3";

function MobileLabel({ children }) {
  return <span className="font-semibold md:hidden">{children}</span>;
}

function formatCurrency(value) {
  if (value == null) return "—";
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function getVendorName(bill) {
  return bill.vendor_account?.vendor?.name ?? bill.extracted_vendor_name ?? "—";
}

// What a bill still needs before it can be approved. Mirrors the bill table's
// CHECK (DC-93), which is what actually enforces it.
function missingForApproval(bill) {
  return [
    [bill.vendor_account, "vendor account"],
    [bill.property, "property"],
    [bill.invoice_number, "invoice number"],
    [bill.amount != null, "amount"],
    [bill.issue_date, "issue date"],
    [bill.due_date, "due date"],
  ]
    .filter(([present]) => !present)
    .map(([, label]) => label);
}

function formatBillStatus(status) {
  if (status === "needs_review") return "Needs Review";
  return status;
}

function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("Pending");
  const [bills, setBills] = useState([]);
  const [history, setHistory] = useState([]);
  const [canApprove, setCanApprove] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  // A failed approve/reject. Kept apart from errorMessage, which replaces the
  // whole table and is only for "couldn't load the page".
  const [decisionError, setDecisionError] = useState("");
  const [fileError, setFileError] = useState("");
  const [isOpeningFile, setIsOpeningFile] = useState(false);
  const [rejectionBill, setRejectionBill] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadApprovalData = useCallback(async () => {
    setErrorMessage("");
    const { data, error } = await supabase.functions.invoke("read-approvals");
    if (error) {
      setErrorMessage(error.message || "Could not load approval data.");
      return;
    }

    if (!data || !Array.isArray(data.bills) || !Array.isArray(data.history)) {
      setErrorMessage("The server returned an invalid approval response.");
      return;
    }

    setBills(data.bills);
    setHistory(data.history);
    setCanApprove(data.canApprove === true);
  }, []);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      await loadApprovalData();
      setIsLoading(false);
    }
    load();
  }, [loadApprovalData]);

  const filteredBills = useMemo(() => {
    if (activeTab === "Needs Review") {
      return bills.filter((bill) => bill.status === "needs_review");
    }
    if (activeTab === "Pending") {
      return bills.filter((bill) => bill.status === "pending");
    }
    return bills.filter((bill) => bill.status === activeTab.toLowerCase());
  }, [activeTab, bills]);

  const summaryCards = useMemo(() => {
    const pendingBills = bills.filter((bill) =>
      ["pending", "needs_review"].includes(bill.status),
    );
    const reviewBills = bills.filter((bill) => bill.status === "needs_review");
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const approvedThisMonth = history.filter(
      (entry) =>
        entry.action === "approved" &&
        new Date(entry.created_at) >= startOfMonth,
    );
    const rejectedThisMonth = history.filter(
      (entry) =>
        entry.action === "rejected" &&
        new Date(entry.created_at) >= startOfMonth,
    );

    return [
      {
        title: "Awaiting Approval",
        value: pendingBills.length,
        note: `${formatCurrency(
          pendingBills.reduce(
            (total, bill) => total + Number(bill.amount || 0),
            0,
          ),
        )} total`,
      },
      {
        title: "Needs Review",
        value: reviewBills.length,
        note: "Flagged bills",
      },
      {
        title: "Approved This Month",
        value: approvedThisMonth.length,
        note: `${formatCurrency(
          approvedThisMonth.reduce(
            (total, entry) => total + Number(entry.amount || 0),
            0,
          ),
        )} approved`,
      },
      {
        title: "Rejected This Month",
        value: rejectedThisMonth.length,
        note: "Bills rejected",
      },
    ];
  }, [bills, history]);

  async function submitDecision(bill, decision, note = null) {
    setIsSubmitting(true);
    setDecisionError("");
    setActionMessage("");
    const { error } = await supabase.functions.invoke("decide-bill", {
      body: {
        billId: bill.id,
        decision,
        note,
      },
    });

    if (error) {
      // error.message is always the generic "non-2xx status code"; the real
      // reason is the { error } on the response body
      const details = await error.context?.json?.().catch(() => null);
      setDecisionError(details?.error || "Could not save the bill decision.");
      setIsSubmitting(false);
      return false;
    }

    setActionMessage(
      decision === "approved" ? "Bill approved." : "Bill rejected.",
    );
    setRejectionBill(null);
    setRejectionReason("");
    setSelectedBill(null);
    await loadApprovalData();
    setIsSubmitting(false);
    return true;
  }

  async function handleApprove(bill) {
    // The database refuses to approve an incomplete bill anyway (DC-93);
    // checking here says exactly what's missing instead of failing
    const missing = missingForApproval(bill);
    if (missing.length > 0) {
      setActionMessage("");
      setDecisionError(
        `Bill ${bill.invoice_number || "without an invoice number"} can't be approved yet. It's missing: ${missing.join(", ")}. Fix it on the bill's page first.`,
      );
      return;
    }
    if (
      !window.confirm(
        `Approve bill ${bill.invoice_number || "without an invoice number"}?`,
      )
    ) {
      return;
    }
    await submitDecision(bill, "approved");
  }

  // Opens the uploaded file in a new tab with a link that expires in 5 minutes.
  // Read straight from Supabase: storage and bill policies already decide who
  // may see it, so no edge function is needed.
  async function openOriginal(bill) {
    setFileError("");
    setIsOpeningFile(true);
    // Opened before the awaits so the browser doesn't block it as a popup
    const tab = window.open("", "_blank");
    try {
      const { data: row, error: rowError } = await supabase
        .from("bill")
        .select("file_path")
        .eq("id", bill.id)
        .single();
      if (rowError) throw rowError;
      if (!row?.file_path) throw new Error("This bill has no file attached.");

      const { data, error } = await supabase.storage
        .from("invoices")
        .createSignedUrl(row.file_path, 300);
      if (error) throw error;

      if (tab) tab.location.href = data.signedUrl;
      else window.location.assign(data.signedUrl);
    } catch (err) {
      tab?.close();
      setFileError(err.message || "Could not open the original bill.");
    } finally {
      setIsOpeningFile(false);
    }
  }

  async function handleReject(event) {
    event.preventDefault();
    if (!rejectionBill) return;
    await submitDecision(rejectionBill, "rejected", rejectionReason.trim());
  }

  return (
    <>
      <section>
        <h1 className="font-serif text-2xl font-bold">Approvals</h1>
        <p className="mt-2 text-sm text-gray-600">
          Review pending bills and track approval decisions.
        </p>
      </section>

      {errorMessage && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800"
        >
          {errorMessage}
        </p>
      )}
      {decisionError && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800"
        >
          {decisionError}
        </p>
      )}
      {actionMessage && (
        <p
          role="status"
          className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800"
        >
          {actionMessage}
        </p>
      )}
      {!canApprove && !isLoading && !errorMessage && (
        <p className="mt-4 text-sm text-gray-600">
          You can view bills and decision history. Only managers and admins can
          approve or reject bills.
        </p>
      )}

      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {summaryCards.map(({ title, value, note }) => (
          <div key={title} className="card">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-3 text-3xl font-bold">{isLoading ? "—" : value}</p>
            {note && <p className="mt-1 text-xs">{isLoading ? " " : note}</p>}
          </div>
        ))}
      </section>

      <section className="card mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-4">
          <h2 className="text-lg font-bold">Approval Queue</h2>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-pressed={activeTab === tab}
                className={`${
                  activeTab === tab ? "btn-primary" : "btn-secondary"
                } cursor-pointer px-4 py-2 text-xs`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <table className="mt-4 w-full text-left text-sm">
          <thead className="hidden md:table-header-group">
            <tr className="text-xs uppercase">
              {queueColumns.map((column) => (
                <th key={column} className="px-3 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {isLoading ? (
              <tr className="block md:table-row">
                <td
                  colSpan={9}
                  className={`block md:table-cell ${cellMessageClassName}`}
                >
                  Loading approval queue…
                </td>
              </tr>
            ) : errorMessage ? (
              <tr className="block md:table-row">
                <td
                  colSpan={9}
                  className={`block md:table-cell ${cellMessageClassName}`}
                >
                  Approval queue could not be loaded.
                </td>
              </tr>
            ) : filteredBills.length === 0 ? (
              <tr className="block md:table-row">
                <td
                  colSpan={9}
                  className={`block md:table-cell ${cellMessageClassName}`}
                >
                  No bills in this category.
                </td>
              </tr>
            ) : (
              filteredBills.map((bill) => (
                <tr key={bill.id} className={stackedRowClassName}>
                  <td className={stackedCellClassName}>
                    <MobileLabel>Invoice #</MobileLabel>
                    {bill.invoice_number || "—"}
                  </td>
                  <td className={stackedCellClassName}>
                    <MobileLabel>Property</MobileLabel>
                    {bill.property?.name || "—"}
                  </td>
                  <td className={stackedCellClassName}>
                    <MobileLabel>Vendor</MobileLabel>
                    <span className="text-right md:text-left">
                      {getVendorName(bill)}
                      {bill.vendor_account?.service && (
                        <span className="text-gray-600">
                          {" "}
                          · {bill.vendor_account.service}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className={stackedCellClassName}>
                    <MobileLabel>Amount</MobileLabel>
                    {formatCurrency(bill.amount)}
                  </td>
                  <td className={stackedCellClassName}>
                    <MobileLabel>Due Date</MobileLabel>
                    {formatDate(bill.due_date)}
                  </td>
                  <td className={`${stackedCellClassName} capitalize`}>
                    <MobileLabel>Source</MobileLabel>
                    {bill.source || "—"}
                  </td>
                  <td className={`${stackedCellClassName} md:max-w-48`}>
                    <MobileLabel>Review Reason</MobileLabel>
                    <span className="text-right md:text-left">
                      {bill.review_reason || "—"}
                    </span>
                  </td>
                  <td className={`${stackedCellClassName} capitalize`}>
                    <MobileLabel>Status</MobileLabel>
                    {formatBillStatus(bill.status)}
                  </td>
                  <td className="block pt-3 md:table-cell md:px-3 md:py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBill(bill)}
                        className="btn-secondary flex-1 cursor-pointer px-3 py-2 text-xs md:flex-none"
                      >
                        View
                      </button>
                      {["pending", "needs_review"].includes(bill.status) &&
                        canApprove && (
                          <>
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => {
                                setRejectionBill(bill);
                                setRejectionReason("");
                              }}
                              className="btn-secondary flex-1 cursor-pointer px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60 md:flex-none"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleApprove(bill)}
                              className="btn-primary flex-1 cursor-pointer px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60 md:flex-none"
                            >
                              Approve
                            </button>
                          </>
                        )}
                      {bill.status === "approved" && canApprove && (
                        <button
                          type="button"
                          // TODO: open the payment flow once payments are built
                          className="btn-primary flex-1 cursor-pointer px-3 py-2 text-xs md:flex-none"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="card mt-8">
        <h2 className="border-b border-black pb-4 text-lg font-bold">
          Approval History
        </h2>
        <table className="mt-4 w-full rounded-lg bg-white text-left text-sm">
          <thead>
            <tr className="text-xs uppercase">
              {historyColumns.map(({ label, mobile }) => (
                <th
                  key={label}
                  className={`px-3 py-3 font-semibold ${hideOnMobile(mobile)}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className={cellMessageClassName}>
                  Loading history…
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td colSpan={6} className={cellMessageClassName}>
                  Approval history could not be loaded.
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={6} className={cellMessageClassName}>
                  No approval decisions yet.
                </td>
              </tr>
            ) : (
              history.map((entry) => (
                <tr key={entry.id} className="border-t border-gray-200">
                  <td className="px-3 py-3">
                    {formatDateTime(entry.created_at)}
                  </td>
                  <td className={`px-3 py-3 ${hideOnMobile(false)}`}>
                    {entry.invoice_number || "—"}
                  </td>
                  <td className="px-3 py-3 capitalize">{entry.action}</td>
                  <td className={`px-3 py-3 capitalize ${hideOnMobile(false)}`}>
                    {entry.from_status || "—"} → {entry.to_status}
                  </td>
                  <td className={`px-3 py-3 ${hideOnMobile(false)}`}>
                    {entry.actor_name || "System"}
                  </td>
                  <td className={`px-3 py-3 ${hideOnMobile(false)}`}>
                    {entry.note || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="bill-details-title"
            className="my-auto w-full max-w-xl rounded-xl bg-white p-4 shadow-xl sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h2 id="bill-details-title" className="text-xl font-bold">
                Bill Details
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedBill(null);
                  setFileError("");
                }}
                className="cursor-pointer rounded-lg p-2 text-2xl leading-none text-gray-500 hover:text-black"
                aria-label="Close details"
              >
                &times;
              </button>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                ["Invoice #", selectedBill.invoice_number],
                ["Property", selectedBill.property?.name],
                ["Vendor", getVendorName(selectedBill)],
                ["Amount", formatCurrency(selectedBill.amount)],
                ["Issue Date", formatDate(selectedBill.issue_date)],
                ["Due Date", formatDate(selectedBill.due_date)],
                ["Source", selectedBill.source],
                ["Status", formatBillStatus(selectedBill.status)],
                ["Review Reason", selectedBill.review_reason],
                ["Rejection Reason", selectedBill.rejection_reason],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase text-gray-600">
                    {label}
                  </dt>
                  <dd className="mt-1">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            {/* Only uploaded bills have a file; check it against the numbers above */}
            {selectedBill.source === "upload" && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => openOriginal(selectedBill)}
                  disabled={isOpeningFile}
                  className="btn-secondary px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isOpeningFile ? "Opening…" : "View original bill"}
                </button>
                {fileError && (
                  <p role="alert" className="mt-2 text-sm text-red-700">
                    {fileError}
                  </p>
                )}
              </div>
            )}
            {selectedBill.status === "approved" && canApprove && (
              <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
                <button
                  type="button"
                  // TODO: open the payment flow once payments are built
                  className="btn-primary px-5 py-2.5 text-sm"
                >
                  Pay this bill
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {rejectionBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-bill-title"
            className="my-auto w-full max-w-lg rounded-xl bg-white p-4 shadow-xl sm:p-6"
          >
            <h2 id="reject-bill-title" className="text-xl font-bold">
              Reject Bill
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Add a reason for rejecting invoice{" "}
              {rejectionBill.invoice_number || "without an invoice number"}.
            </p>
            <form onSubmit={handleReject} className="mt-4 space-y-4">
              <label
                htmlFor="rejection-reason"
                className="block text-sm font-medium"
              >
                Rejection reason
              </label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                maxLength={2000}
                rows={4}
                required
                className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {/* Shown here too, since the page's message is behind this dialog */}
              {decisionError && (
                <p role="alert" className="text-sm text-red-700">
                  {decisionError}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setRejectionBill(null);
                    setDecisionError("");
                  }}
                  className="btn-secondary cursor-pointer px-4 py-2 text-sm disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !rejectionReason.trim()}
                  className="btn-primary cursor-pointer px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Saving…" : "Reject Bill"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

export default ApprovalsPage;
