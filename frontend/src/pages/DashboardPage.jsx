import Sidebar from "../components/Sidebar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const cards = [
  { title: "Bills to Review", value: "0" },
  { title: "Outstanding / Due Soon", value: "$0", note: "0 bills due" },
  { title: "Paid This Month", value: "$0", note: "0 bills paid" },
  { title: "Monthly Spending Total", value: "$0" },
];

// keys match current MVP ERD tables
const columns = [
  { label: "Bill #", key: "bill_number" },
  { label: "Property", key: "property" },
  { label: "Vendor", key: "vendor" },
  { label: "Due Date", key: "due_date" },
  { label: "Amount", key: "amount" },
  { label: "Status", key: "status" },
];

function DashboardPage() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-white text-black">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold">
              Welcome Back, Robert
            </h1>
            <p className="mt-2 text-sm">
              Review pending property bills, track expenses, and record
              payments.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="btn-primary px-5 py-3 text-sm"
              >
                + Add Bill ▾
              </button>
              {open && (
                <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-secondary bg-white py-2 shadow-lg">
                  {["Enter Manually", "Upload Bill"].map((label) => (
                    <button
                      key={label}
                      onClick={() => {
                        setOpen(false);
                        if (label === "Enter Manually") {
                          navigate("/bills/new");
                        }
                      }}
                      className="block w-full px-4 py-2 text-left text-sm font-semibold hover:bg-section"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-secondary px-5 py-3 text-sm">
              Add Property
            </button>
            <button className="btn-secondary px-5 py-3 text-sm">
              Add Vendor
            </button>
          </div>
        </section>

        {/* Summary cards */}
        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map(({ title, value, note }) => (
            <div key={title} className="card">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-3xl font-bold">{value}</p>
              {note && <p className="mt-1 text-sm">{note}</p>}
            </div>
          ))}
        </section>

        {/* Property Bills table */}
        <section className="card mt-8">
          <h2 className="border-b border-black pb-4 text-lg font-bold">
            Property Bills
          </h2>

          <table className="mt-4 w-full text-left text-sm">
            <thead className="hidden md:table-header-group">
              <tr className="text-xs uppercase">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 font-semibold">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="block md:table-row-group">
              <tr className="mb-4 block rounded-lg bg-white p-4 md:mb-0 md:table-row md:bg-transparent md:p-0">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="flex justify-between py-1 md:table-cell md:px-4 md:py-4"
                  >
                    <span className="font-semibold md:hidden">{col.label}</span>
                    {col.key === "status" ? (
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                        Pending
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                ))}
                <td className="block pt-3 md:table-cell md:px-4 md:py-4">
                  <div className="flex gap-2 md:justify-end">
                    <button className="btn-secondary flex-1 px-4 py-2 text-xs md:flex-none">
                      Review
                    </button>
                    <button className="btn-primary flex-1 px-4 py-2 text-xs md:flex-none">
                      Mark Paid
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
