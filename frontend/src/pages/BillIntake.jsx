import { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const initialForm = {
  billNumber: "",
  property: "",
  vendor: "",
  dueDate: "",
  amount: "",
};

const inputClassName =
  "mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function BillIntake() {
  const [form, setForm] = useState(initialForm);
  const [submittedBill, setSubmittedBill] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setSubmittedBill(null);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmittedBill({ ...form, status: "Pending" });
  }

  return (
    <div className="flex min-h-screen bg-white text-black">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-primary hover:underline"
          >
            &larr; Back to dashboard
          </Link>

          <section className="mt-5">
            <h1 className="text-2xl font-bold text-[#192D4A]">
              Enter bill manually
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Add the bill details below. All fields are required.
            </p>
          </section>

          <form
            onSubmit={handleSubmit}
            className="card mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2"
          >
            <label className="text-sm font-semibold text-gray-700">
              Bill number
              <input
                className={inputClassName}
                name="billNumber"
                value={form.billNumber}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Property
              <input
                className={inputClassName}
                name="property"
                value={form.property}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Vendor
              <input
                className={inputClassName}
                name="vendor"
                value={form.vendor}
                onChange={handleChange}
                autoComplete="organization"
                required
              />
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Due date
              <input
                className={inputClassName}
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                required
              />
            </label>

            <label className="text-sm font-semibold text-gray-700 sm:col-span-2">
              Amount
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  className={`${inputClassName} pl-8`}
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  required
                />
              </div>
            </label>

            <p className="text-sm text-gray-600 sm:col-span-2">
              New bills are marked Pending.
            </p>

            <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
              <Link
                to="/dashboard"
                className="btn-secondary px-5 py-3 text-center text-sm"
              >
                Cancel
              </Link>
              <button type="submit" className="btn-primary px-5 py-3 text-sm">
                Preview bill
              </button>
            </div>
          </form>

          {submittedBill && (
            <section
              aria-live="polite"
              className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5"
            >
              <h2 className="font-semibold text-[#192D4A]">Bill preview</h2>
              <p className="mt-2 text-sm text-gray-700">
                {submittedBill.billNumber} for {submittedBill.property} from{" "}
                {submittedBill.vendor} is ready for review, due{" "}
                {submittedBill.dueDate}, for $
                {Number(submittedBill.amount).toFixed(2)}. Status:{" "}
                {submittedBill.status}.
              </p>
              <p className="mt-2 text-sm text-gray-600">
                This preview is not saved. Bill storage is not connected yet.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default BillIntake;
