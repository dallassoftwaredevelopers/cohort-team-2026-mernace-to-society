import { formatBillStatus } from "../utils/format";

// One color per bill status, used everywhere a bill status is shown
const statusStyles = {
  pending: "bg-secondary text-black",
  needs_review: "bg-amber-100 text-amber-900",
  extraction_failed: "bg-orange-100 text-orange-900",
  approved: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
        statusStyles[status] ?? "bg-secondary text-black"
      }`}
    >
      {formatBillStatus(status)}
    </span>
  );
}

export default StatusBadge;
