import BillDetailsForm from "../components/BillDetailsForm";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../utils/supabase";

const billColumns = [
  "Invoice number",
  "Property",
  "Vendor",
  "Issue date",
  "Due date",
  "Amount",
  "Status",
  "Actions",
];

const cellMessageClassName =
  "block px-4 py-12 text-center text-gray-600 md:table-cell";

// Below md each row becomes a card with a label beside every value
const stackedRowClassName =
  "mb-4 block rounded-lg bg-white p-4 md:mb-0 md:table-row md:rounded-none md:border-t md:border-gray-200 md:bg-transparent md:p-0";
const stackedCellClassName =
  "flex justify-between gap-4 py-1 md:table-cell md:px-4 md:py-3";

function formatBillStatus(status) {
  if (status === "needs_review") return "Needs Review";
  return status;
}

function BillsPage() {
  const [open, setOpen] = useState(false);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  // The bill whose Edit button was clicked; null keeps the modal closed
  const [editingBill, setEditingBill] = useState(null);

  // Bumping this re-runs the fetch below (e.g. after a bill is edited)
  const [reloadCount, setReloadCount] = useState(0);
  const navigate = useNavigate();

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

  useEffect(() => {
    async function loadBills() {
      // The client sends the logged-in user's token, so RLS decides which rows come back.
      // property_id and vendor_account_id are needed to pre-fill the edit form.
      const { data, error } = await supabase
        .from("bill")
        .select(
          "id, invoice_number, issue_date, due_date, amount, status, extracted_vendor_name, review_reason, property_id, vendor_account_id, property(name), vendor_account(service, vendor(name))",
        )
        .order("due_date", { ascending: true });

      if (error) {
        setErrorMessage("Could not load bills. Please try again.");
      } else {
        setErrorMessage("");
        setBills(data);
      }
      setLoading(false);
    }
    loadBills();
  }, [reloadCount]);

  function handleBillSaved() {
    setEditingBill(null);
    // Re-fetch so the joined property/vendor names reflect the edit
    setReloadCount((count) => count + 1);
  }

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Bills</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage bills for your properties.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="btn-primary px-5 py-3 text-sm"
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
        </div>
      </section>

      <section className="card mt-8">
        <h2 className="border-b border-black pb-4 text-lg font-bold">
          All Bills
        </h2>
        <table className="mt-4 w-full text-left text-sm">
          {/* Column headers only show from md up; cards use inline labels */}
          <thead className="hidden md:table-header-group">
            <tr className="text-xs uppercase">
              {billColumns.map((column) => (
                <th key={column} className="px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {loading ? (
              <tr className="block md:table-row">
                <td
                  colSpan={billColumns.length}
                  className={cellMessageClassName}
                >
                  Loading bills…
                </td>
              </tr>
            ) : errorMessage ? (
              <tr className="block md:table-row">
                <td
                  colSpan={billColumns.length}
                  className={`${cellMessageClassName} text-red-700`}
                >
                  {errorMessage}
                </td>
              </tr>
            ) : bills.length === 0 ? (
              <tr className="block md:table-row">
                <td
                  colSpan={billColumns.length}
                  className={cellMessageClassName}
                >
                  <p className="font-medium text-gray-800">No bills yet</p>
                  <p className="mt-2">
                    Add a bill manually or upload a document to get started.
                  </p>
                </td>
              </tr>
            ) : (
              bills.map((bill) => (
                <tr key={bill.id} className={stackedRowClassName}>
                  <td className={stackedCellClassName}>
                    <span className="font-semibold md:hidden">Invoice #</span>
                    {bill.invoice_number ?? "—"}
                  </td>
                  <td className={stackedCellClassName}>
                    <span className="font-semibold md:hidden">Property</span>
                    {bill.property?.name ?? "—"}
                  </td>
                  <td className={stackedCellClassName}>
                    <span className="font-semibold md:hidden">Vendor</span>
                    {/* Uploaded bills may only have the AI-extracted vendor name */}
                    <span className="text-right md:text-left">
                      {bill.vendor_account?.vendor?.name ??
                        bill.extracted_vendor_name ??
                        "—"}
                      {bill.vendor_account?.service && (
                        <span className="text-gray-600">
                          {" "}
                          · {bill.vendor_account.service}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className={stackedCellClassName}>
                    <span className="font-semibold md:hidden">Issue Date</span>
                    {bill.issue_date ?? "—"}
                  </td>
                  <td className={stackedCellClassName}>
                    <span className="font-semibold md:hidden">Due Date</span>
                    {bill.due_date ?? "—"}
                  </td>
                  <td className={stackedCellClassName}>
                    <span className="font-semibold md:hidden">Amount</span>
                    {bill.amount == null
                      ? "—"
                      : Number(bill.amount).toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                  </td>
                  <td className={`${stackedCellClassName} capitalize`}>
                    <span className="font-semibold md:hidden">Status</span>
                    {formatBillStatus(bill.status)}
                  </td>
                  <td className="block pt-2 md:table-cell md:px-4 md:py-3">
                    {/* Pending and needs-review bills can be edited. */}
                    {["pending", "needs_review"].includes(bill.status) && (
                      <button
                        type="button"
                        onClick={() => setEditingBill(bill)}
                        className="btn-secondary w-full px-4 py-2 text-xs md:w-auto md:bg-transparent md:p-0 md:text-sm md:font-medium md:text-primary md:hover:bg-transparent md:hover:text-primary-hover"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {editingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-xl bg-white p-4 shadow-xl sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Bill</h2>
              <button
                type="button"
                onClick={() => setEditingBill(null)}
                className="rounded-lg p-2 text-2xl leading-none text-gray-500 hover:text-black"
                aria-label="Close form"
              >
                &times;
              </button>
            </div>
            {/* key resets the form if a different bill is opened */}
            <BillDetailsForm
              key={editingBill.id}
              bill={editingBill}
              onSaved={handleBillSaved}
              onCancel={() => setEditingBill(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default BillsPage;
