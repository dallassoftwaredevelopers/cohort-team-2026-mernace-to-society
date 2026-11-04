import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { useState } from "react";

const cards = [
  { title: "Awaiting Approval", value: "0", note: "$0 total" },
  { title: "Needs Review", value: "0", note: "Flagged after parsing" },
  { title: "Approved This Month", value: "0", note: "$0 approved" },
  { title: "Rejected This Month", value: "0", note: "0 duplicates" },
];

// filters bill.status; final values depend on the bill lifecycle
const tabs = ["Pending", "Needs Review", "Approved", "Rejected"];

// keys match current MVP ERD tables (invoice is a nested object on bill)
const columns = [
  { label: "Bill #", key: "invoice.number" },
  { label: "Property", key: "property" },
  { label: "Vendor", key: "vendor" },
  { label: "Amount", key: "invoice.amountCents" },
  { label: "Due Date", key: "invoice.dueDate" },
  { label: "Source", key: "source" },
  { label: "Review Reason", key: "review_reason" },
  { label: "Status", key: "status" },
];

// audit_trail table; user_id null = System
const activityColumns = [
  { label: "Date", key: "created_at", mobile: true },
  { label: "Bill #", key: "bill_id" },
  { label: "Action", key: "action", mobile: true },
  { label: "Status Change", key: "status_change" },
  { label: "By", key: "user_id" },
  { label: "Note", key: "note" },
];

const hideOnMobile = (col) => (col.mobile ? "" : "hidden md:table-cell");

function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("Pending");

  return (
    <div className="flex min-h-screen bg-white text-black">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <section>
            <h1 className="font-serif text-2xl font-bold">Approvals</h1>
            <p className="mt-2 text-sm">
              Review flagged bills, approve payments, and track every decision.
            </p>
          </section>

          {/* Summary cards */}
          <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {cards.map(({ title, value, note }) => (
              <div key={title} className="card">
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-3 text-3xl font-bold">{value}</p>
                {note && <p className="mt-1 text-xs">{note}</p>}
              </div>
            ))}
          </section>

          {/* Approval queue */}
          <section className="card mt-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-4">
              <h2 className="text-lg font-bold">Approval Queue</h2>
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    aria-pressed={activeTab === tab}
                    className={`${
                      activeTab === tab ? "btn-primary" : "btn-secondary"
                    } px-4 py-2 text-xs`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

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
                {/* Placeholder row — replace with mapped bill data later */}
                <tr className="mb-4 block rounded-lg bg-white p-4 md:mb-0 md:table-row md:bg-transparent md:p-0">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="flex justify-between py-1 md:table-cell md:px-4 md:py-4"
                    >
                      <span className="font-semibold md:hidden">
                        {col.label}
                      </span>
                      {col.key === "status" ? (
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                          {activeTab}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  ))}
                  <td className="block pt-3 md:table-cell md:px-4 md:py-4">
                    <div className="flex gap-2 md:justify-end">
                      <button className="btn-secondary flex-1 px-4 py-2 text-xs md:flex-none">
                        View
                      </button>
                      <button className="btn-secondary flex-1 px-4 py-2 text-xs md:flex-none">
                        Reject
                      </button>
                      <button className="btn-primary flex-1 px-4 py-2 text-xs md:flex-none">
                        Approve
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Approval history (audit_trail) */}
          <section className="card mt-8">
            <h2 className="border-b border-black pb-4 text-lg font-bold">
              Approval History
            </h2>

            <table className="mt-4 w-full rounded-lg bg-white text-left text-sm">
              <thead>
                <tr className="text-xs uppercase">
                  {activityColumns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-3 font-semibold ${hideOnMobile(col)}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Placeholder row (place with mapped audit_trail data later) */}
                <tr className="border-t border-section">
                  {activityColumns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${hideOnMobile(col)}`}
                    >
                      —
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default ApprovalsPage;
