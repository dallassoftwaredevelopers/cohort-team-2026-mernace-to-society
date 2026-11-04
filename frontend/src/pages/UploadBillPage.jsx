import { Link } from "react-router-dom";
import BillDetailsForm from "../components/BillDetailsForm";
import UploadDocument from "../components/UploadDocument";

function UploadBillPage() {
  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Upload a bill</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload a bill document or image, then review and complete its
            details.
          </p>
        </div>
        <Link to="/bills" className="btn-secondary px-4 py-2 text-sm">
          &larr; Return to Bills
        </Link>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card flex min-h-[300px] flex-col items-center">
          <h2 className="text-lg font-bold">Document Upload</h2>
          <p className="mt-1 text-sm text-gray-600">
            Upload your bill or invoice (PDF, JPG, or PNG).
          </p>

          <UploadDocument />
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Bill details</h2>
          <p className="mt-1 text-sm text-gray-600">
            Review or complete the bill details associated with this file.
          </p>

          <BillDetailsForm />
        </section>
      </div>
    </>
  );
}

export default UploadBillPage;
