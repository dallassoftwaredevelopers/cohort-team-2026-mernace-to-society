import { Link } from "react-router-dom";
import BillDetailsForm from "../components/BillDetailsForm";
import { useUserProfile } from "../hooks/useUserProfile";
import { canManageRecords } from "../utils/permissions";

function ManualBillIntakePage() {
  const { profile } = useUserProfile();
  const canEditRecords = canManageRecords(profile?.role);

  if (!canEditRecords) {
    return (
      <div className="mx-auto max-w-3xl">
        <section className="card">
          <h1 className="font-serif text-2xl font-bold">
            Manual bill entry unavailable
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Your role allows you to upload and view bills. Contact a manager or
            administrator if a bill needs to be entered manually.
          </p>
          <Link
            to="/bills/upload"
            className="btn-primary mt-6 inline-block px-4 py-2 text-sm"
          >
            Upload a bill
          </Link>
        </section>
      </div>
    );
  }

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
