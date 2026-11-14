import BillDetailsForm from "../components/BillDetailsForm";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../utils/supabase";
import { useUserProfile } from "../hooks/useUserProfile";
import { canManageRecords } from "../utils/permissions";

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

const stackedRowClassName =
  "mb-4 block rounded-lg bg-white p-4 md:mb-0 md:table-row md:rounded-none md:border-t md:border-gray-200 md:bg-transparent md:p-0";
const stackedCellClassName =
  "flex justify-between gap-4 py-1 md:table-cell md:px-4 md:py-3";

function formatBillStatus(status) {
  if (status === "needs_review") return "Needs Review";
  if (status === "extraction_failed") return "Couldn't Read";
  return status;
}

function BillsPage() {
  const [open, setOpen] = useState(false);
  const [bills, setBills] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingBill, setEditingBill] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);

  // Filter & Sort States
  const [filterProperty, setFilterProperty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("due_date_asc");

  const navigate = useNavigate();
  const { profile } = useUserProfile();
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

  // Load bills and properties for filters
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [billsRes, propsRes] = await Promise.all([
        supabase
          .from("bill")
          .select(
            "id, invoice_number, issue_date, due_date, amount, status, extracted_vendor_name, review_reason, property_id, vendor_account_id, property(name), vendor_account(service, vendor(name))",
          ),
        supabase.from("property").select("id, name").order("name"),
      ]);

      if (billsRes.error) {
        setErrorMessage("Could not load bills. Please try again.");
      } else {
        setErrorMessage("");
        setBills(billsRes.data || []);
      }

      if (!propsRes.error) {
        setProperties(propsRes.data || []);
      }

      setLoading(false);
    }
    loadData();
  }, [reloadCount]);

  // Filter and Sort Logic
  const filteredAndSortedBills = useMemo(() => {
    let result = [...bills];

    // Filter by Property
    if (filterProperty !== "all") {
      result = result.filter((bill) => bill.property_id === filterProperty);
    }

    // Filter by Status
    if (filterStatus !== "all") {
      result = result.filter((bill) => bill.status === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "due_date_asc":
          return (a.due_date || "").localeCompare(b.due_date || "");
        case "due_date_desc":
          return (b.due_date || "").localeCompare(a.due_date || "");
        case "amount_desc":
          return Number(b.amount || 0) - Number(a.amount || 0);
        case "amount_asc":
          return Number(a.amount || 0) - Number(b.amount || 0);
        case "issue_date_desc":
          return (b.issue_date || "").localeCompare(a.issue_date || "");
        default:
          return 0;
      }
    });

    return result;
  }, [bills, filterProperty, filterStatus, sortBy]);

  function handleBillSaved() {
    setEditingBill(null);
    setReloadCount((count) => count + 1);
  }

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Bills</h1>
          <p className="mt-2 text-sm text-gray-600">
            {canEditRecords
              ? "View and manage bills for your properties."
              : "View bills or upload a new bill for review."}
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
        </div>
      </section>

      {/* Filter & Sort Controls Bar */}
      <section className="card mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Property Filter */}
          <div>
            <label
              htmlFor="filter-property"
              className="block text-xs font-medium text-gray-500 mb-1"
            >
              Property
            </label>
            <select
              id="filter-property"
              value={filterProperty}
              onChange={(e) => setFilterProperty(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Properties</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="filter-status"
              className="block text-xs font-medium text-gray-500 mb-1"
            >
              Status
            </label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="needs_review">Needs Review</option>
              <option value="extraction_failed">Couldn't Read</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Sort Controls */}
        <div>
          <label
            htmlFor="sort-by"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            Sort By
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="due_date_asc">Due Date (Earliest First)</option>
            <option value="due_date_desc">Due Date (Latest First)</option>
            <option value="amount_desc">Amount (Highest First)</option>
            <option value="amount_asc">Amount (Lowest First)</option>
            <option value="issue_date_desc">Issue Date (Newest First)</option>
          </select>
        </div>
      </section>

      <section className="card mt-6">
        <div className="flex items-center justify-between border-b border-black pb-4">
          <h2 className="text-lg font-bold">All Bills</h2>
          <p className="text-sm text-gray-500">
            Showing {filteredAndSortedBills.length} of {bills.length} bills
          </p>
        </div>

        <table className="mt-4 w-full text-left text-sm">
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
            ) : filteredAndSortedBills.length === 0 ? (
              <tr className="block md:table-row">
                <td
                  colSpan={billColumns.length}
                  className={cellMessageClassName}
                >
                  <p className="font-medium text-gray-800">
                    No bills match your filters
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Try adjusting your property or status filters.
                  </p>
                </td>
              </tr>
            ) : (
              filteredAndSortedBills.map((bill) => (
                <tr key={bill.id} className={stackedRowClassName}>
                  <td className={stackedCellClassName}>
                    <span className="font-semibold md:hidden">Invoice #</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/bills/${bill.id}`)}
                      className="text-left font-semibold text-primary hover:text-primary-hover hover:underline"
                    >
                      {bill.invoice_number ?? "—"}
                    </button>
                  </td>
                  <td className={stackedCellClassName}>
                    <span className="font-semibold md:hidden">Property</span>
                    {bill.property?.name ?? "—"}
                  </td>
                  <td className={stackedCellClassName}>
                    <span className="font-semibold md:hidden">Vendor</span>
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
                    <div className="flex flex-wrap items-center gap-2">
                      {canEditRecords && bill.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => setEditingBill(bill)}
                          className="btn-secondary w-full px-4 py-2 text-xs md:w-auto md:bg-transparent md:p-0 md:text-sm md:font-medium md:text-primary md:hover:bg-transparent md:hover:text-primary-hover"
                        >
                          Edit
                        </button>
                      )}
                      {/* Unfinished bills open their page, which has the
                          add property / vendor account helpers */}
                      {canEditRecords &&
                        ["needs_review", "extraction_failed"].includes(bill.status) && (
                        <button
                          type="button"
                          onClick={() => navigate(`/bills/${bill.id}`)}
                          className="btn-secondary w-full px-4 py-2 text-xs md:w-auto md:bg-transparent md:p-0 md:text-sm md:font-medium md:text-primary md:hover:bg-transparent md:hover:text-primary-hover"
                        >
                          Finish
                        </button>
                      )}
                      {canEditRecords && bill.status === "approved" && (
                        <button
                          type="button"
                          // TODO: open the payment flow once payments are built
                          className="btn-primary w-full px-4 py-2 text-xs md:w-auto"
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

      {canEditRecords && editingBill && (
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
