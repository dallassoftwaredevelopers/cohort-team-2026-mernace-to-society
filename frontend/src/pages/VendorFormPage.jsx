import { Link } from "react-router-dom";
import VendorForm from "../components/VendorForm";

function VendorFormPage() {
  return (
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
  );
}

export default VendorFormPage;
