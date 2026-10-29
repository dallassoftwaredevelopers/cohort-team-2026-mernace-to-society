import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import BillDetailsForm from "../components/BillDetailsForm";

function ManualBillIntakePage() {
  return (
    <div className="flex min-h-screen bg-white text-black">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <section className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#192D4A]">
                Add bill details manually
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Enter the same details used when reviewing an uploaded bill.
              </p>
            </div>
            <Link
              to="/bills"
              className="btn-secondary px-4 py-2 text-sm"
            >
              &larr; Return to Bills
            </Link>
          </section>

          <section className="card mt-6">
            <BillDetailsForm />
          </section>
        </div>
      </main>
      <Footer />
      </div>
    </div>
  );
}

export default ManualBillIntakePage;
