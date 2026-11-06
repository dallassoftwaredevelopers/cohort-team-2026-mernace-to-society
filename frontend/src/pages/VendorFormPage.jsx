
import { Link } from "react-router-dom";
import  VendorForm from "../components/VendorForm";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";


function VendorFormPage() {
  return (
    <div className="flex min-h-screen bg-white text-black">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-3xl">
            <section className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <Link to="/vendors" className="btn-secondary px-4 py-2 text-sm">
                &larr; Return to Vendors
              </Link>
            </section>

            <section className="card mt-6">
              <VendorForm />
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default VendorFormPage;
