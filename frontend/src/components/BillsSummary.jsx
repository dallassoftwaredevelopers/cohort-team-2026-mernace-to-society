import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";
import { Link } from "react-router-dom";

const cards = [
  { title: "Bills to Review", value: "0", to: "/bills?status=needs_review" },
  {
    title: "Outstanding Bills",
    value: "0",
    note: "Unpaid bills",
    to: "/approvals",
  },
  { title: "Paid This Month", value: "0", to: "/bills?status=paid" },
  { title: "Monthly Spending Total", value: "$0.00", to: "/bills?status=paid" },
];

function BillsSummary() {
  const [reviewBillCount, setReviewBillCount] = useState(null);
  const [isLoadingReviewBillCount, setIsLoadingReviewBillCount] =
    useState(true);
  const [reviewBillCountError, setReviewBillCountError] = useState("");
  const [outstandingBillCount, setOutstandingBillCount] = useState(null);
  const [isLoadingOutstandingBillCount, setIsLoadingOutstandingBillCount] =
    useState(true);
  const [outstandingBillCountError, setOutstandingBillCountError] =
    useState("");
  const [paidBillCount, setPaidBillCount] = useState(null);
  const [isLoadingPaidBillCount, setIsLoadingPaidBillCount] = useState(true);
  const [paidBillCountError, setPaidBillCountError] = useState("");
  const [monthlySpendingTotal, setMonthlySpendingTotal] = useState(null);
  const [isLoadingMonthlySpendingTotal, setIsLoadingMonthlySpendingTotal] =
    useState(true);
  const [monthlySpendingTotalError, setMonthlySpendingTotalError] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadBillCounts() {
      try {
        const { data, error } = await supabase
          .from("bill")
          .select("id, status, amount, paid_on");

        if (error) throw error;

        if (!isMounted) return;

        const now = new Date();
        const formatDate = (date) =>
          [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0"),
          ].join("-");

        const startOfMonth = formatDate(
          new Date(now.getFullYear(), now.getMonth(), 1),
        );
        const startOfNextMonth = formatDate(
          new Date(now.getFullYear(), now.getMonth() + 1, 1),
        );

        const reviewCount = (data ?? []).filter(
          (b) => b.status === "needs_review",
        ).length;

        const outstandingCount = (data ?? []).filter((b) =>
          ["pending", "needs_review", "approved"].includes(b.status),
        ).length;

        const paidThisMonth = (data ?? []).filter(
          (b) =>
            b.status === "paid" &&
            b.paid_on >= startOfMonth &&
            b.paid_on < startOfNextMonth,
        );

        const paidCount = paidThisMonth.length;
        const spendingTotal = paidThisMonth.reduce(
          (sum, b) => sum + Number(b.amount || 0),
          0,
        );

        if (isMounted) {
          setReviewBillCount(reviewCount);
          setOutstandingBillCount(outstandingCount);
          setPaidBillCount(paidCount);
          setMonthlySpendingTotal(spendingTotal);

          setReviewBillCountError("");
          setOutstandingBillCountError("");
          setPaidBillCountError("");
          setMonthlySpendingTotalError("");

          setIsLoadingReviewBillCount(false);
          setIsLoadingOutstandingBillCount(false);
          setIsLoadingPaidBillCount(false);
          setIsLoadingMonthlySpendingTotal(false);
        }
      } catch (error) {
        if (isMounted) {
          const errorMsg =
            error instanceof Error
              ? error.message
              : "Could not load bill counts";

          setReviewBillCountError(errorMsg);
          setOutstandingBillCountError(errorMsg);
          setPaidBillCountError(errorMsg);
          setMonthlySpendingTotalError(errorMsg);

          setIsLoadingReviewBillCount(false);
          setIsLoadingOutstandingBillCount(false);
          setIsLoadingPaidBillCount(false);
          setIsLoadingMonthlySpendingTotal(false);
        }
      }
    }

    loadBillCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
      {cards.map(({ title, value, note, to }) => (
        <Link
          key={title}
          to={to}
          className="card block transition hover:ring-2 hover:ring-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          <h3 className="text-sm font-semibold">{title}</h3>
          <p
            className="mt-3 text-2xl font-bold break-words xl:text-3xl"
            aria-live="polite"
          >
            {title === "Bills to Review"
              ? reviewBillCountError
                ? "—"
                : isLoadingReviewBillCount
                  ? "…"
                  : reviewBillCount
              : title === "Outstanding Bills"
                ? outstandingBillCountError
                  ? "—"
                  : isLoadingOutstandingBillCount
                    ? "…"
                    : outstandingBillCount
                : title === "Paid This Month"
                  ? paidBillCountError
                    ? "—"
                    : isLoadingPaidBillCount
                      ? "…"
                      : paidBillCount
                  : title === "Monthly Spending Total"
                    ? monthlySpendingTotalError
                      ? "—"
                      : isLoadingMonthlySpendingTotal
                        ? "…"
                        : Number(monthlySpendingTotal ?? 0).toLocaleString(
                            "en-US",
                            {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )
                    : value}
          </p>
          {title === "Bills to Review" && reviewBillCountError && (
            <p role="alert" className="mt-1 text-xs text-red-700">
              Could not load review count: {reviewBillCountError}
            </p>
          )}
          {title === "Outstanding Bills" && outstandingBillCountError && (
            <p role="alert" className="mt-1 text-xs text-red-700">
              Could not load outstanding count: {outstandingBillCountError}
            </p>
          )}
          {title === "Paid This Month" && paidBillCountError && (
            <p role="alert" className="mt-1 text-xs text-red-700">
              Could not load paid count: {paidBillCountError}
            </p>
          )}
          {title === "Monthly Spending Total" && monthlySpendingTotalError && (
            <p role="alert" className="mt-1 text-xs text-red-700">
              Could not load monthly spending total: {monthlySpendingTotalError}
            </p>
          )}
          {title === "Paid This Month"
            ? !paidBillCountError &&
              !isLoadingPaidBillCount && (
                <p className="mt-1 text-xs">Bills paid this month</p>
              )
            : note && <p className="mt-1 text-xs">{note}</p>}
        </Link>
      ))}
    </section>
  );
}

export default BillsSummary;
