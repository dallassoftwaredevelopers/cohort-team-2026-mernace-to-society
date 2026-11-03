import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { supabase } from "../../utils/supabase";

const tabs = ["Pending", "Needs Review", "Approved", "Rejected"];
const cellMessageClassName = "px-4 py-12 text-center text-gray-600";

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
  return (
    bill.vendor_account?.vendor?.name ??
    bill.extracted_vendor_name ??
    "—"
  );
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
      return bills.filter(
        (bill) => bill.status === "pending" && Boolean(bill.review_reason),
      );
    }
    if (activeTab === "Pending") {
      return bills.filter(
        (bill) => bill.status === "pending" && !bill.review_reason,
      );
    }
    return bills.filter((bill) => bill.status === activeTab.toLowerCase());
  }, [activeTab, bills]);

  const summaryCards = useMemo(() => {
    const pendingBills = bills.filter((bill) => bill.status === "pending");
    const reviewBills = pendingBills.filter((bill) => Boolean(bill.review_reason));
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
          pendingBills.reduce((total, bill) => total + Number(bill.amount || 0), 0),
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
    setErrorMessage("");
    setActionMessage("");
    const { error } = await supabase.functions.invoke("decide-bill", {
      body: {
        billId: bill.id,
        decision,
        note,
      },
    });

    if (error) {
      setErrorMessage(error.message || "Could not save the bill decision.");
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
    if (!window.confirm(`Approve bill ${bill.invoice_number || "without an invoice number"}?`)) {
      return;
    }
    await submitDecision(bill, "approved");
  }

  async function handleReject(event) {
    event.preventDefault();
    if (!rejectionBill) return;
    await submitDecision(rejectionBill, "rejected", rejectionReason.trim());
  }

  return (
    <div className="flex min-h-screen bg-white text-black">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <section>
            <h1 className="font-serif text-2xl font-bold">Approvals</h1>
            <p className="mt-2 text-sm text-gray-600">
              Review pending bills and track approval decisions.
            </p>
          </section>

          {errorMessage && (
            <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
              {errorMessage}
            </p>
          )}
          {actionMessage && (
            <p role="status" className="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
              {actionMessage}
            </p>
          )}
          {!canApprove && !isLoading && !errorMessage && (
            <p className="mt-4 text-sm text-gray-600">
              You can view bills and decision history. Only managers and admins can approve or reject bills.
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

          <section className="card mt-8 overflow-x-auto">
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

            <table className="mt-4 w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase">
                  {["Invoice #", "Property", "Vendor", "Amount", "Due Date", "Source", "Review Reason", "Status", "Action"].map((column) => (
                    <th key={column} className="px-3 py-3 font-semibold">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={9} className={cellMessageClassName}>Loading approval queue…</td></tr>
                ) : errorMessage ? (
                  <tr><td colSpan={9} className={cellMessageClassName}>Approval queue could not be loaded.</td></tr>
                ) : filteredBills.length === 0 ? (
                  <tr><td colSpan={9} className={cellMessageClassName}>No bills in this category.</td></tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr key={bill.id} className="border-t border-gray-200">
                      <td className="px-3 py-3">{bill.invoice_number || "—"}</td>
                      <td className="px-3 py-3">{bill.property?.name || "—"}</td>
                      <td className="px-3 py-3">
                        {getVendorName(bill)}
                        {bill.vendor_account?.service && (
                          <span className="text-gray-600"> · {bill.vendor_account.service}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">{formatCurrency(bill.amount)}</td>
                      <td className="px-3 py-3">{formatDate(bill.due_date)}</td>
                      <td className="px-3 py-3 capitalize">{bill.source || "—"}</td>
                      <td className="max-w-48 px-3 py-3">{bill.review_reason || "—"}</td>
                      <td className="px-3 py-3 capitalize">{bill.status}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedBill(bill)}
                            className="btn-secondary cursor-pointer px-3 py-2 text-xs"
                          >
                            View
                          </button>
                          {bill.status === "pending" && canApprove && (
                            <>
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => {
                                  setRejectionBill(bill);
                                  setRejectionReason("");
                                }}
                                className="btn-secondary cursor-pointer px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleApprove(bill)}
                                className="btn-primary cursor-pointer px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Approve
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="card mt-8 overflow-x-auto">
            <h2 className="border-b border-black pb-4 text-lg font-bold">
              Approval History
            </h2>
            <table className="mt-4 w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase">
                  {["Date", "Invoice #", "Action", "Status Change", "By", "Note"].map((column) => (
                    <th key={column} className="px-3 py-3 font-semibold">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className={cellMessageClassName}>Loading history…</td></tr>
                ) : errorMessage ? (
                  <tr><td colSpan={6} className={cellMessageClassName}>Approval history could not be loaded.</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={6} className={cellMessageClassName}>No approval decisions yet.</td></tr>
                ) : (
                  history.map((entry) => (
                    <tr key={entry.id} className="border-t border-gray-200">
                      <td className="px-3 py-3">{formatDateTime(entry.created_at)}</td>
                      <td className="px-3 py-3">{entry.invoice_number || "—"}</td>
                      <td className="px-3 py-3 capitalize">{entry.action}</td>
                      <td className="px-3 py-3 capitalize">
                        {entry.from_status || "—"} → {entry.to_status}
                      </td>
                      <td className="px-3 py-3">{entry.actor_name || "System"}</td>
                      <td className="px-3 py-3">{entry.note || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </main>
        <Footer />
      </div>

      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="bill-details-title" className="my-auto w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h2 id="bill-details-title" className="text-xl font-bold">Bill Details</h2>
              <button type="button" onClick={() => setSelectedBill(null)} className="cursor-pointer text-2xl text-gray-500 hover:text-black" aria-label="Close details">&times;</button>
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
                ["Status", selectedBill.status],
                ["Review Reason", selectedBill.review_reason],
                ["Rejection Reason", selectedBill.rejection_reason],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase text-gray-600">{label}</dt>
                  <dd className="mt-1">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}

      {rejectionBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="reject-bill-title" className="my-auto w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 id="reject-bill-title" className="text-xl font-bold">Reject Bill</h2>
            <p className="mt-2 text-sm text-gray-600">
              Add a reason for rejecting invoice {rejectionBill.invoice_number || "without an invoice number"}.
            </p>
            <form onSubmit={handleReject} className="mt-4 space-y-4">
              <label htmlFor="rejection-reason" className="block text-sm font-medium">
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
              <div className="flex justify-end gap-3">
                <button type="button" disabled={isSubmitting} onClick={() => setRejectionBill(null)} className="btn-secondary cursor-pointer px-4 py-2 text-sm disabled:cursor-not-allowed">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || !rejectionReason.trim()} className="btn-primary cursor-pointer px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? "Saving…" : "Reject Bill"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default ApprovalsPage;
