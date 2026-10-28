import Sidebar from "../components/Sidebar"
import ExtractedInfo from "../components/ExtractedInfo"
import UploadDocument from "../components/UploadDocument"

function BillIntakePage() {
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="min-w-0 flex-1 p-8">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bill Intake</h2>
            <p className="mt-2 text-sm text-gray-600">
              Upload a bill, review extracted details and submit
            </p>
          </div>
        </section>

        <div className="mt-6 w-full space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="flex min-h-[300px] flex-col items-center rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Document Upload
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Upload your bill or invoice document.
              </p>

              <UploadDocument />
              <button type="button" className="m-4 w-48 rounded-md bg-[#2460D5] px-4 py-2 text-sm font-medium text-white hover:bg-[#194DB4]"
              >
                Upload File
              </button>
            </section>

            {/* Extracted Bill Details */}
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Extracted Bill Details
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Review and edit the document details below.
              </p>
              <ExtractedInfo />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BillIntakePage
