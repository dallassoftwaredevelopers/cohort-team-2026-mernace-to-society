import { Link } from "react-router-dom";
import Footer from "../components/Footer";

function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <main className="mx-auto w-full max-w-3xl flex-1 p-4 md:p-8">
        <Link
          to="/"
          className="text-sm font-semibold text-primary hover:underline"
        >
          &larr; Back to home
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-[#192D4A]">
          Privacy Policy
        </h1>
        <section className="mt-6 rounded-xl border border-gray-200 p-6">
          <p className="text-sm leading-6 text-gray-700">
            This page is a placeholder for approved
            Privacy Policy.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default PrivacyPolicyPage;
