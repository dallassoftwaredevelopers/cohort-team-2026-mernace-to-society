import { useEffect, useState } from "react";
import { supabase } from "../../utils/supabase";

const cards = [
  { title: "Bills to Review", value: "0" },
  { title: "Outstanding Bills", value: "0", note: "Unpaid bills" },
  { title: "Paid This Month", value: "0" },
  { title: "Monthly Spending Total", value: "$0.00" },
];

function BillsSummary() {
  const [reviewBillCount, setReviewBillCount] = useState(null);
  const [isLoadingReviewBillCount, setIsLoadingReviewBillCount] = useState(true);
  const [reviewBillCountError, setReviewBillCountError] = useState("");
  const [outstandingBillCount, setOutstandingBillCount] = useState(null);
  const [isLoadingOutstandingBillCount, setIsLoadingOutstandingBillCount] =
    useState(true);
  const [outstandingBillCountError, setOutstandingBillCountError] = useState("");
  const [paidBillCount, setPaidBillCount] = useState(null);
  const [isLoadingPaidBillCount, setIsLoadingPaidBillCount] = useState(true);
  const [paidBillCountError, setPaidBillCountError] = useState("");
  const [monthlySpendingTotal, setMonthlySpendingTotal] = useState(null);
  const [isLoadingMonthlySpendingTotal, setIsLoadingMonthlySpendingTotal] =
    useState(true);
  const [monthlySpendingTotalError, setMonthlySpendingTotalError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOutstandingBillCount() {
      try {
        const { count, error } = await supabase
          .from("bill")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending", "needs_review", "approved"]);

        if (error) throw error;
        if (count === null) {
          throw new Error("Supabase did not return the outstanding bill count.");
        }

        if (isMounted) {
          setOutstandingBillCount(count);
          setOutstandingBillCountError("");
        }
      } catch (error) {
        if (isMounted) {
          setOutstandingBillCountError(
            error instanceof Error
              ? error.message
              : "Could not load outstanding bills.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingOutstandingBillCount(false);
        }
      }
    }

    loadOutstandingBillCount();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPaidBillCount() {
      try {
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

        const { count, error } = await supabase
          .from("bill")
          .select("*", { count: "exact", head: true })
          .eq("status", "paid")
          .gte("paid_on", startOfMonth)
          .lt("paid_on", startOfNextMonth);

        if (error) throw error;
        if (count === null) {
          throw new Error("Supabase did not return the paid bill count.");
        }

        if (isMounted) {
          setPaidBillCount(count);
          setPaidBillCountError("");
        }
      } catch (error) {
        if (isMounted) {
          setPaidBillCountError(
            error instanceof Error
              ? error.message
              : "Could not load paid bills.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingPaidBillCount(false);
        }
      }
    }

    loadPaidBillCount();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadMonthlySpendingTotal() {
      try {
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

        const { data, error } = await supabase
          .from("bill")
          .select("amount")
          .eq("status", "paid")
          .gte("paid_on", startOfMonth)
          .lt("paid_on", startOfNextMonth);

        if (error) throw error;

        const total = (data ?? []).reduce(
          (sum, bill) => sum + Number(bill.amount || 0),
          0,
        );

        if (isMounted) {
          setMonthlySpendingTotal(total);
          setMonthlySpendingTotalError("");
        }
      } catch (error) {
        if (isMounted) {
          setMonthlySpendingTotalError(
            error instanceof Error
              ? error.message
              : "Could not load monthly spending total.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingMonthlySpendingTotal(false);
        }
      }
    }

    loadMonthlySpendingTotal();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadReviewBillCount() {
      try {
        const { count, error } = await supabase
          .from("bill")
          .select("*", { count: "exact", head: true })
          .eq("status", "needs_review");

        if (error) throw error;
        if (count === null) {
          throw new Error("Supabase did not return the review bill count.");
        }

        if (isMounted) {
          setReviewBillCount(count);
          setReviewBillCountError("");
        }
      } catch (error) {
        if (isMounted) {
          setReviewBillCountError(
            error instanceof Error
              ? error.message
              : "Could not load bills requiring review.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingReviewBillCount(false);
        }
      }
    }

    loadReviewBillCount();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
      {cards.map(({ title, value, note }) => (
        <div key={title} className="card">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p
            className="mt-3 text-2xl font-bold md:text-3xl"
            aria-live="polite"
          >
            {title === "Bills to Review" ? (
              reviewBillCountError ? (
                "—"
              ) : isLoadingReviewBillCount ? (
                "…"
              ) : (
                reviewBillCount
              )
            ) : title === "Outstanding Bills" ? (
              outstandingBillCountError ? (
                "—"
              ) : isLoadingOutstandingBillCount ? (
                "…"
              ) : (
                outstandingBillCount
              )
            ) : title === "Paid This Month" ? (
              paidBillCountError ? (
                "—"
              ) : isLoadingPaidBillCount ? (
                "…"
              ) : (
                paidBillCount
              )
            ) : title === "Monthly Spending Total" ? (
              monthlySpendingTotalError ? (
                "—"
              ) : isLoadingMonthlySpendingTotal ? (
                "…"
              ) : (
                Number(monthlySpendingTotal ?? 0).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              )
            ) : (
              value
            )}
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
          {title === "Paid This Month" ? (
            !paidBillCountError && !isLoadingPaidBillCount && (
              <p className="mt-1 text-xs">Bills paid this month</p>
            )
          ) : (
            note && <p className="mt-1 text-xs">{note}</p>
          )}
        </div>
      ))}
    </section>
  );
}

export default BillsSummary;
