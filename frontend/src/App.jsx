import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import RequireAuth from "./components/RequireAuth";
import LandingPage from "./pages/LandingPage";

// The landing page loads right away; every other page loads only when it's opened
const LoginPage = lazy(() => import("./pages/LoginPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const BillsPage = lazy(() => import("./pages/BillsPage"));
const BillDetailsPage = lazy(() => import("./pages/BillDetailsPage"));
const UploadBillPage = lazy(() => import("./pages/UploadBillPage"));
const ManualBillIntakePage = lazy(() => import("./pages/ManualBillIntakePage"));
const PropertiesPage = lazy(() => import("./pages/PropertiesPage"));
const PropertyDetailsPage = lazy(() => import("./pages/PropertyDetailsPage"));
const VendorsPage = lazy(() => import("./pages/VendorsPage"));
const VendorDetailsPage = lazy(() => import("./pages/VendorDetailsPage"));
const ApprovalsPage = lazy(() => import("./pages/ApprovalsPage"));
const AccountSettingsPage = lazy(() => import("./pages/AccountSettingsPage"));
const FunctionTestPage = lazy(() => import("./pages/FunctionTestPage"));

// Shown for a moment while a page's code downloads
function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500">
      Loading…
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public pages: no sidebar */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

          {/* Logged-in pages share the sidebar + footer layout */}
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="/bills/:billId" element={<BillDetailsPage />} />
            <Route path="/bills/upload" element={<UploadBillPage />} />
            <Route path="/bills/manual" element={<ManualBillIntakePage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route
              path="/properties/:propertyId"
              element={<PropertyDetailsPage />}
            />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/vendors/:vendorId" element={<VendorDetailsPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/settings" element={<AccountSettingsPage />} />
            {/* Dev-only page for calling edge functions directly */}
            {import.meta.env.DEV && (
              <Route path="/dev/functions" element={<FunctionTestPage />} />
            )}
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
