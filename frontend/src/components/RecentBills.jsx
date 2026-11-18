import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import StatusBadge from "./StatusBadge";
import { formatCurrency, formatDate } from "../utils/format";

const recentBillColumns = 6;

// Until there's room for the table, each row becomes a card with a label
// beside every value (shared classes in index.css)
const stackedRowClassName = "stacked-row";
const stackedCellClassName = "stacked-cell";
const cellMessageClassName = "stacked-message";

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
      <div className="table-card table-card-compact mt-4">
        <table className="stacked-table">
          <thead>
            <tr>
              <th>Bill #</th>
              <th>Property</th>
              <th>Vendor</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="stacked-message-row">
                <td
                  colSpan={recentBillColumns}
                  className={`${cellMessageClassName} text-gray-600`}
                  role="status"
                >
                  Loading recent bills…
                </td>
              </tr>
            ) : errorMessage ? (
              <tr className="stacked-message-row">
                <td
                  colSpan={recentBillColumns}
                  className={`${cellMessageClassName} text-red-700`}
                  role="alert"
                >
                  {errorMessage}
                </td>
              </tr>
            ) : bills.length === 0 ? (
              <tr className="stacked-message-row">
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
                    className={`${stackedCellClassName} @table-compact:whitespace-nowrap`}
                  >
                    <span className="stacked-label">Bill #</span>
                    <Link to={`/bills/${bill.id}`} className="link">
                      {bill.invoice_number ?? "—"}
                    </Link>
                  </td>
                  <td className={stackedCellClassName}>
                    <span className="stacked-label">Property</span>
                    <span className="text-right @table-compact:text-left">
                      {bill.property?.name ?? "—"}
                    </span>
                  </td>
                  <td className={stackedCellClassName}>
                    <span className="stacked-label">Vendor</span>
                    <span className="text-right @table-compact:text-left">
                      {bill.vendor_account?.vendor?.name ??
                        bill.extracted_vendor_name ??
                        "—"}
                    </span>
                  </td>
                  <td
                    className={`${stackedCellClassName} @table-compact:whitespace-nowrap`}
                  >
                    <span className="stacked-label">Due Date</span>
                    {formatDate(bill.due_date)}
                  </td>
                  <td
                    className={`${stackedCellClassName} @table-compact:whitespace-nowrap`}
                  >
                    <span className="stacked-label">Amount</span>
                    {formatCurrency(bill.amount)}
                  </td>
                  <td className={stackedCellClassName}>
                    <span className="stacked-label">Status</span>
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
