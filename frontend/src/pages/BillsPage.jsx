import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";

const billColumns = [
  "Invoice number",
  "Property",
  "Vendor",
  "Issue date",
  "Due date",
  "Amount",
  "Status",
];

const cellMessageClassName = "px-4 py-12 text-center text-gray-600";

// Below md each row becomes a card with a label beside every value
const stackedRowClassName =
  "mb-4 block rounded-lg bg-white p-4 md:mb-0 md:table-row md:rounded-none md:border-t md:border-gray-200 md:bg-transparent md:p-0";
const stackedCellClassName =
  "flex justify-between gap-4 py-1 md:table-cell md:px-4 md:py-3";

function BillsPage() {
  const [open, setOpen] = useState(false);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadBills() {
      // The client sends the logged-in user's token, so RLS decides which rows come back
      const { data, error } = await supabase
        .from("bill")
        .select(
          "id, invoice_number, issue_date, due_date, amount, status, extracted_vendor_name, property(name), vendor_account(service, vendor(name))",
        )
        .order("due_date", { ascending: true });

      if (error) {
        setErrorMessage("Could not load bills. Please try again.");
      } else {
        setBills(data);
      }
      setLoading(false);
    }
    loadBills();
  }, []);

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
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="btn-primary px-5 py-3 text-sm"
            >
              + Add Bill ▾
            </button>
            {open && (
              <div className="absolute left-0 z-10 mt-2 w-48 sm:left-auto sm:right-0 rounded-lg border border-secondary bg-white py-2 shadow-lg">
                {[
                  { label: "Enter Manually", path: "/bills/manual" },
                  { label: "Upload Bill", path: "/bills/upload" },
                ].map(({ label, path }) => (
                  <button
                    key={label}
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
          <thead className="hidden md:table-header-group">
            <tr className="text-xs uppercase">
              {billColumns.map((column) => (
                <th key={column} className="px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          {/* Below md each bill stacks into a labeled card */}
          <tbody className="block md:table-row-group">
            {loading ? (
              <tr className="block md:table-row">
                <td
                  colSpan={billColumns.length}
                  className={`block md:table-cell ${cellMessageClassName}`}
                >
                  Loading bills…
                </td>
              </tr>
            ) : errorMessage ? (
              <tr className="block md:table-row">
                <td
                  colSpan={billColumns.length}
                  className={`block md:table-cell ${cellMessageClassName} text-red-700`}
                >
                  {errorMessage}
                </td>
              </tr>
            ) : bills.length === 0 ? (
              <tr className="block md:table-row">
                <td
                  colSpan={billColumns.length}
                  className={`block md:table-cell ${cellMessageClassName}`}
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
                    {bill.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}

export default BillsPage;
