// Shared formatters so bills, amounts and dates look the same on every page

// "needs_review" -> "Needs Review", "approved" -> "Approved"
export function formatBillStatus(status) {
  if (!status) return "—";
  if (status === "needs_review") return "Needs Review";
  if (status === "extraction_failed") return "Couldn't Read";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// 412.8 -> "$412.80". Shows "—" when there's no amount instead of "$0.00"
export function formatCurrency(amount) {
  if (amount == null || amount === "") return "—";
  return Number(amount).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

// "2026-11-28" -> "Nov 28, 2026"
// Adding T00:00:00 keeps the date from shifting a day earlier in US time zones
export function formatDate(value) {
  if (!value) return "—";
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );
}

// "2026-11-13T15:42:00Z" -> "Nov 13, 2026, 10:42 AM" (in the user's time zone)
export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
