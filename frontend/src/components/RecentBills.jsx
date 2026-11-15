import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import StatusBadge from "./StatusBadge";
import { formatCurrency, formatDate } from "../utils/format";

const recentBillColumns = 6;

// Below md each row becomes a card with a label beside every value
const stackedRowClassName =
  "mb-4 block rounded-lg bg-white p-4 md:mb-0 md:table-row md:rounded-none md:border-t md:border-secondary md:bg-transparent md:p-0";
const stackedCellClassName =
  "flex justify-between gap-4 py-1 md:table-cell md:px-4 md:py-4";
const cellMessageClassName = "block px-4 py-8 text-center md:table-cell";

function RecentBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadRecentBills() {
      const { data, error } = await supabase
        .from("bill")
        .select(
          "id, invoice_number, due_date, amount, status, created_at, extracted_vendor_name, property(name), vendor_account(vendor(name))",
        )
        .order("created_at", { ascending: false })
        .limit(7);

      if (!isMounted) return;

      if (error) {
        setErrorMessage("Could not load recent bills. Please try again.");
      } else {
        setBills(data ?? []);
      }

      setLoading(false);
    }

    loadRecentBills();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="card mt-8">
      <h2 className="section-title">Recent Bills</h2>
      <div className="mt-4">
        <table className="w-full text-left text-sm">
          <thead className="hidden md:table-header-group">
            <tr className="text-xs uppercase">
              <th className="px-4 py-3 font-semibold">Bill #</th>
              <th className="px-4 py-3 font-semibold">Property</th>
              <th className="px-4 py-3 font-semibold">Vendor</th>
              <th className="px-4 py-3 font-semibold">Due Date</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {loading ? (
              <tr className="block md:table-row">
                <td
                  colSpan={recentBillColumns}
                  className={`${cellMessageClassName} text-gray-600`}
                  role="status"
                >
                  Loading recent bills…
                </td>
              </tr>
            ) : errorMessage ? (
              <tr className="block md:table-row">
                <td
                  colSpan={recentBillColumns}
                  className={`${cellMessageClassName} text-red-700`}
                  role="alert"
                >
                  {errorMessage}
                </td>
              </tr>
            ) : bills.length === 0 ? (
              <tr className="block md:table-row">
                <td
                  colSpan={recentBillColumns}
                  className={`${cellMessageClassName} text-gray-600`}
                >
                  No bills yet.
                </td>
              </tr>
            ) : (
              bills.map((bill) => (
                <tr key={bill.id} className={stackedRowClassName}>
                  <td
                    className={`${stackedCellClassName} md:whitespace-nowrap`}
                  >
                    <span className="font-semibold md:hidden">Bill #</span>
                    <Link to={`/bills/${bill.id}`} className="link">
                      {bill.invoice_number ?? "—"}
                    </Link>
                  </td>
                  <td className={stackedCellClassName}>
                    <span className="font-semibold md:hidden">Property</span>
                    <span className="text-right md:text-left">
                      {bill.property?.name ?? "—"}
                    </span>
                  </td>
                  <td className={stackedCellClassName}>
                    <span className="font-semibold md:hidden">Vendor</span>
                    <span className="text-right md:text-left">
                      {bill.vendor_account?.vendor?.name ??
                        bill.extracted_vendor_name ??
                        "—"}
                    </span>
                  </td>
                  <td
                    className={`${stackedCellClassName} md:whitespace-nowrap`}
                  >
                    <span className="font-semibold md:hidden">Due Date</span>
                    {formatDate(bill.due_date)}
                  </td>
                  <td
                    className={`${stackedCellClassName} md:whitespace-nowrap`}
                  >
                    <span className="font-semibold md:hidden">Amount</span>
                    {formatCurrency(bill.amount)}
                  </td>
                  <td className={stackedCellClassName}>
                    <span className="font-semibold md:hidden">Status</span>
                    <StatusBadge status={bill.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Link to="/bills" className="link mt-4 inline-block">
        All Bills
      </Link>
    </section>
  );
}

export default RecentBills;
