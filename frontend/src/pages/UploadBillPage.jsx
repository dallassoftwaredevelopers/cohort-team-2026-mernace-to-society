import { Link } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import BillDetailsForm from "../components/BillDetailsForm"
import UploadDocument from "../components/UploadDocument"
import Footer from "../components/Footer"

function UploadBillPage() {
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
      <main className="min-w-0 flex-1 p-8">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upload a bill</h2>
            <p className="mt-2 text-sm text-gray-600">
              Upload a bill document or image, then review and complete its details.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              File upload and automatic extraction are not connected yet;
              selecting a file does not send or save it.
            </p>
          </div>
          <Link
            to="/bills"
            className="btn-secondary px-4 py-2 text-sm"
          >
            &larr; Return to Bills
          </Link>
        </section>

        <div className="mt-6 w-full space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="flex min-h-[300px] flex-col items-center rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Document Upload
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Upload your bill or invoice (PDF, JPG, or PNG).
              </p>

              <UploadDocument />
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Bill details
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Review or complete the bill details associated with this file.
              </p>
              <BillDetailsForm />
            </section>
          </div>
        </div>
      </main>
      <Footer />
      </div>
    </div>
  );
}

export default UploadBillPage
