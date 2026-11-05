import { Link } from "react-router-dom";
import BillDetailsForm from "../components/BillDetailsForm";

function ManualBillIntakePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            Add bill details manually
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter the same details used when reviewing an uploaded bill.
          </p>
        </div>
        <Link to="/bills" className="btn-secondary px-4 py-2 text-sm">
          &larr; Return to Bills
        </Link>
      </section>

      <section className="card mt-6">
        <BillDetailsForm />
      </section>
    </div>
  );
}

export default ManualBillIntakePage;
