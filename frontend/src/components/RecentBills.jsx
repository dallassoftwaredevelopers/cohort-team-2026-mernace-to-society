import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../utils/supabase";

const recentBillColumns = 6;

function formatBillStatus(status) {
  if (status === "needs_review") return "Needs Review";
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
}

function formatAmount(amount) {
  if (amount == null) return "—";
  return Number(amount).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

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
      <h2 className="border-b border-black pb-4 text-lg font-bold">
        Recent Bills
      </h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase">
              <th className="px-4 py-3 font-semibold">Bill #</th>
              <th className="px-4 py-3 font-semibold">Property</th>
              <th className="px-4 py-3 font-semibold">Vendor</th>
              <th className="px-4 py-3 font-semibold">Due Date</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={recentBillColumns}
                  className="px-4 py-8 text-center text-gray-600"
                  role="status"
                >
                  Loading recent bills…
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td
                  colSpan={recentBillColumns}
                  className="px-4 py-8 text-center text-red-700"
                  role="alert"
                >
                  {errorMessage}
                </td>
              </tr>
            ) : bills.length === 0 ? (
              <tr>
                <td
                  colSpan={recentBillColumns}
                  className="px-4 py-8 text-center text-gray-600"
                >
                  No bills yet.
                </td>
              </tr>
            ) : (
              bills.map((bill) => (
                <tr key={bill.id} className="border-t border-gray-200">
                  <td className="px-4 py-4">
                    <Link
                      to={`/bills/${bill.id}`}
                      className="font-medium text-primary hover:text-primary-hover hover:underline"
                    >
                      {bill.invoice_number ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-4">{bill.property?.name ?? "—"}</td>
                  <td className="px-4 py-4">
                    {bill.vendor_account?.vendor?.name ??
                      bill.extracted_vendor_name ??
                      "—"}
                  </td>
                  <td className="px-4 py-4">{bill.due_date ?? "—"}</td>
                  <td className="px-4 py-4">{formatAmount(bill.amount)}</td>
                  <td className="px-4 py-4">{formatBillStatus(bill.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Link
        to="/bills"
        className="mt-4 inline-block font-semibold text-primary hover:text-primary-hover hover:underline"
      >
        All Bills
      </Link>
    </section>
  );
}

export default RecentBills;
